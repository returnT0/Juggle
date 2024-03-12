const express = require('express');
require('dotenv').config();
const path = require('path');
const axios = require('axios'); // Add axios for making HTTP requests
const bodyParser = require('body-parser'); // Add body-parser to parse request body

const app = express();
const port = 3000;

// API keys (stored securely, not in source code)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const angularAppPath = path.join(__dirname, '../dist/juggle/browser');

app.use(express.static(angularAppPath));
app.use(bodyParser.json()); // Use body-parser

// Proxy endpoint for OpenAI requests
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

// Serve Angular app
app.get('*', (req, res) => {
  res.sendFile(path.join(angularAppPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
