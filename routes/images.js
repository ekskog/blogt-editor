const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const path = require('path');
const fs = require('fs').promises;
const debug = require('debug')('blogt-editor:images-route');

const { fetchBuckets } = require('../utils/utils');

const express = require('express');
const router = express.Router();

const API_BASE_URL = process.env.BLOGT_API_BASE_URL || 'http://blogt-api:3000';
debug('Images API Base URL:', API_BASE_URL);

router.get('/imgupl', async (req, res) => {
  try {
    const buckets = await fetchBuckets();
    res.render('imgup', { buckets });
  } catch (err) {
    debug('Error fetching buckets for imgup:', err.message);
    res.render('imgup', { buckets: [] });
  }
});

router.post('/imgup', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send('No file uploaded.');

    const { date } = req.body;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).send('Invalid or missing date');
    }

    const [year, month, day] = date.split('-');
    const ddDate = `${day}${month}${year}`;

    const apiUrl = `${API_BASE_URL}/media/images`;
    debug('Uploading image via API:', apiUrl);

    const formData = new FormData();
    formData.append('file', new Blob([file.buffer]), file.originalname);
    formData.append('date', ddDate);

    const response = await fetch(apiUrl, { method: 'POST', body: formData });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('[editor-images] API image upload failed', response.status, response.statusText, errText);
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    debug('Upload result via API:', data);

    res.render('index', { result: `Image uploaded: ${data.url}` });
  } catch (error) {
    console.error('Error handling file upload via API:', error);
    res.status(500).send('Error uploading file.');
  }
});

module.exports = router;
