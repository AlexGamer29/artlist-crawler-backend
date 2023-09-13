const kue = require('kue');

let queue;

function initQueue() {
    if (!queue) {
        queue = kue.createQueue({ redis: process.env.REDIS_URL }); // Create a Kue queue instance

        // console.log(`QUEUE NE`, queue);

        queue.on('error', function (err) {
            console.log('Oops... ', err);
        });

        queue.on('failed', (job, err) => {
            console.error(`Job ${job.id} failed: ${err}`);
        });
    }
    return queue;
}

queue = initQueue();

module.exports = { initQueue, queue };