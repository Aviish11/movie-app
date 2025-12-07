
const express = require('express');
const { body, validationResult } = require('express-validator');
const Movie = require('../models/Movie');
const { requireLogin, requireOwner } = require('../middleware/auth');

const router = express.Router();

// movies – list
router.get('/', async (req, res) => {
  const movies = await Movie.find().populate('postedBy').sort({ createdAt: -1 });
  res.render('movies/index', { movies });
});

//show form (protected)
router.get('/new', requireLogin, (req, res) => {
  res.render('movies/new', { errors: [], old: {} });
});

// create movie (protected & validated)
router.post(
  '/',
  requireLogin,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('year').isInt({ min: 1880 }).withMessage('Year must be a valid number'),
    body('genres').trim().notEmpty().withMessage('Genres are required'),
    body('rating').isFloat({ min: 0, max: 10 }).withMessage('Rating must be between 0 and 10'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const { name, description, year, genres, rating, posterUrl } = req.body;
    const old = { name, description, year, genres, rating, posterUrl };

    if (!errors.isEmpty()) {
      return res.status(400).render('movies/new', { errors: errors.array(), old });
    }

    const genreList = genres.split(',').map((g) => g.trim()).filter(Boolean);

    await Movie.create({
      name,
      description,
      year,
      genres: genreList,
      rating,
      posterUrl,
      postedBy: req.session.userId,
    });

    res.redirect('/movies');

    
  }
);

//show details
router.get('/:id', async (req, res) => {
  const movie = await Movie.findById(req.params.id).populate('postedBy');
  if (!movie) return res.status(404).send('Movie not found');

  res.render('movies/show', { movie });

  //edit form (must be owner)
router.get('/:id/edit', requireLogin, requireOwner, async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).send('Movie not found');
  res.render('movies/edit', { movie, errors: [] });
});

// update (must be owner)
router.put(
  '/:id',
  requireLogin,
  requireOwner,
  [
    body('name').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('year').isInt({ min: 1880 }),
    body('genres').trim().notEmpty(),
    body('rating').isFloat({ min: 0, max: 10 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const movie = await Movie.findById(req.params.id);
      return res.status(400).render('movies/edit', { movie, errors: errors.array() });
    }

    const { name, description, year, genres, rating, posterUrl } = req.body;
    const genreList = genres.split(',').map((g) => g.trim()).filter(Boolean);

    await Movie.findByIdAndUpdate(req.params.id, {
      name,
      description,
      year,
      genres: genreList,
      rating,
      posterUrl,
    });

    res.redirect(`/movies/${req.params.id}`);
  }
);

// delete (must be owner)
router.delete('/:id', requireLogin, requireOwner, async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.redirect('/movies');
});

});

module.exports = router;
