import { Tile } from './tiles.js';
import { Entity, findEntities } from './entities.js';
import { GameState, Size, Position } from './types.js';
import { getTilesInLevel, getLevel, getEntitiesInLevel } from './levels.js';

const imageCache: {
	[path: string]: HTMLImageElement;
} = {};

export interface Sprite {
	name: string;
	path: string;
	size: Size;
	origin: Position;
}

export const TILE_SIZE = 64;
export const LEVEL_WIDTH = 7;
export const LEVEL_HEIGHT = 7;
export const GAP = TILE_SIZE / 16;

export const GAME_WIDTH = LEVEL_WIDTH * TILE_SIZE;
export const GAME_HEIGHT = LEVEL_HEIGHT * TILE_SIZE;

export function draw(time: number, state: GameState, context: CanvasRenderingContext2D): void {
    context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

	if (state.currentLevel) {
		const currentLevel = getLevel(state, state.currentLevel);

		getTilesInLevel(state, currentLevel).forEach((tile: Tile) => {
			drawThing(context, tile.position.x, tile.position.y, '#222');
		});

		const entitiesInLevel = getEntitiesInLevel(state, currentLevel);
		const entitiesToDraw = findEntities(entitiesInLevel, {
			position: true,
			currentLevel: state.currentLevel,
		});

		entitiesToDraw.forEach((entity: Entity) => {
			if (entity.hasOwnProperty('color')) {
				drawThing(context, entity.position.x, entity.position.y, entity.color);
			}

			if (entity.hasOwnProperty('sprite')) {
				drawSprite(
					getSprite(state, entity.sprite),
					context,
					entity.position.x,
					entity.position.y,
					entity.drawOffset,
				);
			}

			if (state.debugging === true && entity.hasOwnProperty('health')) {
				context.fillStyle = 'red';
				context.fillRect(entity.position.x * TILE_SIZE, entity.position.y * TILE_SIZE, 15, 15);

				drawText(
					context,
					entity.health.current.toString(),
					12,
					entity.position.x * TILE_SIZE + 4,
					entity.position.y * TILE_SIZE + 11,
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

export function drawSprite(sprite: Sprite, context: CanvasRenderingContext2D, x: number, y: number, offset: Position = {x: 0, y: 0}): void {
	context.drawImage(
		getImageForFilePath(sprite.path),
		sprite.origin.x, sprite.origin.y,
		sprite.size.width, sprite.size.height,
		x * TILE_SIZE + offset.x, y * TILE_SIZE + offset.y,
		TILE_SIZE, TILE_SIZE,
	);
}

export function drawThing(context: CanvasRenderingContext2D, x: number, y: number, color: string): void {
    context.fillStyle = color;
    context.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE - GAP, TILE_SIZE - GAP);
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
