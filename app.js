const fs = require('fs').promises;
const moment = require('moment');  // To easily handle date manipulation
const crypto = require('crypto');
const { marked } = require('marked');
var latestPostPath,
    latestPostDate;


const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Conditionally enable logging with Morgan
if (process.env.LOGGING === 'true') {
    app.use(logger('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);

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
async function findLatestPost() {
    const postsDir = path.join(__dirname, 'posts');

    try {
        const years = await fs.readdir(postsDir);

        for (const year of years) {
            const monthsDir = path.join(postsDir, year);
            const months = await fs.readdir(monthsDir);

            for (const month of months) {
                const daysDir = path.join(monthsDir, month);
                const days = await fs.readdir(daysDir);

                for (const day of days) {
                    const postPath = path.join(year, month, day);
                    const dateParts = postPath.split('/');
                    const postDate = new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2].replace('.md', '')}`);

                    // Check if this post is more recent than the current latest
                    if (!latestPostDate || postDate > latestPostDate) {
                        latestPostDate = postDate;
                        latestPostPath = postPath; // Store the path of the latest post
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

app.get('/', async (req, res) => {
    try {
        if (!latestPostPath) {
            return res.status(404).json({ error: 'No posts found' });
        }

        const postsContent = [];
        const year = latestPostDate.slice(0, 4);
        const month = latestPostDate.slice(4, 6);
        const day = latestPostDate.slice(6, 8);
        var dateString = latestPostDate;

        // Get the latest 10 posts starting from the found latest post date
        for (let i = 0; i < 10; i++) {
            const year = dateString.slice(0, 4);
            const month = dateString.slice(4, 6);
            const day = dateString.slice(6, 8);
            let filePath = path.join(__dirname, 'posts', year, month, `${day}.md`);

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
        res.render('index', {
            postsContent
        });
    }
    catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




// Serve individual blog posts by date (without the .md extension)
app.get('/:dateString', async (req, res) => {
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
    const filePath = path.join(__dirname, 'posts', year, month, `${day}.md`);

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

        // Render the page and include navigation links

        res.render('post', {
            title,
            tags,
            md5Title,
            imageUrl,
            content: htmlContent,
            formattedDate,
            prevPost: prevDate,
            nextPost: nextDate
        });

    } catch (err) {
        console.error('Error reading post file:', err);
        res.status(404).send('Post not found');
    }
});

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
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

module.exports = app;
