const path = require('path');
const fs = require('fs').promises;
const moment = require('moment');  // To easily handle date manipulation
const crypto = require('crypto');
const { marked } = require('marked');

const {
  getNext,
  getPrev,
} = require('../utils/utils');

var express = require('express');
var router = express.Router();
const postsDir = path.join(__dirname, '..', 'posts');

/* GET users listing. */
router.get('/', async (req, res) => {
  res.render('new', { });
});

router.post('/', async (req, res) => {
  // Extract date and text from the request body
  const { date, text } = req.body;

  // Check if date and text are provided
  if (!date || !text) {
      return res.status(400).send('Date and text are required.');
  }

  try {
      // Parse date (assuming format "YYYY-MM-DD")
      const [year, month, day] = date.split('-');

      // Define the file path
      let dirPath = path.join(postsDir, year, month);
      let filePath = path.join(dirPath, `${day}.md`);

      // Ensure the directory exists
      await fs.mkdir(dirPath, { recursive: true });

      // Write the text content to the file
      await fs.writeFile(filePath, text);
      console.log(`editor >> ${filePath} written`)

      // recalculate the latest Post Date
      const tagsMatch = text.match(/^Tags:\s*(.+)$/m);
      const titleMatch = text.match(/^Title:\s*(.+)$/m);
      const tags = tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim()) : [];
      const title = titleMatch ? titleMatch[1] : 'Untitled';

      const content = text.replace(/^Tags:.*$/m, '').replace(/^Title:.*$/m, '').trim();
      const htmlContent = marked(content);
      const md5Title = crypto.createHash('md5').update(content).digest('hex');
      console.log(`Calculated hash: ${md5Title}`)

      const imageUrl = `https://objects.hbvu.su/blotpix/${year}/${month}/${day}.jpeg`;
      const formattedDate = `${day}/${month}/${year}`;

      const postsContent = [];

      const prev = await getPrev(date.replace(/-/g, ""));
      const next = await getNext(date.replace(/-/g, ""));

      console.log(`date: ${date}, prev: ${prev}, next: ${next}`)

      postsContent.push({ tags, title, md5Title, formattedDate, imageUrl, htmlContent, prev, next });

      res.render('post', { postsContent });
  } catch (error) {
      console.error('Error writing file:', error);

  }
});
module.exports = router;
