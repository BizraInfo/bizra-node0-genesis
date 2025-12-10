const { parentPort, workerData } = require('worker_threads');
const GraphOfThoughts = require('./graph_of_thoughts');

const got = new GraphOfThoughts();

parentPort.on('message', async (task) => {
    try {
        if (task.type === 'process') {
            const insight = await got.process(task.context);
            parentPort.postMessage({ id: task.id, result: insight, status: 'success' });
        }
    } catch (error) {
        parentPort.postMessage({ id: task.id, error: error.message, status: 'error' });
    }
});
