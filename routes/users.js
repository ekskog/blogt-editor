var express = require('express');
var router = express.Router();
const tagIndex = require('./tagIndex.json'); // Path to your JSON index file


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
