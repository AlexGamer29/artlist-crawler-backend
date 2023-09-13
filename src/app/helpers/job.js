const { init } = require('../../app/controller/artlist');

const { redisClient } = require('../../app/middleware/middleware');


const kue = require('kue');
const queue = kue.createQueue();

