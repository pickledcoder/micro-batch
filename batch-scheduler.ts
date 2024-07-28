import { BatchProcessor, Job, JobResult } from "./batch-processor";

export interface BatchSchedulerConfiguration {
    maxQueueSize: number
    maxQueueTimeMs: number
}

interface QueuedJob {
    job: Job
    resolve?: (value: JobResult) => void
    reject?: (reason: any) => void
}

export class BatchScheduler {
    private queue: QueuedJob[] = []
    private timeoutId?: NodeJS.Timeout

    constructor(
        private configuration: BatchSchedulerConfiguration,
        private processor: BatchProcessor,
    ){
        this.scheduleNextFlush()
    }

    async submit(job: Job): Promise<JobResult> {
        const queuedJob: QueuedJob = {
            job,
        }

        this.queue.push(queuedJob)

        if (this.queue.length >= this.configuration.maxQueueSize) {
            await this.flush()
        }

        return new Promise<JobResult>((resolve, reject) => {
            queuedJob.resolve = resolve
            queuedJob.reject = reject
        })
    }

    async shutdown() {
        this.flush(true)
    }

    private scheduleNextFlush() {
        this.timeoutId = setTimeout(() => this.flush(), this.configuration.maxQueueTimeMs)
    }

    private async flush(isShuttingDown = false) {
        clearTimeout(this.timeoutId)

        if (this.queue.length > 0) {
            const jobs = this.queue.map(qj => qj.job)

            try {
                const results = await this.processor.process(jobs)

                const resultMap = new Map<Job["id"], JobResult>()
                results.forEach(result => {
                    resultMap.set(result.jobId, result)
                })

                this.queue.forEach(queuedJob => {
                    const resolvedResult = resultMap.get(queuedJob.job.id)
                    if (queuedJob.resolve && resolvedResult) {
                        queuedJob.resolve(resolvedResult)
                    }
                })
            } catch (error) {
                this.queue.forEach(queuedJob => {
                    if (queuedJob.reject) {
                        queuedJob.reject(error)
                    }
                })
            }

            this.queue = []
        }

        if (!isShuttingDown) {
            this.scheduleNextFlush()
        }
    }
}
