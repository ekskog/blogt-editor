var express = require('express');
var router = express.Router();
const path = require('path');

let filePath = path.join(__dirname, '..', 'posts');
const tagIndex = require(`${filePath}/tags_index.json`); // Path to JSON tag index file

// Add this new route in your Express app
router.get('/search', (req, res) => {
    const searchTerm = req.query.tag?.toLowerCase();
    if (!searchTerm) {
        return res.render('search', { results: null });
    }

    const matchingTags = Object.keys(tagIndex).filter(tag =>
        tag.toLowerCase().includes(searchTerm)
    );

    const results = matchingTags.map(tag => ({
        tag,
        posts: tagIndex[tag].slice(0, 5) // Get first 5 posts for each matching tag
    }));

    res.render('search', { results, searchTerm });
});

router.get('/tagcloud', (req, res) => {
    if (!tagIndex || typeof tagIndex !== 'object') {
        return res.status(500).send('Tag index is not loaded correctly');
    }

    // Calculate tag frequencies and filter by count
    const tagCounts = Object.keys(tagIndex)
        .map(tag => ({
            name: tag,
            count: Array.isArray(tagIndex[tag]) ? tagIndex[tag].length : 0,
        }))
        .filter(tag => tag.count > 50);  // Only tags with more than 10 occurrences

    if (tagCounts.length === 0) {
        return res.status(404).render('tagcloud', { tagCounts: [] });
    }

    // Send the filtered tag data to the template
    res.render('tagCloud', { tagCounts });
});




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




