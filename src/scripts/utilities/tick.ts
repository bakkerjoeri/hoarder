export type gameLoop = (time: number) => any;

export function start(callback: gameLoop): void {
    scheduleNextTick(callback);
}

export function scheduleNextTick(callback: gameLoop): void {
    window.requestAnimationFrame((time) => {
        tick(callback, time);
    });
}

export function tick(callback: gameLoop, time: number): void {
    callback(time);
    scheduleNextTick(callback);
}
