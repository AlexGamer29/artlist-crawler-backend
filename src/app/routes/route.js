const express = require('express');
const path = require('path');
const router = express.Router();

const { createDownloadableLink } = require('../helpers/helper');
const { init } = require('../../app/controller/artlist');
const { cacheData, redisClient } = require('../../app/middleware/middleware')

router.get('/', (req, res) => {
    res.json({
        data: 'Hello World!'
    });
});

router.get('/links', (req, res) => {
    res.json({
        data: 'Get links ne'
    });
});

router.post('/links', cacheData, async (req, res) => {
    const link = req.body.link;
    console.log(`Link ne`, link);
    let object;
    if (!link) {
        return res.status(400).json({ error: 'Link is not correct.' });
    } else {
        object = await init(link);
        redisClient.setex(link, 3000, JSON.stringify(object));
        res.json({ status: 'Success convert' })
    }
});

router.get('/download', (req, res) => {
    const filename = req.query.filename; // Get the filename from query parameter
    if (!filename) {
        return res.status(400).send('Filename query parameter is missing.');
    }

    const filePath = createDownloadableLink(filename);
    console.log('Filename:', filename);

    res.download(filePath, (err) => {
        if (err) {
            // Handle the error by sending an error response
            console.error('Error downloading file:', err);
            return res.status(500).send('Error downloading file: ' + err.message);
        }
    });
});

// Serve files from the 'exports' directory
const exportsPath = path.join(__dirname, '..', '..', '..', 'exports');
router.use('/exports', express.static(exportsPath));

// Error handling middleware
router.use((err, req, res, next) => {
    res.status(500).send('An error occurred: ' + err.message);
});

module.exports = router;
