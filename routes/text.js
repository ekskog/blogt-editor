const path = require('path');
const fs = require('fs').promises;
const debug = require('debug')('blogt-editor:text-route');

const express = require('express');
const router = express.Router();
const postsDir = path.join(__dirname, '..', 'posts');

const API_BASE_URL = process.env.BLOGT_API_BASE_URL || 'http://blogt-api:3000';
debug('API Base URL:', API_BASE_URL);

router.get('/', async (req, res) => {
  res.render('new');
});

router.post('/', async (req, res) => {
  let { date, text, tags, title } = req.body;
  const [year, month, day] = date.split('-');
  date = `${day}${month}${year}`;

  try {
    const tagsArray = typeof tags === 'string'
      ? tags.split(',').map(t => t.trim()).filter(Boolean)
      : Array.isArray(tags) ? tags : [];

    const apiUrl = `${API_BASE_URL}/posts/${date}`;
    debug('Creating post via API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, title, tags: tagsArray, content: text })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`API responded with status ${response.status}: ${errText}`);
    }

    return res.render('index');
  } catch (error) {
    debug('Error creating post via API', error.message);
    try {
      const tagsHeader = typeof tags === 'string' ? tags : Array.isArray(tags) ? tags.join(', ') : '';
      const postResult = await commitPost(date, text, tagsHeader, title);
      if (postResult.res !== 'ok') return res.render('error', { error: postResult.error, message: 'Error writing post to disk' });
      await updateTagsDictionary(date, title, tagsHeader);
      return res.render('index');
    } catch (fsError) {
      return res.render('error', { error: fsError, message: 'Error processing request' });
    }
  }
});

router.get('/edit/', async (req, res) => {
  res.render('load', { post: {} });
});

router.post('/load/', async (req, res) => {
  let { date } = req.body;
  const [year, month, day] = date.split('-');
  date = `${day}${month}${year}`;

  try {
    const apiUrl = `${API_BASE_URL}/posts/details/${date}`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`API responded with status ${response.status}`);
    const post = await response.json();
    res.render('edit', { post });
  } catch (error) {
    debug('Error loading post via API:', error.message);
    res.render('error', { message: 'LOAD_FAILED' });
  }
});

router.post('/edit/', async (req, res) => {
  let { date, title, tags, content } = req.body;
  const editedPost = JSON.stringify({ title, tags, content });

  try {
    const apiUrl = `${API_BASE_URL}/posts/${date}`;
    const response = await fetch(apiUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: editedPost });
    if (!response.ok) throw new Error(`API responded with status ${response.status}`);
    return res.render('index');
  } catch (error) {
    debug('Error saving post via API, falling back to filesystem:', error.message);
    return res.render('error', { message: 'SAVE_FAILED' });
  }
});

module.exports = router;
