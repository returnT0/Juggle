require('dotenv').config();
const express = require('express');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const serviceAccount = require('../juggle-f080c-firebase-adminsdk-x9k6r-578d81b3fb.json');
const multer = require('multer');
const {PDFDocument} = require('pdf-lib');
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
const firestore = admin.firestore();
const conditionsCollection = firestore.collection('conditions');
const patternsCollection = firestore.collection('patterns');
const savedConditionsCollection = firestore.collection('savedConditions');
const savedPatternsCollection = firestore.collection('savedPatterns');
const appliedConditionsCollection = firestore.collection('appliedConditions');

app.get('/api/fetch-pattern/:patternId', async (req, res) => {
  const {patternId} = req.params;

  try {
    const patternDoc = await patternsCollection.doc(patternId).get();

    if (!patternDoc.exists) {
      return res.status(404).send({message: 'Pattern not found.'});
    }

    const patternData = patternDoc.data();

    const conditionPromises = patternData.conditionIds.map(conditionId => conditionsCollection.doc(conditionId).get());

    const conditionDocs = await Promise.all(conditionPromises);
    const conditions = conditionDocs.map(doc => {
      if (!doc.exists) {
        console.log(`Condition ${doc.id} not found`);
        return {id: doc.id, text: 'Condition not found or has been removed'};
      }
      return {id: doc.id, ...doc.data()};
    });

    res.json({
      id: patternDoc.id, name: patternData.name, conditions
    });
  } catch (error) {
    console.error("Error fetching pattern:", error);
    res.status(500).send({message: "Failed to fetch pattern.", error: error.message});
  }
});

app.get('/api/fetch-all-patterns', async (req, res) => {
  const {pdfId} = req.query;

  try {
    const patternsSnapshot = await patternsCollection.get();
    const globalPatternsPromises = patternsSnapshot.docs.map(async patternDoc => {
      const patternData = patternDoc.data();

      const conditionPromises = patternData.conditionIds.map(conditionId => conditionsCollection.doc(conditionId).get());
      const conditionDocs = await Promise.all(conditionPromises);
      const conditions = conditionDocs.map(doc => {
        return doc.exists ? {id: doc.id, ...doc.data()} : null;
      }).filter(c => c !== null); // Filter out any null values from missing conditions

      return {
        id: patternDoc.id, name: patternData.name, conditions
      };
    });

    let globalPatterns = await Promise.all(globalPatternsPromises);

    let savedPatterns = [];

    if (pdfId) {
      const savedPatternsSnapshot = await savedPatternsCollection.where('pdfId', '==', pdfId).get();
      const savedPatternsPromises = savedPatternsSnapshot.docs.map(async doc => {
        const savedPatternData = doc.data();
        const conditionPromises = savedPatternData.conditionIds.map(conditionId => conditionsCollection.doc(conditionId).get());
        const conditionDocs = await Promise.all(conditionPromises);
        const conditions = conditionDocs.map(doc => {
          return doc.exists ? {id: doc.id, ...doc.data()} : null;
        }).filter(c => c !== null); // Filter out any nulls

        return {
          id: doc.id, name: savedPatternData.name, conditions
        };
      });

      savedPatterns = await Promise.all(savedPatternsPromises);
    }

    res.json([...globalPatterns, ...savedPatterns]);
  } catch (error) {
    console.error("Error fetching patterns:", error);
    res.status(500).send({message: "Failed to fetch patterns.", error: error.message});
  }
});

app.post('/api/create-pattern', async (req, res) => {
  const {name, conditionIds, pdfId} = req.body;

  if (!name || !conditionIds || !Array.isArray(conditionIds) || conditionIds.length === 0 || !pdfId) {
    return res.status(400).send({message: 'Pattern name, a non-empty array of condition IDs, and a PDF ID are required.'});
  }

  try {
    const patternRef = await savedPatternsCollection.add({
      name, conditionIds, pdfId
    });

    const newPatternDoc = await patternRef.get();

    res.status(201).send({
      id: newPatternDoc.id,
      name: newPatternDoc.data().name,
      conditionIds: newPatternDoc.data().conditionIds,
      pdfId: newPatternDoc.data().pdfId
    });
  } catch (error) {
    console.error("Error creating new pattern:", error);
    res.status(500).send({message: "Failed to create a new pattern.", error: error.message});
  }
});

