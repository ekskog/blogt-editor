var express = require('express');
var router = express.Router();
const fetch = require('node-fetch');
const API_BASE_URL = process.env.BLOGT_API_BASE_URL || 'http://blogt-api:3000';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'EKSKOG' });
});

// Public help route: proxy the API root so the editor's HELP link can access it without auth
router.get('/help', async (req, res) => {
  try {
    const apiUrl = `${API_BASE_URL}/help.md`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Failed to fetch');
    const md = await response.text();

    // Minimal markdown -> HTML fragment conversion (headings and paragraphs)
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/```[\s\S]*?```/g, (m) => '<pre>' + m.replace(/```/g, '') + '</pre>')
      .replace(/(?:\r\n|\r|\n){2,}/g, '</p><p>')
      .replace(/^/gm, '<p>')
      .replace(/$/gm, '</p>');

    // Cleanup: avoid wrapping headings in <p>
    html = html.replace(/<p>(<h[23]>)/g, '$1').replace(/(<\/h[23]>)<\/p>/g, '$1');

    res.render('help', { helpHtml: html });
  } catch (err) {
    res.render('help', { helpHtml: '<p>Help content not available.</p>' });
  }
});

module.exports = router;
