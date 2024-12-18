const path = require('path');
const fs = require('fs').promises;
const moment = require('moment');  // To easily handle date manipulation
const crypto = require('crypto');
const { marked } = require('marked');
var debug = require('debug');

var latestPostPath,
    latestPostDate;

const {
    findLatestPost,
    getNext,
    getPrev,
    formatDate
} = require('../utils/utils');

const express = require('express');
const router = express.Router();
const postsDir = path.join(__dirname, '..', 'posts');

router.get('/', async (req, res) => {
    try {
        let latestPost = await findLatestPost();
        latestPostDate = formatDate(latestPost.latestPostDate);
        latestPostPath = latestPost.latestPostPath;
        debug(`[MAIN] Latest post date: ${JSON.stringify(latestPost)}`)
        
        if (!latestPostPath) {
            return res.status(404).json({ error: 'No posts found' });
        }

        const postsContent = [];
        const page = parseInt(req.query.page) || 1; // Get the page number from the query, default to 1
        const postsPerPage = 10; // Number of posts per page
        let dateString = latestPostDate; // Start with the latest post date

        // Loop to get the posts for the requested page
        for (let i = 0; i < postsPerPage; i++) {
            const year = dateString.slice(0, 4);
            const month = dateString.slice(4, 6);
            const day = dateString.slice(6, 8);
            let filePath = path.join(__dirname, '..', 'posts', year, month, `${day}.md`);

            try {
                const data = await fs.readFile(filePath, 'utf-8');
                const tagsMatch = data.match(/^Tags:\s*(.+)$/m);
                const titleMatch = data.match(/^Title:\s*(.+)$/m);
                const tags = tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim()) : [];
                const title = titleMatch ? titleMatch[1] : 'Untitled';

                const content = data.replace(/^Tags:.*$/m, '').replace(/^Title:.*$/m, '').trim();
                const htmlContent = marked(content);

                const md5Title = crypto.createHash('md5').update(content).digest('hex');
                const imageUrl = `https://objects.hbvu.su/blotpix/${year}/${month}/${day}.jpeg`;
                const formattedDate = `${day}/${month}/${year}`;

                postsContent.push({ tags, title, md5Title, formattedDate, imageUrl, htmlContent });
                dateString = await getPrev(dateString)
            } catch (err) {
                //console.error(`No post found for ${year}-${month}-${day}`);
                dateString = await getPrev(dateString)
                // Continue to next date if file does not exist
            }
        }

        // Pagination logic
        const totalPosts = 100; // This should be the total number of posts (you might want to count posts dynamically)
        const totalPages = Math.ceil(totalPosts / postsPerPage);
        const currentPage = page;
        res.render('posts', {
            postsContent,
            currentPage,
            totalPages
        });
    }
    catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:dateString', async (req, res) => {

    const { dateString } = req.params;

    // Ensure dateString is in the format YYYYMMDD
    if (!/^\d{8}$/.test(dateString)) {
        return res.status(400).send('Invalid date format. Use YYYYMMDD.');
    }

    const year = dateString.slice(0, 4);
    const month = dateString.slice(4, 6);
    const day = dateString.slice(6, 8);

    // Use moment to ensure we are manipulating only the date (start of the day)
    let filePath = path.join(postsDir, year, month, `${day}.md`);

    try {
        const data = await fs.readFile(filePath, 'utf8');

        const tagsMatch = data.match(/^Tags:\s*(.+)$/m);
        const titleMatch = data.match(/^Title:\s*(.+)$/m);
        const tags = tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim()) : [];
        const title = titleMatch ? titleMatch[1] : 'Untitled';

        const content = data.replace(/^Tags:.*$/m, '').replace(/^Title:.*$/m, '').trim();
        const htmlContent = marked(content);
        const md5Title = crypto.createHash('md5').update(content).digest('hex');

        const imageUrl = `https://objects.hbvu.su/blotpix/${year}/${month}/${day}.jpeg`;
        const formattedDate = `${day}/${month}/${year}`;

        const postsContent = [];

        const prev = await getPrev(dateString);
        const next = await getNext(dateString);

        postsContent.push({ tags, title, md5Title, formattedDate, imageUrl, htmlContent, prev, next });

        // Render the page and include navigation links
        res.render('post', { tags, title, md5Title, formattedDate, imageUrl, htmlContent, prev, next });

    } catch (err) {
        console.error('Error reading post file:', err);
        res.status(404).send('Post not found');
    }
});

module.exports = router;