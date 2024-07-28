import { BatchScheduler, BatchSchedulerConfiguration } from "../batch-scheduler"

jest.useFakeTimers()

describe("batch scheduler - unhappy path", () => {
    const mockError = new Error("mama mia!")
    const mockProcessor = {
        process: jest.fn().mockRejectedValue(mockError)
    }

    const mockConfiguration: BatchSchedulerConfiguration = {
        maxQueueSize: 2,
        maxQueueTimeMs: 10,
    }

    const scheduler = new BatchScheduler(mockConfiguration, mockProcessor)

    afterAll(() => {
        scheduler.shutdown()
    })

    it("returns error for failures in batch processor", () => {
        const task1 = scheduler.submit({
            id: "T1",
            payload: "foo",
        })
        const task2 = scheduler.submit({
            id: "T2",
            payload: "bar",
        })
        expect(mockProcessor.process).toHaveBeenCalledTimes(1)

        expect(task1).rejects.toBe(mockError)
        expect(task2).rejects.toBe(mockError)
    })
})
