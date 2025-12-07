
const User = require('../models/User');
const Movie = require('../models/Movie');


async function attachUserToLocals(req, res, next) {
  if (req.session.userId) {
    res.locals.user = await User.findById(req.session.userId);
  } else {
    res.locals.user = null;
  }
  next();
}

// require login
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

// require owner of movie
async function requireOwner(req, res, next) {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).send('Movie not found');

  if (String(movie.postedBy) !== String(req.session.userId)) {
    return res.status(403).send('Forbidden');
  }

  // Attach movie so handlers can reuse it if needed
  req.movie = movie;
  next();
}

module.exports = { attachUserToLocals, requireLogin, requireOwner };
