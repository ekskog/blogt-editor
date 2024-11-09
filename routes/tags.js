var express = require('express');
var router = express.Router();
const path = require('path');

let filePath = path.join(__dirname, '..', 'public', 'files');
const tagIndex = require(`${filePath}/tag_Index.json`); // Path to JSON tag index file

router.get('/:tagName', (req, res) => {
    let { tagName } = req.params;
    tagName = decodeURIComponent(tagName); // Decode the tag name to handle multi-word and special characters

    const latest = req.query.latest === 'true'; // Check for 'latest' query parameter

    const normalizedTag = tagName.toLowerCase();
    const page = parseInt(req.query.page) || 1;
    const postsPerPage = 10;

    let postFiles = tagIndex[normalizedTag] || [];
    console.log(`${tagName} >> ${postFiles.length}`);

    if (postFiles.length === 0) {
        return res.render('noPosts', { tagName });
    }

    // Get the latest 5 posts if requested
    const postsToDisplay = latest
        ? postFiles.slice(-5) // Slice the last 5 items from the array
        : postFiles.slice((page - 1) * postsPerPage, page * postsPerPage); // Paginate normally if not 'latest'

    // Format the posts' dates and titles
    const formattedPosts = postsToDisplay.map(post => {
        const { date, title } = post;
        const formattedDate = `${date.slice(6, 8)}/${date.slice(4, 6)}/${date.slice(0, 4)}`;
        return { date: formattedDate, title, urlDate: date };
    });

    // Pagination data
    const totalPages = Math.ceil(postFiles.length / postsPerPage);
    const currentPage = latest ? 1 : page; // If 'latest' is true, we show page 1

    const counter = postFiles.length
    // Render the page with the posts
    res.render('postsByTag', {
        postFiles: formattedPosts,
        tagName,
        counter,
        latestPosts: postFiles.slice(-5), // The last 5 items for the "latest" posts link
        currentPage,
        totalPages
    });
});

    module.exports = router;