app.put('/api/edit-pattern/:id', async (req, res) => {
  const {id} = req.params;
  const {newName, newConditions} = req.body;

  if (!newName || !newConditions) {
    return res.status(400).send({message: 'New pattern name and conditions are required.'});
  }

  try {
    await patternsCollection.doc(id).update({
      name: newName, conditions: newConditions
    });

    res.send({message: 'Pattern updated successfully.'});
  } catch (error) {
    console.error("Error updating pattern:", error);
    res.status(500).send({message: "Failed to update the pattern.", error: error.message});
  }
});

app.delete('/api/delete-pattern/:patternId', async (req, res) => {
  const { patternId } = req.params;

  if (!patternId) {
    return res.status(400).send({ message: 'Pattern ID is required.' });
  }

  try {
    const patternDoc = savedPatternsCollection.doc(patternId);
    await patternDoc.delete();
    res.send({ message: 'Pattern successfully deleted.' });
  } catch (error) {
    console.error("Error deleting pattern:", error);
    res.status(500).send({ message: "Failed to delete the pattern.", error: error.message });
  }
});

app.get('/api/fetch-all-conditions', async (req, res) => {
  const {pdfId} = req.query;

  try {
    const conditionsSnapshot = await conditionsCollection.get();
    const predefinedConditions = [];
    conditionsSnapshot.forEach(doc => {
      predefinedConditions.push({
        id: doc.id, ...doc.data()
      });
    });

    const savedConditions = [];

    if (pdfId) {
      const savedConditionsSnapshot = await firestore.collection('savedConditions')
        .where('pdfId', '==', pdfId)
        .get();

      savedConditionsSnapshot.forEach(doc => {
        const docData = doc.data();
        if (docData.conditions) {
          docData.conditions.forEach(condition => {
            savedConditions.push(condition);
          });
        }
      });
    }

    res.json({
      predefined: predefinedConditions, saved: savedConditions
    });
  } catch (error) {
    console.error("Error fetching conditions:", error);
    res.status(500).send({message: "Failed to fetch conditions.", error: error.message});
  }
});

app.post('/api/create-condition', async (req, res) => {
  const {text, pdfId} = req.body;

  if (!text || !pdfId) {
    return res.status(400).send({message: 'Condition text and PDF ID are required.'});
  }

  try {
    const savedConditionsSnapshot = await savedConditionsCollection.where('pdfId', '==', pdfId).limit(1).get();

    if (!savedConditionsSnapshot.empty) {
      const docRef = savedConditionsSnapshot.docs[0].ref;
      await docRef.update({
        conditions: admin.firestore.FieldValue.arrayUnion({text})
      });
    } else {
      await savedConditionsCollection.add({
        pdfId, conditions: [{text}]
      });
    }

    res.status(201).send({text});
  } catch (error) {
    console.error("Error creating new condition:", error);
    res.status(500).send({message: "Failed to create a new condition.", error: error.message});
  }
});

app.put('/api/edit-condition/:id', async (req, res) => {
  const {id} = req.params;
  const {text} = req.body;

  if (!text) {
    return res.status(400).send({message: 'Condition text is required.'});
  }

  try {
    await conditionsCollection.doc(id).update({text});

    const patternsToUpdate = await patternsCollection.where('conditions', 'array-contains', id).get();

    patternsToUpdate.forEach(async (doc) => {
      const pattern = doc.data();
    });

    res.send({message: 'Condition updated successfully.'});
  } catch (error) {
    console.error("Error updating condition:", error);
    res.status(500).send({message: "Failed to update the condition.", error: error.message});
  }
});

app.post('/api/apply-conditions-to-pdf', async (req, res) => {
  const { pdfId, conditionIds } = req.body;

  if (!pdfId || !conditionIds || !Array.isArray(conditionIds)) {
    return res.status(400).send({ message: 'PDF ID and a non-empty array of condition IDs are required.' });
  }

  try {
    const docRef = await appliedConditionsCollection.add({
      pdfId,
      conditionIds
    });

    res.status(201).send({ message: 'Conditions successfully applied to PDF.', id: docRef.id });
  } catch (error) {
    console.error("Error applying conditions to PDF:", error);
    res.status(500).send({ message: "Failed to apply conditions.", error: error.message });
  }
});

