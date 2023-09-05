const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3027;

const routes = require('./src/app/routes/route');

app.use(bodyParser.json());
app.use(cors());
app.use('/api', routes);

// Starting the server
const server = app.listen(PORT, async () => {
  console.log(`Server started on port ${PORT}`);

  await mongoose.connect('mongodb+srv://admin:12345678%40X@crawler.ifxttpz.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.log('MongoDB connection error:', err));
});
