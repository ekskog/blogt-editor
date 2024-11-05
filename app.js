const fs = require('fs').promises;
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
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

// Helper function to get all post dates
async function getAllPostDates() {
  const postsDir = path.join(__dirname, 'posts');
  const years = await fs.readdir(postsDir);
  let allDates = [];

  for (const year of years) {
    const monthsDir = path.join(postsDir, year);
    const months = await fs.readdir(monthsDir);
    for (const month of months) {
      const daysDir = path.join(monthsDir, month);
      const days = await fs.readdir(daysDir);
      allDates = allDates.concat(days.map(day => `${year}-${month}-${day.replace('.md', '')}`));
    }
  }

  return allDates.sort().reverse(); // Sort in descending order
}

// Endpoint to get paginated post dates
app.get('/post-dates', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const allDates = await getAllPostDates();
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedDates = allDates.slice(startIndex, endIndex);
    const hasNextPage = endIndex < allDates.length;
    const hasPrevPage = page > 1;

    res.json({
      dates: paginatedDates,
      hasNextPage,
      hasPrevPage,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching post dates:', error);
    res.status(500).json({ error: 'Error fetching post dates' });
  }
});

// Serve individual blog posts
app.get('/posts/:year/:month/:day.md', async (req, res) => {
  const { year, month, day } = req.params;
  const filePath = path.join(__dirname, 'posts', year, month, `${day}.md`);
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    res.type('text/markdown').send(data);
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    res.status(404).send('Post not found');
  }
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
