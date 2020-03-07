import { GameState, Size, Position } from './types.js';
import { Tile, createTile, getTile, addEntityToTile, getEntitiesOnTile } from './tiles.js';
import { createUuid } from './utilities/createUuid.js';
import { repeat } from './utilities/repeat.js';
import { getRandomNumberInRange } from './random/getRandomNumberInRange.js';
import { addEntity, Entity, ComponentFilterMap, doesEntityValueMatch } from './entities.js';
import { choose } from './random/choose.js';
import { cardinalDirections } from './graph/grid.js';
import { createHealthComponent } from './components/HealthComponent.js';
import { Graph } from './graph/graph.js';
import { createGochaponMachineEntity } from './entities/GochaponMachine.js';
import { floodFill } from './graph/floodFill.js';
import { breadthFirstSearch } from './graph/search/breadthFirstSearch.js';
import { resolvePath } from './graph/resolvePath.js';

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

export function findTileInLevelWithEntity(state: GameState, level: Level, entity: Entity): Tile | undefined {
	return getTilesInLevel(state, level).find(tile => {
		return tile.entities.includes(entity.id);
	});
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

export function findNearestEmptyTile(state: GameState, level: Level, position: Position): Tile | undefined {
	const levelGraph = createGraphFromLevel(state, level);
	const startTile = findTileInLevel(state, level, position);
	const graphSearchResults = breadthFirstSearch(levelGraph, startTile, (tile: Tile) => {
		return !getEntitiesOnTile(state, tile).some(entity => entity.isSolid);
	});

	const emptySearchResult = Array.from(graphSearchResults).find(searchResult => {
		return getEntitiesOnTile(state, searchResult[0]).every(entity => !entity.isSolid);
	})

	if (!emptySearchResult || !emptySearchResult.length) {
		return;
	}

	return emptySearchResult[0];
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

export function getTilesInLevelWithoutEntities(state: GameState, level: Level): Tile[] {
	return getTilesInLevel(state, level).filter(tile => !tile.entities.length);
}

export function createGraphFromLevel(state: GameState, level: Level, filter?: (entity: Entity) => boolean): Graph {
	const levelGraph = new Graph();
	const tilesInLevel = getTilesInLevel(state, level);

	tilesInLevel.forEach(tile => {
		levelGraph.addNode(tile);
	});

	levelGraph.nodes.forEach(node => {
		const neighbours = findSurroundingTiles(state, level, node.position);

		neighbours.forEach(neighbour => {
			levelGraph.addEdge(node, neighbour);
		});
	});

	if (filter) {
		levelGraph.nodes.forEach(node => {
			const entitiesOnTile = getEntitiesOnTile(state, node);

			if (entitiesOnTile.some(entity => !filter(entity))) {
				levelGraph.removeNode(node);
			}
		});
	}

	return levelGraph;
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

	addEntityToLevel(state, addEntity(state, {
		sprite: 'entrance',
		isEntrance: true,
	}), level, entrancePosition);

	repeat(5, () => {
		addEntityToLevel(state, addEntity(state, {
			sprite: choose(['bookcase', 'bookcase', 'bookcase-low', 'bookcase-low', 'bookcase-low', 'bookcase-low-decorated', 'table']),
			isSolid: true,
		}), level, choose(getTilesInLevelWithoutEntities(state, level)).position);
	});

	repeat(1, () => {
		addEntityToLevel(state, addEntity(state, {
			sprite: 'skeleton',
			isActor: true,
			isNonPlayer: true,
			isEnemy: true,
			isSolid: true,
			actionCost: 100,
			health: createHealthComponent(2),
			coins: 2,
		}), level, choose(getTilesInLevelWithoutEntities(state, level)).position);
	});

	repeat(1, () => {
		addEntityToLevel(state, addEntity(state, {
			sprite: 'skulls',
			isActor: true,
			isNonPlayer: true,
			isEnemy: true,
			isSolid: true,
			actionCost: 200,
			health: createHealthComponent(4),
			coins: 4,
		}), level, choose(getTilesInLevelWithoutEntities(state, level)).position);
	});

	repeat(1, () => {
		addEntityToLevel(
			state,
			addEntity(state, createGochaponMachineEntity()),
			level,
			choose(getTilesInLevelWithoutEntities(state, level)).position
		);
	});


	addEntityToLevel(state, addEntity(state, {
		sprite: 'exit',
		isExit: true,
	}), level, choose(getTilesInLevelWithoutEntities(state, level)).position);

	return level;
}

