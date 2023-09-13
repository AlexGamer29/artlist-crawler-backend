const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const { createDownloadableLink } = require('../helpers/helper');
const { init } = require('../../app/controller/artlist');
const { cacheData, redisClient } = require('../../app/middleware/middleware');
const Links = require('../model/Links');
const { initQueue } = require('../helpers/queue');
const queue = initQueue();


router.get('/', async (req, res) => {
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

// router.post('/links', cacheData, async (req, res) => {
//     const link = req.body.link;
//     console.log(`Link ne`, link);
//     let object;
//     if (!link) {
//         return res.status(400).json({ error: 'Link is not correct.' });
//     } else {
//         object = await init(link);
//         if (!object || object.status === 'failed') {
//             return res.status(400).json({ error: 'Fail to get file. Try again.' });
//         } else if (object.status === 'success') {
//             redisClient.setex(link, 3000, JSON.stringify(object));
//             res.json(object);
//         }
//     }
// });

router.post('/links', cacheData, async (req, res) => {
    const link = req.body.link;
    console.log(`Link ne`, link);

    if (!link) {
        return res.status(400).json({ error: 'Link is not correct.' });
    }

    // Create a Kue job
    const job = queue.create('linkFetch', { link })
        // .attempts(3) // Number of attempts to retry the job (customize as needed)
        .removeOnComplete(true) // Remove the job from the queue when it's completed

    // Save the job to the queue
    job.save(err => {
        if (err) {
            return res.status(500).json({ error: 'Failed to add job to queue.' });
        }

        res.json({ message: 'Job added to the queue. Check status later.' });

        queue.process('linkFetch', async (job, done) => {
            const { link } = job.data;

            setTimeout(async () => {
                try {
                    const object = await init(link);
                    if (!object || object.status === 'failed') {
                        return done('Fail to get file. Try again.');
                    } else if (object.status === 'success') {
                        redisClient.setex(link, 30, JSON.stringify(object));
                        done(); // Job is successful
                    }
                } catch (error) {
                    done(error); // Job has failed
                }
            }, 2000); // Simulated work delay
        });

        console.log(`DONE`);
    });
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
