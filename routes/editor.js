
const multer = require('multer');
// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

const path = require('path');
const fs = require('fs').promises;
var debug = require('debug')('blot-too:editor-route');

const {
  fetchBuckets,
  getUploadParams,
  uploadToMinio,
  commitPost
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
    debug('File buffer length:', file.buffer.length);

    // Upload to MinIO (assuming the utility function works as expected)
    const result = await uploadToMinio(file, bucketName, folderPath, fileName);
    debug('Upload result:', result);

    res.render('index', { result });
  } catch (error) {
    console.error('Error handling file upload:', error);
    res.status(500).send('Error uploading file.');
  }
});

// CREATE a new blog post
router.post('/', async (req, res) => {

  // Extract date and text from the request body
  const { date, text, tags, title, uploadImage } = req.body;

try {
    debug("trace 1")
    const result = await commitPost(date, text, tags, title, uploadImage);
    if (result.res == 'ok')
      res.render('post', result.post);
    else {
      let message = 'Error writing to disk';
      let error = result.error;
      res.render('error', { error, message });
    }
  } catch (error) {
    debug(error)
    let message = 'Error writing to disk';
    res.render('error', { error, message });
  }
});


// EDIT an existing blog post
router.get('/edit/', async (req, res) => {
  res.render('editPost', {
    post: {}
  });
});

router.post('/edit/', async (req, res) => {
  const { date, text, action, uploadImage } = req.body;
  const [year, month, day] = date.split('-');

  if (action === 'submit') {
    try {
      const result = await commitPost(date, text, uploadImage);
      if (result.res == 'ok')
        res.render('post', result.post);
      else {
        let message = 'Error writing to disk';
        let error = result.error;
        res.render('error', { error, message });
      }
    } catch (error) {
      let message = 'Error writing to disk';
      res.render('error', { error, message });
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
