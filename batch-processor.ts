export interface Job {
    id: string
    payload: any
}

export interface JobResult {
    jobId: Job["id"]
    result: any
}

export interface BatchProcessor {
    process(batch: Job[]): Promise<JobResult[]>
}
