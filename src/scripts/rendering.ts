import { Tile } from './tiles.js';
import { Entity, findEntitiesWithComponent } from './entities.js';
import { GameState, Size, Position } from './types.js';
import { getTilesInLevel, getLevel } from './levels.js';

const imageCache: {
	[path: string]: HTMLImageElement;
} = {};

export interface Sprite {
	name: string;
	path: string;
	size: Size;
	origin: Position;
}

export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 320;
export const TILE_SIZE = 32;

export function draw(state: GameState, time: number, context: CanvasRenderingContext2D): void {
    context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);


	if (state.currentLevel) {
		getTilesInLevel(state, getLevel(state, state.currentLevel)).forEach((tile: Tile) => {
			drawThing(context, tile.position.x, tile.position.y, '#444');
		});

		// TODO: scope these entities on their current level
		findEntitiesWithComponent(state, 'position').forEach((entity: Entity) => {
			if (entity.hasOwnProperty('color')) {
				drawThing(context, entity.position.x, entity.position.y, entity.color);
			}

			if (entity.hasOwnProperty('sprite')) {
				drawSprite(getSprite(state, entity.sprite), context, entity.position.x, entity.position.y);
			}

			if (entity.hasOwnProperty('health')) {
				drawText(
					context,
					entity.health.current.toString(),
					24,
					entity.position.x * TILE_SIZE + 9,
					entity.position.y * TILE_SIZE + 22,
					'white'
				);
			}
		});
	}
}

export function addSprite(state: GameState, name: string, path: string, size: Size, origin: Position = {x: 0, y: 0}): Sprite {
	const sprite = { name, path, size, origin };

	state.sprites = {
		...state.sprites,
		[name]: sprite,
	};

	return sprite;
}

export function getSprite(state: GameState, name: string): Sprite {
	if (!state.sprites.hasOwnProperty(name)) {
		throw new Error(`No sprite with name ${name} found.`);
	}

	return state.sprites[name];
}

export function drawSprite(sprite: Sprite, context: CanvasRenderingContext2D, x: number, y: number): void {
	context.drawImage(
		getImageForFilePath(sprite.path),
		sprite.origin.x, sprite.origin.y,
		sprite.size.width, sprite.size.height,
		x * TILE_SIZE, y * TILE_SIZE,
		TILE_SIZE, TILE_SIZE,
	);
}

export function drawThing(context: CanvasRenderingContext2D, x: number, y: number, color: string): void {
    context.fillStyle = color;
    context.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE - 2, TILE_SIZE - 2);
}

export function drawText(context: CanvasRenderingContext2D, text: string, size: number, textX: number, textY: number, color = 'black'): void {
    context.fillStyle = color;
    context.font = `${size}px sans-serif`;
    context.fillText(text, textX, textY);
}

export function getImageForFilePath(filePath: string, cached = true): HTMLImageElement {
	if (cached && imageCache[filePath]) {
		return imageCache[filePath];
	}

	const image = new Image();
	image.src = filePath;
	imageCache[filePath] = image;

	return image;
}
