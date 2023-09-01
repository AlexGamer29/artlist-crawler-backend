const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const linksSchema = new Schema({
    song: String,
    artist: String,
    links: String,
    createdAt: Date
});

module.exports = mongoose.model("Links", linksSchema);
