export class RateLimiter {
    private lastCall: number = 0;
    private minInterval: number;

    constructor(callsPerSecond: number) {
        if (callsPerSecond <= 0) {
            throw new Error('callsPerSecond must be > 0');
        }
        this.minInterval = 1000 / callsPerSecond;
    }

    async wait(): Promise<void> {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCall;
        if (timeSinceLastCall < this.minInterval) {
            const waitTime = this.minInterval - timeSinceLastCall;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastCall = Date.now();
    }
}

export function delay(ms: number): Promise<void> {
    if (ms < 0) {
        throw new Error('delay must be >= 0');
    }
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry helper for transient failures
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxAttempts?: number;
        delayMs?: number;
        backoffMultiplier?: number;
    } = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        delayMs = 1000,
        backoffMultiplier = 2
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
;

            if (attempt < maxAttempts - 1) {
                const waitTime = delayMs * Math.pow(backoffMultiplier, attempt);
                await delay(waitTime);
            }
        }
    }

    throw lastError || new Error('All retry attempts failed');
}