export type QueueTaskCallback = (err?: Error | null, result?: any) => Promise<any>

export type QueueWorker = (task: any, callback: QueueTaskCallback) => void

export interface QueueTask {
  task: any,
  callback: QueueTaskCallback
}

export class Queue {
  private currentTimer: NodeJS.Timeout | null = null;
  private tasksCount = 0;
  private tasks: QueueTask[] = [];
  private worker: QueueWorker;

  constructor(worker: QueueWorker) {
    if (typeof worker !== 'function') throw new Error('QueueWorker must be a function');
    this.worker = worker
  }

  push(task: any, callback: QueueTaskCallback) {
    this.tasks.push({task, callback});
    this.tasksCount++;
    if (this.currentTimer) return;
    this.next();
  }

  private complete () {
    this.currentTimer = null;
    this.next();
  }

  private next() {
    if (this.currentTimer) return;
    const current = this.tasks.shift();
    if (!current) return this.clear();
    this.currentTimer = setTimeout(() => {
      this.worker(current.task, async (err?: Error | null, result?: any) => {
        this.complete();
        current.callback(err, result);
      })
    }, 0)
  }

  clear () {
    if (this.currentTimer) clearTimeout(this.currentTimer);
    this.currentTimer = null;
    this.tasks = [];
  }
}
