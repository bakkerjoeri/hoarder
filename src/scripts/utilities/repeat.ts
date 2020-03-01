export function repeat(
    iterations: number,
    callback: (iterations: number) => void
): void {
    for (let i = 0; i < iterations; i += 1) {
        callback(i);
    }
}
