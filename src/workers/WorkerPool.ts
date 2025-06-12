interface WorkerTask {
  countryId: string;
  resolution: 'low' | 'high';
  path: string;
  baseUrl: string;
}

interface WorkerResponse {
  id?: string;
  success: boolean;
  data: GeoJSON.FeatureCollection | GeoJSON.Feature;
  error?: string;
}

interface QueueItem {
  id: string;
  task: WorkerTask;
  resolve: (value: WorkerResponse) => void;
  reject: (reason?: Error) => void;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private queue: QueueItem[] = [];
  private availableWorkers: Set<Worker> = new Set();
  private workerPromises = new Map<
    Worker,
    {
      id: string;
      resolve: (value: WorkerResponse) => void;
      reject: (reason?: Error) => void;
    }
  >();

  constructor(workerScript: string, poolSize: number) {
    this.workers = Array.from({ length: poolSize }, () => {
      const worker = new Worker(workerScript);
      worker.onmessage = (e: MessageEvent<WorkerResponse>) =>
        this.handleWorkerMessage(worker, e);
      this.availableWorkers.add(worker);
      return worker;
    });
  }

  private handleWorkerMessage(
    worker: Worker,
    e: MessageEvent<WorkerResponse>
  ): void {
    const result = e.data;
    this.availableWorkers.add(worker);

    const taskPromise = this.workerPromises.get(worker);
    if (taskPromise && taskPromise.id === result.id) {
      this.workerPromises.delete(worker);
      taskPromise.resolve(result);
    }

    const nextTask = this.queue.shift();
    if (nextTask) {
      queueMicrotask(() => this.processTask(nextTask));
    }
  }

  private processTask(queueItem: QueueItem): void {
    if (this.availableWorkers.size === 0) {
      this.queue.push(queueItem);
      return;
    }

    const worker = Array.from(this.availableWorkers)[0];
    this.availableWorkers.delete(worker);
    this.workerPromises.set(worker, {
      id: queueItem.id,
      resolve: queueItem.resolve,
      reject: queueItem.reject,
    });
    worker.postMessage({ ...queueItem.task, id: queueItem.id });
  }

  execute(task: WorkerTask): Promise<WorkerResponse> {
    const id = `${task.countryId}-${performance.now()}-${Math.random()}`;
    return new Promise((resolve, reject) => {
      this.processTask({ id, task, resolve, reject });
    });
  }

  terminate(): void {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers.length = 0;
    this.availableWorkers.clear();
    this.queue.length = 0;
    this.workerPromises.clear();
  }
}
