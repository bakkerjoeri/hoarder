import { Size } from '../types.js';

export function setupGame(
    selector: string,
    size: Size,
    scale: number
): {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
} {
    const canvas = document.createElement('canvas');

    canvas.setAttribute('width', (size.width * window.devicePixelRatio).toString());
    canvas.setAttribute('height', (size.height * window.devicePixelRatio).toString());
    canvas.style.width = `${size.width * scale}px`;
    canvas.style.height = `${size.height * scale}px`;

    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Couldn\'t create context from canvas');
    }

    context.imageSmoothingEnabled = false;
    context.scale(window.devicePixelRatio, window.devicePixelRatio);

    const gameElement = document.documentElement.querySelector(selector);

    if (!gameElement) {
        throw new Error(`Couldn't find element with selector ${selector} to mount canvas on.`)
    }

    gameElement.appendChild(canvas);

    return {
        context,
        canvas,
    };
}