app.get('/api/fetch-applied-conditions', async (req, res) => {
  const { pdfId } = req.query;

  if (!pdfId) {
    return res.status(400).send({ message: 'PDF ID is required.' });
  }

  try {
    const snapshot = await appliedConditionsCollection.where('pdfId', '==', pdfId).get();
    const appliedConditionIds = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      appliedConditionIds.push(...data.conditionIds);
    });

    const conditionsDetails = await Promise.all(appliedConditionIds.map(async id => {
      let doc = await conditionsCollection.doc(id).get();
      if (!doc.exists) {
        doc = await savedConditionsCollection.doc(id).get();
      }
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }));

    res.json(conditionsDetails.filter(condition => condition !== null));
  } catch (error) {
    console.error("Error fetching applied conditions:", error);
    res.status(500).send({ message: "Failed to fetch applied conditions.", error: error.message });
  }
});

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

  try {
    const [files] = await bucket.getFiles();
    const metadataPromises = files.map(file => file.getSignedUrl({action: 'read', expires: '03-09-2100'})
      .then(url => ({
        id: file.name, url, path: file.metadata.selfLink
      })));

    const filesMetadata = await Promise.all(metadataPromises);
    res.json(filesMetadata);
  } catch (error) {
    console.error("Error fetching PDF metadata:", error);
    res.status(500).json({
      message: "Failed to fetch PDF metadata from Firebase Storage.", error: error.message,
    });
  }
});

app.delete('/api/delete-pdf', async (req, res) => {
  let {filePath} = req.body;

  if (filePath && filePath.includes('https://')) {
    const matches = filePath.match(/o\/(.+?)$/);
    if (matches && matches[1]) {
      filePath = decodeURIComponent(matches[1]);
    }
  }

  if (!filePath) {
    return res.status(400).send('Valid file path not provided.');
  }

  try {
    const file = bucket.file(filePath);
    await file.delete();
    res.send({message: "File successfully deleted"});
  } catch (error) {
    console.error("Error while deleting file:", error);
    res.status(500).json({
      message: "Failed to delete PDF from Firebase Storage.", error: error.message,
    });
  }
});

app.post('/api/upload-file', multer().single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const fileName = `pdfs/${new Date().getTime()}_${req.file.originalname}`;
  const file = bucket.file(fileName);

  try {
    const options = {
      metadata: {
        contentType: 'application/pdf',
      },
    };

    await file.save(req.file.buffer, options);
    const [url] = await file.getSignedUrl({
      action: 'read', expires: '03-09-2491'
    });
    console.log(`Download URL: ${url}`);
    res.send({url});
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).send('Failed to upload file.');
  }
});

app.post('/api/merge-upload-pdfs', multer().array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No PDF files uploaded.');
  }

  const customFileName = req.body.fileName || 'merged';
  const fileName = `pdfs/${new Date().getTime()}_${customFileName}.pdf`;

  try {
    const mergedPdf = await PDFDocument.create();

    for (const file of req.files) {
      const pdfDoc = await PDFDocument.load(file.buffer);
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();

    const {Readable} = require('stream');
    const readableInstanceStream = new Readable({
      read() {
        this.push(mergedPdfBytes);
        this.push(null);
      }
    });

    const file = bucket.file(fileName);
    readableInstanceStream.pipe(file.createWriteStream({
      metadata: {
        contentType: 'application/pdf'
      }
    }))
      .on('finish', async () => {
        const [url] = await file.getSignedUrl({
          action: 'read', expires: '03-09-2491'
        });
        res.send({url});
      })
      .on('error', (error) => {
        console.error("Error uploading merged PDF:", error);
        res.status(500).send('Failed to upload merged PDF.');
      });

  } catch (error) {
    console.error("Error merging PDFs:", error);
    res.status(500).send('Failed to merge PDF files.');
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(angularAppPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
