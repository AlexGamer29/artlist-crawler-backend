const mongoose = require('mongoose');

const { Schema } = mongoose;

const linksSchema = new Schema({
  jobId: String,
  song: String,
  artist: String,
  link: String,
  storagePath: String,
  title: String,
  createdAt: Date,
});

module.exports = mongoose.model('Links', linksSchema);
