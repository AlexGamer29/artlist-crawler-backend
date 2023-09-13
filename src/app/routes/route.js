const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const { createDownloadableLink } = require('../helpers/helper');
const { init } = require('../../app/controller/artlist');
const { cacheData, redisClient } = require('../../app/middleware/middleware');
const Links = require('../model/Links');

router.get('/', (req, res) => {
    res.json({
        data: 'Hello World!'
    });
});

router.get('/links', async (req, res) => {
    const allLinks = await Links.find();
    res.json({
        data: allLinks
    })
});

router.post('/links', cacheData, async (req, res) => {
    const link = req.body.link;
    console.log(`Link ne`, link);
    let object;
    if (!link) {
        return res.status(400).json({ error: 'Link is not correct.' });
    } else {
        object = await init(link);
        if (!object || object.status === 'failed') {
            res.json({
                status: 'failed',
                data: object ? object : []
            });
        } else if (object.status === 'success') {
            redisClient.setex(link, 3000, JSON.stringify(object));
            res.json(object);
        }
    }
});

router.get('/download', (req, res) => {
    const fileName = req.query.filename;

    if (!fileName) {
        return res.status(400).send({ error: 'Please provide a valid filename in the query parameters.' });
    }

    const filePath = createDownloadableLink(fileName);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        // Set the Content-Disposition header to suggest the filename when downloading
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        // Stream the file to the response
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Serve files from the 'exports' directory
const exportsPath = path.join(__dirname, '..', '..', '..', 'exports');
router.use('/exports', express.static(exportsPath));

// Error handling middleware
router.use((err, req, res, next) => {
    res.status(500).send('An error occurred: ' + err.message);
});

module.exports = router;
