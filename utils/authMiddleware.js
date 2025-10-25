const session = require('express-session');
require('dotenv').config();
const debug = require("debug")("blogt-editor:authMW");
const { verifyTurnstile } = require('./utils');

function requireLogin(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
      return next();
    }
  
    if (req.xhr) {
      // Send JSON response for AJAX requests
      return res.status(401).json({ error: 'You need to log in to access this feature.' });
    }
  
    // Redirect for standard requests
    req.session.returnTo = req.originalUrl || '/editor';
    res.redirect('/login');
  }

function setupAuthRoutes(app) {
  // Login page route
  app.get('/login', (req, res) => {
    const returnTo = req.session && req.session.returnTo
      ? req.session.returnTo
      : '/editor';

    res.render('login', {
      error: null,
      returnTo,
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY
    });
  });

  // Login form submission route
  app.post('/login', async (req, res) => {
    const { username, password, returnTo, 'cf-turnstile-response': turnstileToken } = req.body;

    // Verify Turnstile token
    if (!turnstileToken) {
      debug('Turnstile token missing');
      return res.render('login', {
        error: 'Verification token is required',
        returnTo,
        turnstileSiteKey: process.env.TURNSTILE_SITE_KEY
      });
    }

    try {
      const verificationResult = await verifyTurnstile(turnstileToken);

      if (!verificationResult.success) {
        debug('Turnstile verification failed:', verificationResult);
        return res.render('login', {
          error: 'Verification failed. Please try again.',
          returnTo,
          turnstileSiteKey: process.env.TURNSTILE_SITE_KEY
        });
      }

      debug('Turnstile verification successful');
    } catch (error) {
      debug('Error verifying Turnstile token:', error);
      return res.render('login', {
        error: 'Verification service temporarily unavailable. Please try again later.',
        returnTo,
        turnstileSiteKey: process.env.TURNSTILE_SITE_KEY
      });
    }

    const validUsername = process.env.EDITOR_USERNAME;
    const validPassword = process.env.EDITOR_PASSWORD;

    if (username === validUsername && password === validPassword) {
      if (!req.session) {
        console.error('ERROR: Session is not initialized during login!');
        return res.status(500).send('Session error. Please try again.');
      }

      // Mark the user as authenticated
      req.session.isAuthenticated = true;

      // Redirect to the original destination or default to '/editor'
      const redirectUrl = returnTo || req.session.returnTo || '/editor';

      // Clear the stored returnTo URL
      delete req.session.returnTo;

      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          return res.status(500).send('Internal server error');
        }
        res.redirect(redirectUrl);
      });
    } else {
      res.render('login', {
        error: 'Invalid username or password',
        returnTo
      });
    }
  });

  // Logout route
  app.get('/logout', (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
        res.redirect('/');
      });
    } else {
      debug('No session to destroy');
      res.redirect('/');
    }
  });
}

module.exports = {
  requireLogin,
  setupAuthRoutes
};
