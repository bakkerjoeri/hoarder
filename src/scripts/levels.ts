import { GameState, Size, Position } from './types.js';
import { Tile, createTile, getTile, addEntityToTile, getEntitiesOnTile } from './tiles.js';
import { createUuid } from './utilities/createUuid.js';
import { repeat } from './utilities/repeat.js';
import { getRandomNumberInRange } from './random/getRandomNumberInRange.js';
import { createEntity, Entity } from './entities.js';
import { choose } from './random/choose.js';
import { cardinalDirections } from './graph/grid.js';

export interface Level {
	id: string;
	tileSet: {
		[x: number]: {
			[y: number]: string;
		};
	};
}

export function createLevel(state: GameState): Level {
	const level = {
		id: createUuid(),
		tileSet: {},
	};

	state.levels = {
		...state.levels,
		[level.id]: level,
	};

	return level;
}

export function getLevel(state: GameState, levelId: string): Level {
	if (!state.levels.hasOwnProperty(levelId)) {
        throw new Error(`Level with ID ${levelId} doesn't exist.`);
	}

	return state.levels[levelId];
}

export function addTileToLevel(level: Level, tile: Tile): void {
	level.tileSet = {
		...level.tileSet,
		[tile.position.x]: {
			...level.tileSet[tile.position.x] || {},
			[tile.position.y]: tile.id,
		},
	};
}

export function addEntityToLevel(state: GameState, entity: Entity, level: Level, position: Position): void {
	entity.currentLevel = level.id;
	entity.position = position;
	const tile = findTileInLevel(state, level, position);
	addEntityToTile(entity, tile);
}

export function findTileInLevel(state: GameState, level: Level, position: Position): Tile {
	if (!doesPositionExistInLevel(level, position)) {
		throw new Error(`Tile with position ${position.x}, ${position.y} doesn't exist in level ${level.id}.`);
	}

	return getTile(state, level.tileSet[position.x][position.y]);
}

export function findSurroundingTiles(state: GameState, level: Level, position: Position, directions = cardinalDirections): Tile[] {
	const positionsInDirections = directions.map(direction => ({
		x: position.x + direction[0],
		y: position.y + direction[1],
	}));

	const existingPositions = positionsInDirections.filter((positionInDirection) => {
		return doesPositionExistInLevel(level, positionInDirection);
	});

	return existingPositions.map(existingPosition => findTileInLevel(state, level, existingPosition));
}

export function getEntitiesInLevel(state: GameState, level: Level): Entity[] {
	const tilesInLevel = getTilesInLevel(state, level);

	return tilesInLevel.reduce((entities: Entity[], tile) => {
		return [
			...entities,
			...getEntitiesOnTile(state, tile),
		];
	}, []);
}

export function doesPositionExistInLevel(level: Level, position: Position): boolean {
	return level.tileSet.hasOwnProperty(position.x)
		&& level.tileSet[position.x].hasOwnProperty(position.y);
}

export function getTilesInLevel(state: GameState, level: Level): Tile[] {
	const tileIds = Object.values(level.tileSet).reduce((tiles: string[], tileColumn: {[y: number]: string}): string[] => {
		return [
			...tiles,
			...Object.values(tileColumn).reduce((tilesInColumn: string[], tile: string): string[] => {
				return [
					...tilesInColumn,
					tile,
				];
			}, [])
		]
	}, []);

	return tileIds.map(tileId => getTile(state, tileId));
}

export function getFreeTilesInLevel(state: GameState, level: Level): Tile[] {
	return getTilesInLevel(state, level).filter(tile => !tile.entities.length);
}

export function generateLevel(state: GameState, size: Size, entrancePosition?: Position): Level {
	const level = createLevel(state);

	repeat(size.width, (x) => {
		repeat(size.height, (y) => {
			addTileToLevel(level, createTile(state, { x, y }));
		});
	});

	if (!entrancePosition) {
		entrancePosition = {
			x: getRandomNumberInRange(0, size.width - 1),
			y: getRandomNumberInRange(0, size.height - 1),
		};
	}

	addEntityToLevel(state, createEntity(state, {
		sprite: 'entrance',
		isEntrance: true,
	}), level, entrancePosition);

	repeat(5, () => {
		addEntityToLevel(state, createEntity(state, {
			sprite: choose(['bookcase', 'bookcase', 'bookcase-low', 'bookcase-low', 'bookcase-low', 'bookcase-low-decorated', 'table']),
			isSolid: true,
		}), level, choose(getFreeTilesInLevel(state, level)).position);
	});

	repeat(1, () => {
		addEntityToLevel(state, createEntity(state, {
			sprite: 'skeleton',
			isActor: true,
			isNonPlayer: true,
			isSolid: true,
			actionCost: 100,
			health: {
				current: 3,
				max: 3,
			},
		}), level, choose(getFreeTilesInLevel(state, level)).position);
	});

	repeat(1, () => {
		addEntityToLevel(state, createEntity(state, {
			sprite: 'skulls',
			isActor: true,
			isNonPlayer: true,
			isSolid: true,
			actionCost: 200,
			health: {
				current: 5,
				max: 5,
			},
		}), level, choose(getFreeTilesInLevel(state, level)).position);
	});


	addEntityToLevel(state, createEntity(state, {
		sprite: 'exit',
		isExit: true,
	}), level, choose(getFreeTilesInLevel(state, level)).position);

	return level;
}

