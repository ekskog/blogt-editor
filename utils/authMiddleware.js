const session = require('express-session');
require('dotenv').config();
const debug = require("debug")("blogt-editor:authMW");
// verifyTurnstile will be implemented below and used by the login flow

const turnstileBypass =
  process.env.TURNSTILE_BYPASS === 'true' ||
  process.env.NODE_ENV === 'development';
const turnstileEnabled = !turnstileBypass;

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
      turnstileSiteKey: turnstileEnabled ? process.env.TURNSTILE_SITE_KEY : null,
      turnstileEnabled
    });
  });

  // Login form submission route
  app.post('/login', async (req, res) => {
    const { username, password, returnTo, 'cf-turnstile-response': turnstileToken } = req.body;
    
    // Verify Turnstile first (or bypass in dev)
    const isTurnstileValid = turnstileEnabled
      ? await verifyTurnstile(turnstileToken)
      : true;
    
    if (!isTurnstileValid) {
      return res.render('login', {
        error: 'Captcha verification failed. Please try again.',
        returnTo,
        turnstileSiteKey: turnstileEnabled ? process.env.TURNSTILE_SITE_KEY : null,
        turnstileEnabled
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
        returnTo,
        turnstileSiteKey: turnstileEnabled ? process.env.TURNSTILE_SITE_KEY : null,
        turnstileEnabled
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

// Turnstile verification helper (moved from utils.js)
const verifyTurnstile = async (token) => {
  const debug = require('debug')('blogt-editor:authMW');
  // Bypass in local/dev when explicitly enabled
  const bypass =
    process.env.TURNSTILE_BYPASS === 'true' ||
    process.env.NODE_ENV === 'development';

  if (bypass) {
    debug('Turnstile bypass enabled; skipping verification');
    return true;
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!token) {
    debug('No Turnstile token provided');
    return false;
  }

  const formData = new URLSearchParams();
  formData.append('secret', secretKey);
  formData.append('response', token);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const data = await response.json();
    debug('Turnstile verification result:', data);
    return data.success;
  } catch (error) {
    debug('Turnstile verification error:', error);
    return false;
  }
};