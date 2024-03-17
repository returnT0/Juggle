require('dotenv').config();
const express = require('express');
const pdfParse = require('pdf-parse');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

const OPENAI_API_KEY = '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';

const angularAppPath = path.join(__dirname, '../dist/juggle/browser');

app.use(express.static(angularAppPath));
app.use(bodyParser.json());

app.post('/api/openai', async (req, res) => {
  try {
    const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });
    res.json(openaiResponse.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze-pdf', upload.single('pdfFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const text = await pdfParse(req.file.buffer);

    const messages = [
      { role: "user", content: `Summarize this text: ${text.text.substring(0, 4000)}` }
    ];

    const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 150,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });

    res.json(openaiResponse.data);
  } catch (error) {
    console.error("Error in OpenAI request:", error.response ? error.response.data : error.message);
    res.status(500).json({
      message: "Failed to process PDF analysis request.",
      openaiError: error.response ? error.response.data : null,
    });
  }
});


app.get('*', (req, res) => {
  res.sendFile(path.join(angularAppPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
