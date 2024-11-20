const mongoose = require('mongoose');

const { Schema } = mongoose;

const linksSchema = new Schema({
  song: String,
  artist: String,
  links: String,
  title: String,
  createdAt: Date,
});

module.exports = mongoose.model('Links', linksSchema);
