const fs = require('fs').promises;
const marked = require('marked');

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
app.set('view engine', 'jade');

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


// Serve individual blog posts
app.get('/post/:year/:month/:day', (req, res) => {
    const { year, month, day } = req.params;
    const filePath = path.join(__dirname, 'posts', year, month, `${day}.md`);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(404).send('Entry not found');

        // Extract metadata (tags and title)
        const tagsMatch = data.match(/^Tags:\s*(.+)$/m);
        const titleMatch = data.match(/^Title:\s*(.+)$/m);
        const tags = tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim()) : [];
        const title = titleMatch ? titleMatch[1] : 'Untitled';
        
        // Remove metadata from the content
        const content = data.replace(/^Tags:.*$/m, '').replace(/^Title:.*$/m, '').trim();

        // Render markdown content to HTML
        const htmlContent = marked(content);

        // Generate image URL
        const imageUrl = `https://objects.hbvu.su/blotpix/${year}/${month}/${day}.jpeg`;

        // Pass data to the Pug template
        res.render('post', { tags, title, imageUrl, content: htmlContent });
    });
});
// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
    // Set locals only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // Render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;