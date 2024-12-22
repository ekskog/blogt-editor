
const multer = require('multer');
// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { marked } = require('marked');

const {
  getNext,
  getPrev,
  fetchBuckets,
  getUploadParams,
  uploadToMinio
} = require('../utils/utils');

var express = require('express');
var router = express.Router();
const postsDir = path.join(__dirname, '..', 'posts');

/* GET the editor land page listing. */
router.get('/', async (req, res) => {
  res.render('new', {});
});

router.get('/imgupl', async (req, res) => {
  const buckets = await fetchBuckets();
  res.render('imgup', { buckets });
});

router.post('/imgup', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send('No file uploaded.');
    }

    const [year, month, day] = req.body.dateField.split('-');
    var fileName = `${day}.jpeg` || file.originalname;

    const bucketName = 'blotpix';
    var folderPath = `${year}/${month}`;

    const calculatedParams = await getUploadParams();

    // Fallback to calculated values if necessary
    if (!folderPath) {
      folderPath = calculatedParams.filePath;
    }

    if (bucketName === 'blotpix' && !fileName) {
      fileName = calculatedParams.fileName;
    }

    // Log the buffer to ensure it's present
    console.log('File buffer length:', file.buffer.length);

    // Upload to MinIO (assuming the utility function works as expected)
    const result = await uploadToMinio(file, bucketName, folderPath, fileName);
    console.log('Upload result:', result);

    res.render('index', { result });
  } catch (error) {
    console.error('Error handling file upload:', error);
    res.status(500).send('Error uploading file.');
  }
});

// CREATE a new blog post
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

    const imageUrl = `https://objects.hbvu.su/blotpix/${year}/${month}/${day}.jpeg`;
    const formattedDate = `${day}/${month}/${year}`;

    const postsContent = [];

    const prev = await getPrev(date.replace(/-/g, ""));
    const next = await getNext(date.replace(/-/g, ""));

    console.log(`date: ${date}, prev: ${prev}, next: ${next}`)

    postsContent.push({ tags, title, md5Title, formattedDate, imageUrl, htmlContent, prev, next });

    if (req.body.uploadImage) {
      const buckets = await fetchBuckets();

      // Split the input string into year, month, and day
      const [year, month, day] = date.split('-');
      // Reformatted date string
      let dateString = `${day}/${month}/${year}`;

      res.render('imgup', { buckets, dateString });
    } else {
      res.render('post', { postsContent });
    }
  } catch (error) {
    console.error('Error writing file:', error);

  }
});

// EDIT an existing blog post
router.get('/edit/', async (req, res) => {
  res.render('editPost', {
    post: {}
  });
});

router.post('/edit/', async (req, res) => {
  const { date, text, action } = req.body;
  const [year, month, day] = date.split('-');

    if (action === 'submit') {
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

      const imageUrl = `https://objects.hbvu.su/blotpix/${year}/${month}/${day}.jpeg`;
      const formattedDate = `${day}/${month}/${year}`;

      const postsContent = [];

      const prev = await getPrev(date.replace(/-/g, ""));
      const next = await getNext(date.replace(/-/g, ""));

      if (req.body.uploadImage) {
        const buckets = await fetchBuckets();

        // Split the input string into year, month, and day
        const [year, month, day] = date.split('-');
        // Reformatted date string
        let dateString = `${day}/${month}/${year}`;

        res.render('imgup', { buckets, dateString });
      } else {
        res.render('post', { tags, title, md5Title, formattedDate, imageUrl, htmlContent, prev, next });
      }
    } catch (error) {
      console.error('Error writing file:', error);

    }
  } else if (action === 'load') {
    try {
      const filePath = path.join(postsDir, year, month, `${day}.md`);
      const fileContent = await fs.readFile(filePath, 'utf8');
      // Render edit page with existing content
      res.render('editPost', {
        post: {
          date,
          content: fileContent
        }
      });
    } catch (error) {
      console.error('Error reading post for editing:', error);
      res.render('error', { error: 'Post not found' });
    }
  }
});

module.exports = router;
