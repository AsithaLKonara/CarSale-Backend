import { logger } from '../observability/logger';

export type JobHandler<T = any> = (data: T) => Promise<void> | void;

interface JobInstance<T = any> {
  id: string;
  name: string;
  data: T;
  retryCount: number;
}

class BackgroundJobQueue {
  private handlers = new Map<string, JobHandler>();
  private activeJobsCount = 0;
  private maxConcurrentJobs = 5;
  private memoryQueue: JobInstance[] = [];

  /**
   * Registers a handler function for a specific job category.
   */
  public registerHandler<T>(jobName: string, handler: JobHandler<T>): void {
    this.handlers.set(jobName, handler);
    logger.info(`💼 Background queue handler registered for: [${jobName}]`);
  }

  /**
   * Enqueues a job payload asynchronously.
   */
  public async addJob<T>(jobName: string, data: T, options?: { retries?: number }): Promise<string> {
    const jobId = `job_${Math.random().toString(36).substring(2, 11)}`;
    const job: JobInstance<T> = {
      id: jobId,
      name: jobName,
      data,
      retryCount: options?.retries || 3,
    };

    logger.debug(`📥 Job enqueued: [${jobName}] (ID: ${jobId})`);
    this.memoryQueue.push(job);
    
    // Asynchronously kick off processing without blocking the response cycle
    setImmediate(() => this.processNext());

    return jobId;
  }

  /**
   * Orchestrates execution of pending jobs from the queue.
   */
  private async processNext(): Promise<void> {
    if (this.activeJobsCount >= this.maxConcurrentJobs || this.memoryQueue.length === 0) {
      return;
    }

    const job = this.memoryQueue.shift();
    if (!job) return;

    const handler = this.handlers.get(job.name);
    if (!handler) {
      logger.warn(`⚠️ No handler registered for background job category: [${job.name}]`);
      return;
    }

    this.activeJobsCount++;
    const stopTimer = logger.startTimer();

    try {
      await handler(job.data);
      stopTimer(`✅ Background Job Completed: [${job.name}]`, { jobId: job.id });
    } catch (error) {
      logger.error(`❌ Background Job Failed: [${job.name}] (ID: ${job.id})`, error);
      
      if (job.retryCount > 0) {
        job.retryCount--;
        logger.info(`🔄 Retrying job: [${job.name}] (Attempts remaining: ${job.retryCount})`);
        this.memoryQueue.push(job);
      } else {
        logger.error(`🚫 Job Exhausted all retries: [${job.name}]`, { jobId: job.id });
      }
    } finally {
      this.activeJobsCount--;
      // Process next in queue
      setImmediate(() => this.processNext());
    }
  }
}

export const jobQueue = new BackgroundJobQueue();
export default jobQueue;
