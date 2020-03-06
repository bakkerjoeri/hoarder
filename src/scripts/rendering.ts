import { Tile } from './tiles.js';
import { Entity, findEntities, findEntity, getEntity } from './entities.js';
import { GameState, Size, Position } from './types.js';
import { getTilesInLevel, getLevel, getEntitiesInLevel } from './levels.js';
import { PlayerEntity } from './entities/PlayerEntity.js';
import { repeat } from './utilities/repeat.js';
import { color0, color1, color2, color4, color8  } from './../assets/colors.js';

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

export const GAME_WIDTH = 12 * TILE_SIZE;
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
		});

		// Draw player UI
		const playerEntity = findEntity(entitiesInLevel, { isPlayer: true }) as PlayerEntity;
		if (playerEntity && playerEntity.inventory) {

			// Draw player inventory
			drawText(
				context,
				'inventory:',
				16,
				7 * TILE_SIZE,
				2 * TILE_SIZE + 44,
				color1,
			);

			const inventoryEntities = playerEntity.inventory.map((entityId) => getEntity(state, entityId));
			repeat(4, (slotIndex) => {
				const itemInSlot = inventoryEntities[slotIndex];

				drawText(
					context,
					`slot ${slotIndex + 1}`,
					16,
					8 * TILE_SIZE,
					(3 + slotIndex) * TILE_SIZE + 4,
					itemInSlot ? color2 : color1,
				);

				if (itemInSlot) {
					drawSprite(
						getSprite(state, inventoryEntities[slotIndex].sprite),
						context,
						7,
						3 + slotIndex,
					);

					drawText(
						context,
						`${itemInSlot.name}`,
						16,
						8 * TILE_SIZE,
						(3 + slotIndex) * TILE_SIZE + 22,
						color1,
					);

					drawText(
						context,
						`${itemInSlot.cost}¢`,
						16,
						8 * TILE_SIZE,
						(3 + slotIndex) * TILE_SIZE + 40,
						color8,
					);

					drawText(
						context,
						`${itemInSlot.effectDescription}`,
						16,
						8 * TILE_SIZE + 28,
						(3 + slotIndex) * TILE_SIZE + 40,
						color1,
					);
				}
			});

			// Draw health
			drawText(
				context,

				`health: ${playerEntity.health.current}/${playerEntity.health.max}HP`,
				16,
				7 * TILE_SIZE,
				0,
				color4,
			);

			// Draw coins
			drawText(
				context,
				`coins: ${playerEntity.coins}¢`,
				16,
				7 * TILE_SIZE,
				18,
				color8,
			);
		}
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

export function drawText(context: CanvasRenderingContext2D, text: string, size: number, textX: number, textY: number, color = color0): void {
	context.fillStyle = color;
	context.textBaseline = 'top';
    context.font = `${size}px monospace`;
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
