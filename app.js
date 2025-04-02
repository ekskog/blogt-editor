const createError = require('http-errors');
const cors = require('cors');
const express = require('express');
const session = require('express-session');
const { requireLogin, setupAuthRoutes } = require('./utils/authMiddleware');

const robots = require('express-robots-txt');
const path = require('path');
const cookieParser = require('cookie-parser');
//const bodyParser = require('body-parser');
const logger = require('morgan');
const methodOverride = require('method-override');

const indexRouter = require('./routes/index');
const editRouter = require('./routes/editor');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Logging
//app.use(logger('dev'));

// Middleware for parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

app.use(cors());
// **Session middleware** - Ensure this is BEFORE routes
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Session diagnostics middleware
app.use((req, res, next) => {
  res.locals.session = req.session; // Expose session to templates
  next();
});

// Add authentication routes - before protected routes
setupAuthRoutes(app);

// Define application routes
app.use('/', indexRouter);
// Protect editor-related routes
app.use('/editor', requireLogin, editRouter);
app.use('/editor/edit', requireLogin);
app.use('/editor/imgupl', requireLogin);

// Robots.txt configuration
app.use(robots({
  UserAgent: '*',
  Disallow: '/'
}));

app.use(logger('dev'));

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;