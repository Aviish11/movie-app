
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    year: { type: Number, required: true },
    genres: { type: [String], required: true },
    rating: { type: Number, min: 0, max: 10, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;
