const path = require('path');
const fs = require('fs').promises;
const moment = require('moment');  // To easily handle date manipulation
const crypto = require('crypto');
const { marked } = require('marked');
var latestPostPath,
    latestPostDate;

const express = require('express');
const router = express.Router();
const postsDir = path.join(__dirname, '..', 'posts');

async function findLatestPost() {

    console.log('postsDir >> ' + postsDir)
    let latestPostDate = null;
    let latestPostPath = null;

    try {
        const years = await fs.readdir(postsDir);
        for (const year of years) {
            // Only proceed if it's a directory
            const yearPath = path.join(postsDir, year);
            if (!(await fs.stat(yearPath)).isDirectory()) {
                continue;
            }

            const monthsDir = path.join(postsDir, year);
            const months = await fs.readdir(monthsDir);
            
            for (const month of months) {
                // Only proceed if it's a directory
                const monthPath = path.join(monthsDir, month);
                if (!(await fs.stat(monthPath)).isDirectory()) {
                    continue;
                }

                const daysDir = path.join(monthsDir, month);
                const days = await fs.readdir(daysDir);
                
                for (const day of days) {
                    // Only process markdown files
                    if (!day.endsWith('.md')) {
                        continue;
                    }

                    const postPath = path.join(year, month, day);
                    const dateParts = postPath.split('/');
                    const postDate = new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2].replace('.md', '')}`);
                    
                    if (!latestPostDate || postDate > latestPostDate) {
                        latestPostDate = postDate;
                        latestPostPath = postPath;
                    }
                }
            }
        }

        return { latestPostPath, latestPostDate };
    } catch (error) {
        console.error('Error reading post files:', error);
        throw new Error('Could not retrieve post files');
    }
}

function getAdjacentDays(dateString) {
    const year = parseInt(dateString.slice(0, 4));
    const month = parseInt(dateString.slice(4, 6));
    const day = parseInt(dateString.slice(6));
  
    const date = new Date(year, month - 1, day);
  
    // Get previous day
    date.setDate(date.getDate() - 1);
    const prevYear = date.getFullYear();
    const prevMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const prevDay = date.getDate().toString().padStart(2, '0');
    const prevDateString = `${prevYear}${prevMonth}${prevDay}`;
  
    // Get next day
    date.setDate(date.getDate() + 2);
    const nextYear = date.getFullYear();
    const nextMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const nextDay = date.getDate().toString().padStart(2, '0');
    const nextDateString = `${nextYear}${nextMonth}${nextDay}`;
  
    return {
      prev: prevDateString,
      next: nextDateString
    };
  }

function getPreviousDay(dateString) {
    // Parse the input date string
    const year = parseInt(dateString.slice(0, 4), 10);
    const month = parseInt(dateString.slice(4, 6), 10) - 1; // JS months are 0-indexed
    const day = parseInt(dateString.slice(6, 8), 10);

    // Create a Date object and set it to the input date
    const date = new Date(year, month, day);

    // Subtract one day
    date.setDate(date.getDate() - 1);

    // Format the result back to YYYYMMDD
    const resultYear = date.getFullYear();
    const resultMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const resultDay = date.getDate().toString().padStart(2, '0');

    return `${resultYear}${resultMonth}${resultDay}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);

    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');

    let formatted = `${year}${month}${day}`;
    return formatted;
}
router.get('/', async (req, res) => {
    try {
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

                const md5Title = crypto.createHash('md5').update(title).digest('hex');
                const imageUrl = `https://objects.hbvu.su/blotpix/${year}/${month}/${day}.jpeg`;
                const formattedDate = `${day}/${month}/${year}`;

                postsContent.push({ tags, title, md5Title, formattedDate, imageUrl, htmlContent });
                dateString = getPreviousDay(dateString)
            } catch (err) {
                console.error(`No post found for ${year}-${month}-${day}`);
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
    const currentDate = moment.utc(dateString, 'YYYYMMDD').startOf('day');  // Set to the start of the day in UTC

    // Calculate the previous and next dates properly, considering month boundaries
    const nextDate = currentDate.clone().add(1, 'days').format('YYYYMMDD');
    const prevDate = currentDate.clone().subtract(1, 'days').format('YYYYMMDD');

    // We remove the .md extension here in the URL
    let filePath = path.join(postsDir, year, month, `${day}.md`);

    try {
        const data = await fs.readFile(filePath, 'utf8');

        const tagsMatch = data.match(/^Tags:\s*(.+)$/m);
        const titleMatch = data.match(/^Title:\s*(.+)$/m);
        const tags = tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim()) : [];
        const title = titleMatch ? titleMatch[1] : 'Untitled';

        const content = data.replace(/^Tags:.*$/m, '').replace(/^Title:.*$/m, '').trim();
        const htmlContent = marked(content);
        const md5Title = crypto.createHash('md5').update(title).digest('hex');
        const imageUrl = `https://objects.hbvu.su/blotpix/${year}/${month}/${day}.jpeg`;
        const formattedDate = `${day}/${month}/${year}`;

        const postsContent = [];

        const { prev, next } = getAdjacentDays(dateString);
        console.log(`${prev} AND ${next}`);
        postsContent.push({ tags, title, md5Title, formattedDate, imageUrl, htmlContent, prev, next });

        // Render the page and include navigation links
        res.render('post', { postsContent });

    } catch (err) {
        console.error('Error reading post file:', err);
        res.status(404).send('Post not found');
    }
});

async function main() {
    try {
        let latestPost = await findLatestPost();
        latestPostDate = formatDate(latestPost.latestPostDate);
        latestPostPath = latestPost.latestPostPath;
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

// Invoke the main function
main().catch(error => {
    console.error("Unhandled error in main:", error);
    process.exit(1);
});

module.exports = router;