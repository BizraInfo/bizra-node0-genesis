/**
 * BIZRA NODE0: GoT Service (Threaded)
 * ===================================
 * 
 * Manages a pool of Worker Threads to execute Graph-of-Thoughts processing
 * without blocking the main Event Loop.
 * 
 * Performance: Non-blocking, Parallel Execution
 * Pattern: Worker Pool
 */

const { Worker } = require('worker_threads');
const path = require('path');

class GoTService {
    constructor(poolSize = 4) {
        this.poolSize = poolSize;
        this.workers = [];
        this.taskCallbacks = new Map();
        this.queue = [];
        this.initPool();
    }

    initPool() {
        for (let i = 0; i < this.poolSize; i++) {
            this.workers.push(this.createWorker());
        }
        console.log(`🧠 [GoT Service] Initialized pool with ${this.poolSize} workers.`);
    }

    createWorker() {
        const worker = new Worker(path.join(__dirname, 'got_worker.js'));
        worker.on('message', (msg) => this.handleWorkerMessage(worker, msg));
        worker.on('error', (err) => console.error('GoT Worker Error:', err));
        return { worker, busy: false };
    }

    handleWorkerMessage(workerObj, msg) {
        const { id, result, error, status } = msg;
        const taskCallback = this.taskCallbacks.get(id);
        
        if (taskCallback) {
            if (status === 'success') taskCallback.resolve(result);
            else taskCallback.reject(new Error(error));
            this.taskCallbacks.delete(id);
        }

        workerObj.busy = false;
        this.processQueue();
    }

    async process(context) {
        return new Promise((resolve, reject) => {
            const id = Date.now() + Math.random().toString(36).substr(2, 9);
            this.taskCallbacks.set(id, { resolve, reject });
            this.queue.push({ id, context });
            this.processQueue();
        });
    }

    processQueue() {
        if (this.queue.length === 0) return;

        const availableWorker = this.workers.find(w => !w.busy);
        if (availableWorker) {
            const task = this.queue.shift();
            availableWorker.busy = true;
            availableWorker.worker.postMessage({ type: 'process', id: task.id, context: task.context });
        }
    }
}

module.exports = GoTService;
