const fs = require('fs').promises;
const moment = require('moment');  // To easily handle date manipulation
const crypto = require('crypto');
const { marked } = require('marked');
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

app.use('/', indexRouter);
app.use('/users', usersRouter);


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

    console.log('Current Date:', currentDate.format('YYYY-MM-DD'));
    console.log('Next Date:', nextDate);
    console.log('Previous Date:', prevDate);

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

module.exports = app;
