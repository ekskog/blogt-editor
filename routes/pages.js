const path = require('path');

const express = require('express');
const router = express.Router();

router.get('/archives', async (req, res) => {
  res.json('archives');
});

router.get('/about', async (req, res) => {
    res.json('about');
  });

module.exports = router;