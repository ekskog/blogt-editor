var express = require('express');
var router = express.Router();
const tagIndex = require('./tagIndex.json'); // Path to your JSON index file


/* GET users listing. */
router.get('/', async (req, res) => {
    res.render('sandgods', { });
  });

module.exports = router;
