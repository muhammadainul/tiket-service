const debug = require('debug');
const log = debug('tiket-service:services:queue:')

const Queue = require('bull');

module.exports = function startBullQueue ({ name = 'default', options = {} }) {
    if (!options.redis) {
        options.redis = {
            port: 6379,
            host: '127.0.0.1'
        };
    }
    if (!options.attempts) options.attempts = 3;
    if (!options.timeout) options.timeout = 60 * 1000;
    
    const queue = new Queue(name, options);
    log('Queue:', name);

    queue.on('progress', (job, progress) => {
        log(`Job with id ${job.id} has been updated.`, progress);
    });

    queue.on('completed', (job, result) => {
        log(`Job with id ${job.id} has been completed.`, result);
        job.remove();
    });

    queue.on('removed', (job) => {
        log(`Job with id ${job.id} has been removed.`);
    });

    return queue;
}