const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/user'); // Mongoose model for users

// Home route
router.get('/', (req, res) => {
  res.send("Welcome to Auth");
});

// Login route (GET)
router.get('/login', (req, res) => {
  res.render('login');
});

// Register route (GET)
router.get('/register', (req, res) => {
  res.render('register');
});

// Handle User Registration (POST)
router.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password || !confirmPassword) {
    return res.status(400).render('register', { error: 'All fields are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).render('register', { error: 'Passwords do not match.' });
  }

  try {
    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).render('register', { error: 'Username already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user and save to database
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    // Store user in session
    req.session.user = { id: newUser._id, username: newUser.username };

    // Redirect to dashboard
    res.redirect('/auth/dashboard');
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).render('error', { message: 'An error occurred during registration.' });
  }
});

// Handle User Login (POST)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).render('login', { error: 'All fields are required.' });
  }

  try {
    // Find user in the database
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).render('login', { error: 'Invalid username or password.' });
    }

    // Compare hashed passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).render('login', { error: 'Invalid username or password.' });
    }

    // Store user in session
    req.session.user = { id: user._id, username: user.username };

    // Redirect to dashboard
    res.redirect('/auth/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).render('error', { message: 'An error occurred during login.' });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).render('error', { message: 'Failed to log out.' });
    }
    res.redirect('/auth/login');
  });
});

// Dashboard route (Protected)
router.get('/dashboard', (req, res) => {
  if (req.session.user) {
    return res.render('dashboard', { username: req.session.user.username });
  }
  res.redirect('/auth/login');
});

// User Info Route
router.post('/user-info', (req, res) => {
  if (req.session.user) {
    const user = req.session.user;
    res.render('user-info', { user }); // Pass user details to the template
  } else {
    res.redirect('/auth/login');
  }
});

module.exports = router;
