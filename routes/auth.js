
const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();


// GET- show registration form
router.get('/register', (req, res) => {
  res.render('register', {
    errors: [],
    formData: { username: '' },
  });
});

// POST – validate & create user
router.post(
  '/register',
  [
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required.')
      .isLength({ min: 3 }).withMessage('Username must be at least 3 characters.'),

    body('password')
      .notEmpty().withMessage('Password is required.')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),

    body('confirmPassword')
      .custom((value, { req }) => {
        if (!value) {
          throw new Error('Confirm Password is required.');
        }
        if (value !== req.body.password) {
          throw new Error('Passwords do not match.');
        }
        return true;
      }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const formData = { username: req.body.username || '' };

    if (!errors.isEmpty()) {
      return res.status(400).render('register', {
        errors: errors.array(),
        formData,
      });
    }

    try {
      // 1) check if username exists
      const existing = await User.findOne({ username: req.body.username });
      if (existing) {
        return res.status(400).render('register', {
          errors: [{ msg: 'Username is already taken.' }],
          formData,
        });
      }

      // 2) hash password
      const passwordHash = await bcrypt.hash(req.body.password, 10);

      // 3) save user with passwordHash field
      const user = new User({
        username: req.body.username,
        passwordHash,
      });

      await user.save();

      // 4) show success page with button to go to login
      return res.render('register-success', {
        username: user.username,
      });
    } catch (err) {
      console.error('REGISTER ERROR:', err);
      return res.status(500).render('register', {
        errors: [{ msg: 'Server error. Please try again.' }],
        formData,
      });
    }
  }
);


// GET – show login form
router.get('/login', (req, res) => {
  res.render('login', {
    errors: [],
    formData: { username: '' },
    message: req.query.msg || null, 
  });
});

// POST – validate credentials
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const formData = { username: req.body.username || '' };

    if (!errors.isEmpty()) {
      return res.status(400).render('login', {
        errors: errors.array(),
        formData,
        message: null,
      });
    }

    try {
      const user = await User.findOne({ username: req.body.username });
      if (!user) {
        return res.status(400).render('login', {
          errors: [{ msg: 'Invalid username or password.' }],
          formData,
          message: null,
        });
      }

      const passwordOk = await user.validatePassword(req.body.password);
      if (!passwordOk) {
        return res.status(400).render('login', {
          errors: [{ msg: 'Invalid username or password.' }],
          formData,
          message: null,
        });
      }

    
      req.session.userId = user._id;
      req.session.username = user.username;

     
      return res.redirect('/movies');
    } catch (err) {
      console.error('LOGIN ERROR:', err);
      return res.status(500).render('login', {
        errors: [{ msg: 'Server error. Please try again.' }],
        formData,
        message: null,
      });
    }
  }
);


router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
