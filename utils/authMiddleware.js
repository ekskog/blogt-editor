const session = require('express-session');
/*
function requireLogin(req, res, next) {
  console.log('------- Authentication Middleware -------');
  console.log('Request URL:', req.originalUrl);
  console.log('Session exists:', !!req.session);

  if (req.session) {
    console.log('Session details:', {
      isAuthenticated: req.session.isAuthenticated,
      returnTo: req.session.returnTo
    });
  }

  // Check if the user is authenticated
  if (req.session && req.session.isAuthenticated) {
    console.log('User is authenticated - proceeding');
    return next();
  }

  console.log('User not authenticated - redirecting to login');

  // Store the original URL for redirect after login
  if (req.session) {
    req.session.returnTo = req.originalUrl || '/editor';
    console.log('Stored returnTo:', req.session.returnTo);
  } else {
    console.error('ERROR: Session is not initialized!');
  }

  // Redirect to login page
  res.redirect('/login');
}
*/
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
    console.log('------- Login Page Route -------');
    console.log('Session exists:', !!req.session);

    const returnTo = req.session && req.session.returnTo 
      ? req.session.returnTo 
      : '/editor';

    console.log('Rendering login with returnTo:', returnTo);

    res.render('login', { 
      error: null, 
      returnTo 
    });
  });

  // Login form submission route
  app.post('/login', (req, res) => {
    console.log('------- Login Form Submission -------');
    console.log('Request body:', req.body);
    console.log('Session exists:', !!req.session);

    const { username, password, returnTo } = req.body;

    const validUsername = process.env.EDITOR_USERNAME || 'admin';
    const validPassword = process.env.EDITOR_PASSWORD || 'password';

    console.log('Attempting login with:', { username, validUsername });
    console.log('Attempting login with:', { password, validPassword });

    if (username === validUsername && password === validPassword) {
      if (!req.session) {
        console.error('ERROR: Session is not initialized during login!');
        return res.status(500).send('Session error. Please try again.');
      }

      // Mark the user as authenticated
      req.session.isAuthenticated = true;

      // Redirect to the original destination or default to '/editor'
      const redirectUrl = returnTo || req.session.returnTo || '/editor';
      console.log('Login successful. Redirecting to:', redirectUrl);

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
      console.log('Login failed');
      res.render('login', { 
        error: 'Invalid username or password', 
        returnTo 
      });
    }
  });

  // Logout route
  app.get('/logout', (req, res) => {
    console.log('------- Logout Route -------');

    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
        res.redirect('/');
      });
    } else {
      console.log('No session to destroy');
      res.redirect('/');
    }
  });
}

module.exports = {
  requireLogin,
  setupAuthRoutes
};
