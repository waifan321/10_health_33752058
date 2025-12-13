// User routes module: handles registration and authentication for Health & Fitness Tracker
const express = require("express")
const router = express.Router()
const bcrypt = require('bcrypt')
const saltRounds = 10
const { check, validationResult } = require('express-validator');

// Access the global database connection
const db = global.db

// Base path (optional); defaults to empty for localhost
const BASE = process.env.HEALTH_BASE_PATH || '/usr/292'

// Helper to send an HTML meta-refresh redirect (instead of res.redirect)
const sendRedirect = (res, target) => {
  const url = `${BASE}${target}`
  res.send(`
  <html>
    <head>
      <meta http-equiv="refresh" content="0; URL='${url}'" />
    </head>
    <body>
      Redirecting... <a href="${url}">Click here if not redirected.</a>
    </body>
  </html>
  `)
}

const redirectLogin = (req, res, next) => {
  if (!req.session.userId ) {
    return sendRedirect(res, '/users/login') // redirect to the login page
  } else { 
    next (); // move to the next middleware function
  } 
}

// Password validation: min 8 chars, at least 1 lowercase, 1 uppercase, 1 number, 1 special char
const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}

// Display the registration form
router.get('/register', function (req, res, next) {
    res.render('register.ejs', { errors: [] })
})

// Handle registration form submission
router.post('/registered', [
    check('email').isEmail().withMessage('Valid email required'),
    check('username').isLength({ min: 5, max: 20}).withMessage('Username must be 5-20 characters'),
    check('password').custom((password) => {
        if (!validatePassword(password)) {
            throw new Error('Password must be at least 8 characters with uppercase, lowercase, number and special character');
        }
        return true;
    })
  ], function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('register.ejs', { errors: errors.array() })
    }

    // Sanitize text inputs to reduce XSS risk
    req.body.first = req.sanitize ? req.sanitize(req.body.first) : req.body.first
    req.body.last = req.sanitize ? req.sanitize(req.body.last) : req.body.last
    req.body.username = req.sanitize ? req.sanitize(req.body.username) : req.body.username
    req.body.email = req.sanitize ? req.sanitize(req.body.email) : req.body.email

    const plainPassword = req.body.password

    bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
      if (err) return next(err)

      // Store hashed password and user data in the database
      const sql = "INSERT INTO users (username, first_name, last_name, email, hashedPassword) VALUES (?,?,?,?,?)"
      const params = [req.body.username, req.body.first, req.body.last, req.body.email, hashedPassword]

      db.query(sql, params, (err, result) => {
        if (err) {
            // Handle duplicate username
            if (err.code === 'ER_DUP_ENTRY') {
                return res.render('register.ejs', { errors: [{ msg: 'Username already exists' }] })
            }
            return next(err)
        }

        res.render('registered.ejs', {
            firstName: req.body.first,
            lastName: req.body.last,
            username: req.body.username,
            email: req.body.email
        })
      })
    })
});


// List all users (no passwords) - mounted at /users/list from index.js
router.get('/list', redirectLogin, function(req, res, next) {
  const sql = 'SELECT id, username, first_name, last_name, email FROM users'
  db.query(sql, (err, results) => {
    if (err) return next(err)
    res.render('users_list.ejs', { users: results })
  })
})
// Display the login form
router.get('/login', function(req, res, next) {
  res.render('login.ejs')
})

// Handle login form submission: compare supplied password with stored hash
router.post('/loggedin', function(req, res, next) {
  // sanitize username from input to avoid injection/XSS in logs
  const username = req.sanitize ? req.sanitize(req.body.username) : req.body.username

  // Fetch the stored hashed password and user ID for this username
  const sql = 'SELECT id, hashedPassword, first_name, last_name, email FROM users WHERE username = ?'
  db.query(sql, [username], (err, results) => {
    if (err) return next(err)

    if (!results || results.length === 0) {
        // No such user -> record failed login and respond
        const audSql = 'INSERT INTO audit (username, success, ip_address, message) VALUES (?,?,?,?)'
        const audParams = [username || null, 0, req.ip, 'unknown username']
        return db.query(audSql, audParams, (aErr) => {
          if (aErr) return next(aErr)
          return res.send('Login failed: unknown username or password.')
        })
    }

    const userId = results[0].id
    const hashedPassword = results[0].hashedPassword

    // Compare the password supplied with the password in the database
    bcrypt.compare(req.body.password, hashedPassword, function(err, result) {
      if (err) return next(err)
      else if (result == true) {
        // Successful login -> set session, record audit and redirect
        req.session.userId = userId
        req.session.username = username
        
        // Save session before redirecting
        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr)
          
          const audSql = 'INSERT INTO audit (username, success, ip_address, message) VALUES (?,?,?,?)'
          const audParams = [username, 1, req.ip, 'login success']
          db.query(audSql, audParams, (aErr) => {
            if (aErr) return next(aErr)
            return sendRedirect(res, '/dashboard')
          })
        })
      }
      else {
        // Incorrect password -> record failed login and respond
        const audSql = 'INSERT INTO audit (username, success, ip_address, message) VALUES (?,?,?,?)'
        const audParams = [username, 0, req.ip, 'incorrect password']
        db.query(audSql, audParams, (aErr) => {
          if (aErr) return next(aErr)
          return res.send('Login failed: incorrect username or password.')
        })
      }
    })
  })
})

// Audit history view (shows successful and failed login attempts)
router.get('/audit', function(req, res, next) {
  const sql = 'SELECT id, username, success, event_time, ip_address, message FROM audit ORDER BY event_time DESC'
  db.query(sql, (err, results) => {
    if (err) return next(err)
    res.render('audit.ejs', { audits: results })
  })
})
// Export the router object so `index.js` can mount it
module.exports = router
