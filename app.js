const fs = require('fs').promises;
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

// Helper function to get the latest 5 post files
async function findLatestPost() {
  const postsDir = path.join(__dirname, 'posts');
  let latestPostDate = null;
  let latestPostPath = '';

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

// Endpoint to get the latest 5 posts
app.get('/api/posts', async (req, res) => {
  try {
      const { latestPostPath, latestPostDate } = await findLatestPost();
     
      if (!latestPostPath) {
          return res.status(404).json({ error: 'No posts found' });
      }

      const postsContent = [];

      // Get the latest 5 posts starting from the found latest post date
      for (let i = 0; i < 5; i++) {
          const currentPostDate = new Date(latestPostDate);
          currentPostDate.setDate(currentPostDate.getDate() - i); // Move backwards

          const year = currentPostDate.getFullYear();
          const month = String(currentPostDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentPostDate.getDate()).padStart(2, '0');

          const filePath = path.join(__dirname, 'posts', `${year}`, `${month}`, `${day}.md`);
          
          try {
              const content = await fs.readFile(filePath, 'utf-8');
              postsContent.push({ fileName: `${year}/${month}/${day}.md`, content });
          } catch (err) {
              console.log(`No post found for ${year}-${month}-${day}`);
              // Continue to next date if file does not exist
          }
      }

      res.json(postsContent);
  } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: 'Internal server error' });
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

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
    // Set locals only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // Render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;