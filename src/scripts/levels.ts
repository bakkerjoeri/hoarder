import { GameState, Size, Position } from './types.js';
import { Tile, createTile, getTile, addEntityToTile } from './tiles.js';
import { createUuid } from './utilities/createUuid.js';
import { repeat } from './utilities/repeat.js';
import { getRandomNumberInRange } from './random/getRandomNumberInRange.js';
import { createEntity, Entity } from './entities.js';

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

	addEntityToLevel(state, createEntity(state, {
		sprite: 'exit',
		isExit: true,
	}), level, {
		x: getRandomNumberInRange(0, size.width - 1),
		y: getRandomNumberInRange(0, size.height - 1),
	});

	return level;
}


// function generateMap(state: GameState): void {
// 	state.tiles = createTileMap(7, 7);

// 	repeat(3, () => {
// 		const freeTiles = getTiles(state).filter(tile => !tile.entities.length);
// 		const tileForEnemy = choose(freeTiles);

// 		addEntityToMap(state, createEntity({
// 			color: 'red',
// 			isSolid: true,
// 			health: {
// 				max: 3,
// 				current: 3,
// 			},
// 		}), tileForEnemy.position.x, tileForEnemy.position.y);
// 	});

// 	repeat(5, () => {
// 		const freeTiles = getTiles(state).filter(tile => !tile.entities.length);
// 		const tileForWall = choose(freeTiles);

// 		addEntityToMap(state, createEntity({
// 			color: 'black',
// 			isSolid: true,
// 		}), tileForWall.position.x, tileForWall.position.y);
// 	});

// 	repeat(1, () => {
// 		const freeTiles = getTiles(state).filter(tile => !tile.entities.length);
// 		const tileForPlayer = choose(freeTiles);

// 		addEntityToMap(state, createEntity({
// 			player: true,
// 			color: 'blue',
// 			isSolid: true,
// 			health: {
// 				max: 3,
// 				current: 3,
// 			},
// 			charge: 0,
// 		}), tileForPlayer.position.x, tileForPlayer.position.y);
// 	});

// 	repeat(1, () => {
// 		const freeTiles = getTiles(state).filter(tile => !tile.entities.length);
// 		const exitTile = choose(freeTiles);

// 		addEntityToMap(state, createEntity({
// 			sprite: 'staircase',
// 			isExit: true,
// 		}), exitTile.position.x, exitTile.position.y);
// 	});
// }

