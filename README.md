# Micro-batch scheduler

This library allows grouping multiple `Job`s, which are normally submmitted directly to the `BatchProcessor`, to enhance the performance of the operation.

## Configuration options
There are 2 available confiugration options:
- maxQueueSize: how many jobs should be accumulated before being pushed to the processor
- maxQueueTimeMs: how long should be waited before tasks being pushed to the processor

Regardless of these configuration, the scheduler will try to push any submitted jobs when shutting down.

## APIs

### submit
Send a new `Job` to the job queue to be sent to the processor, returning a `JobResult`

### shutdown
Shutdown the instance, after clearing up its existing job queue
