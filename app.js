// app.js
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const methodOverride = require('method-override');

const connectDB = require('./config/db');
const moviesRouter = require('./routes/movies');
const authRouter = require('./routes/auth');
const { attachUserToLocals } = require('./middleware/auth');

const app = express();

// Connect to MongoDB
connectDB();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'devsecret',
    resave: false,
    saveUninitialized: false,
  })
);


app.use(attachUserToLocals);

// Routes
app.use('/', authRouter);
app.use('/movies', moviesRouter);

app.get('/', (req, res) => {
  res.render('index');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Movies app running on http://localhost:${PORT}`);
});
