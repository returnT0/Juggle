require('dotenv').config();
const express = require('express');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const serviceAccount = require('../juggle-f080c-firebase-adminsdk-x9k6r-578d81b3fb.json');

const app = express();
const port = 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const angularAppPath = path.join(__dirname, '../dist/juggle/browser');

app.use(express.static(angularAppPath));
app.use(bodyParser.json());
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount), storageBucket: "juggle-f080c.appspot.com"
});
const bucket = admin.storage().bucket();

app.post('/api/analyze-pdf-firebase', async (req, res) => {
  let {pdfFileName} = req.body;

  if (!pdfFileName) {
    return res.status(400).send('PDF file name not provided.');
  }

  pdfFileName = decodeURIComponent(pdfFileName);

  try {
    const file = bucket.file(pdfFileName);

    const [fileBuffer] = await file.download();
    const text = await pdfParse(fileBuffer);

    const messages = [{role: "user", content: `Summarize this text: ${text.text.substring(0, 48000)}`}];

    const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo", messages: messages, temperature: 0.7, max_tokens: 400,
    }, {
      headers: {
        'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });

    res.json(openaiResponse.data);
  } catch (error) {
    console.error("Error in Firebase or OpenAI request:", error.response ? error.response.data : error.message);
    res.status(500).json({
      message: "Failed to retrieve or analyze PDF from Firebase Storage.",
      error: error.response ? error.response.data : error.message,
    });
  }
});

app.get('/api/fetch-all-pdfs', async (req, res) => {
  const pdfsPrefix = 'pdfs/'; // Note the trailing slash, which can be important for directory-like access

  try {
    const [files] = await bucket.getFiles({
      prefix: pdfsPrefix,
      delimiter: '/' // This helps simulate directory-like structure
    });

    const metadataPromises = files.map(file => file.getSignedUrl({
      action: 'read',
      expires: '2091-09-03T00:00:00Z' // Using an ISO 8601 format for clarity
    }).then(url => ({
      id: file.name,
      url: url[0], // Assuming the first URL is what we want
      path: `gs://juggle-f080c.appspot.com/${file.name}` // Constructing the full path
    })));

    const filesMetadata = await Promise.all(metadataPromises);
    res.json(filesMetadata);
  } catch (error) {
    console.error("Error listing PDF files from Firebase Storage:", error.message);
    res.status(500).json({
      message: "Failed to list PDF files from Firebase Storage.",
      error: error.message,
    });
  }
});


app.get('*', (req, res) => {
  res.sendFile(path.join(angularAppPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});