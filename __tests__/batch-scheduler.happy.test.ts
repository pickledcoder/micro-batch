import { Job } from "../batch-processor"
import { BatchScheduler, BatchSchedulerConfiguration } from "../batch-scheduler"

jest.useFakeTimers()

describe("batch scheduler", () => {
    const mockProcessor = {
        process: jest.fn().mockImplementation((jobs: Job[]) => {
            return Promise.resolve(jobs.map(job => ({
                jobId: job.id,
                result: `mocked result of job ${ job.id }`,
            })))
        })
    }

    const mockConfiguration: BatchSchedulerConfiguration = {
        maxQueueSize: 3,
        maxQueueTimeMs: 10,
    }

    const scheduler = new BatchScheduler(mockConfiguration, mockProcessor)

    beforeEach(() => {
        mockProcessor.process.mockClear()
    })

    afterAll(() => {
        scheduler.shutdown()
    })

    it("delays jobs until reached maxQueueSize", () => {
        const firstResult = scheduler.submit({
            id: "1",
            payload: "first",
        })

        expect(mockProcessor.process).not.toHaveBeenCalled()

        const secondResult = scheduler.submit({
            id: "2",
            payload: "second",
        })
        expect(mockProcessor.process).not.toHaveBeenCalled()

        const thirdResult = scheduler.submit({
            id: "3",
            payload: "third",
        })
        expect(mockProcessor.process).toHaveBeenCalledTimes(1)

        expect(firstResult).resolves.toStrictEqual({
            jobId: "1",
            result: "mocked result of job 1"
        })
        expect(secondResult).resolves.toStrictEqual({
            jobId: "2",
            result: "mocked result of job 2"
        })
        expect(thirdResult).resolves.toStrictEqual({
            jobId: "3",
            result: "mocked result of job 3"
        })
    })

    it("delays jobs until reached maxQueueTimeMs", () => {
        const task = scheduler.submit({
            id: "A",
            payload: "timer test",
        })

        jest.advanceTimersByTime(9)
        expect(mockProcessor.process).not.toHaveBeenCalled()

        jest.advanceTimersByTime(1)
        expect(mockProcessor.process).toHaveBeenCalledTimes(1)

        expect(task).resolves.toStrictEqual({
            jobId: "A",
            result: "mocked result of job A"
        })
    })

    it("does not call the processor if there is no job in queue", () => {
        jest.advanceTimersByTime(20)
        expect(mockProcessor.process).not.toHaveBeenCalled()
    })

    it("flushes tasks when shutting down", async () => {
        const task = scheduler.submit({
            id: "X",
            payload: "sweet dreams",
        })

        expect(mockProcessor.process).not.toHaveBeenCalled()

        await scheduler.shutdown()

        expect(mockProcessor.process).toHaveBeenCalledTimes(1)
        expect(task).resolves.toStrictEqual({
            jobId: "X",
            result: "mocked result of job X"
        })
    })
})
