import { GameState, Position } from './types.js';
import { generateLevel, doesPositionExistInLevel, getLevel, findTileInLevel, getEntitiesInLevel, addEntityToLevel, Level, findSurroundingTiles, getTilesInLevel } from './levels.js';
import { draw, addSprite, GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from './rendering.js';
import { Entity, moveEntityToPosition, createEntity, removeEntityFromLevel, findEntities, findEntity, moveEntityToLevel } from './entities.js';
import { eventBus } from './utilities/EventBus.js';
import { setupGame } from './utilities/setupGame.js';
import { start } from './utilities/tick.js';
import { getEntitiesOnTile, Tile } from './tiles.js';
import { choose } from './random/choose.js';
import { Graph } from './graph/graph.js';
import { resolvePath } from './graph/resolvePath.js';
import { aStar } from './graph/search/aStar.js';
import { calculateManhattanDistance } from './graph/calculateManhattanDistance.js';

const { context } = setupGame('body', {width: GAME_WIDTH, height: GAME_HEIGHT}, 1);

eventBus.on('update', update);
eventBus.on('update', updateActionTicks);
eventBus.on('update', decideActions)
eventBus.on('concludeTurn', spendEnergy);
eventBus.on('draw', draw);

const state: GameState = {
	currentLevel: null,
    entities: {},
	tiles: {},
	levels: {},
	sprites: {},
	debugging: false,
}

addSprite(state, 'exit', 'src/assets/staircase.png', { width: 16, height: 16 });
addSprite(state, 'entrance', 'src/assets/trapdoor.png', { width: 16, height: 16 });
addSprite(state, 'hoarder', 'src/assets/hoarder.png', { width: 16, height: 16 });
addSprite(state, 'bookcase', 'src/assets/bookcase.png', { width: 16, height: 16 });
addSprite(state, 'bookcase-low', 'src/assets/bookcase-low.png', { width: 16, height: 16 });
addSprite(state, 'bookcase-low-decorated', 'src/assets/bookcase-low-decorated.png', { width: 16, height: 16 });
addSprite(state, 'table', 'src/assets/table.png', { width: 16, height: 16 });
addSprite(state, 'skeleton', 'src/assets/skeleton.png', { width: 16, height: 16 });
addSprite(state, 'skulls', 'src/assets/skulls.png', { width: 16, height: 16 });

function findLevelExitPosition(state: GameState, level: Level): Position | undefined {
	const exitObject = findEntity(getEntitiesInLevel(state, level), { isExit: true });

	if (!exitObject) {
		return;
	}

	return exitObject.position;
}

const levelOne = generateLevel(state, { width: 7, height: 7 });
const levelTwo = generateLevel(state, { width: 7, height: 7 }, findLevelExitPosition(state, levelOne));
const levelThree = generateLevel(state, { width: 7, height: 7 }, findLevelExitPosition(state, levelTwo));
const levelFour = generateLevel(state, { width: 7, height: 7 }, findLevelExitPosition(state, levelThree));
const levelFive = generateLevel(state, { width: 7, height: 7 }, findLevelExitPosition(state, levelFour));
const levelSix = generateLevel(state, { width: 7, height: 7 }, findLevelExitPosition(state, levelFive));
const levelSeven = generateLevel(state, { width: 7, height: 7 }, findLevelExitPosition(state, levelSix));

const run = {
	levels: [
		levelOne.id,
		levelTwo.id,
		levelThree.id,
		levelFour.id,
		levelFive.id,
		levelSix.id,
		levelSeven.id,
	],
}

state.currentLevel = levelOne.id;

const entranceEntity = getEntitiesInLevel(state, levelOne).find((entity) => entity.isEntrance);
if (entranceEntity) {
	const entranceTile = findTileInLevel(state, levelOne, entranceEntity.position);

	addEntityToLevel(state, createEntity(state, {
		sprite: 'hoarder',
		isActor: true,
		isPlayer: true,
		isSolid: true,
		actionCost: 100,
		health: {
			max: 99,
			current: 99,
		},
	}), levelOne, entranceTile.position);
}

console.log(state);

start((time: number) => {
    eventBus.emit('update', time, state);
    eventBus.emit('draw', time, state, context);
});

window.addEventListener('keyup', (event: KeyboardEvent) => {
	if (state.currentLevel) {
		const playerEntity = findEntity(
			getEntitiesInLevel(state, getLevel(state, state.currentLevel)),
			{ isPlayer: true }
		);

		if (playerEntity) {
			if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
				actInDirection(state, playerEntity, 0, -1);
			}

			if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
				actInDirection(state, playerEntity, 1, 0);
			}

			if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
				actInDirection(state, playerEntity, 0, 1);
			}

			if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
				actInDirection(state, playerEntity, -1, 0);
			}

			if (event.key === ' ' || event.key.toLowerCase() === 'e') {
				performContextSensitiveAction(state, playerEntity);
			}

			if (event.key === 'q') {
				eventBus.emit('concludeTurn', playerEntity, playerEntity.actionCost);
			}

			if (state.debugging && event.key.toLowerCase() === '[') {
				showPreviousLevel();
			}

			if (state.debugging && event.key.toLowerCase() === ']') {
				showNextLevel();
			}
		}
	}
});

function update(time: number, state: GameState): void {
	if (state.currentLevel) {
		const currentLevel = getLevel(state, state.currentLevel);
		const entitiesInLevel = getEntitiesInLevel(state, currentLevel);

		findEntities(entitiesInLevel, {
			drawOffset: true
		}).forEach((entity) => {
			if (entity.drawOffset.x > 0) {
				entity.drawOffset.x = Math.max(entity.drawOffset.x - 16, 0);
			} else if (entity.drawOffset.x < 0) {
				entity.drawOffset.x = Math.min(entity.drawOffset.x + 16, 0);
			}

			if (entity.drawOffset.y > 0) {
				entity.drawOffset.y = Math.max(entity.drawOffset.y - 16, 0);
			} else if (entity.drawOffset.y < 0) {
				entity.drawOffset.y = Math.min(entity.drawOffset.y + 16, 0);
			}
		});
	}
}

function findNextActingEntity(state: GameState): Entity | undefined {
	if (!state.currentLevel) {
		return;
	}

	const currentLevel = getLevel(state, state.currentLevel);
	const entitiesInLevel = getEntitiesInLevel(state, currentLevel);

	return findEntity(entitiesInLevel, {
		isNonPlayer: true,
		position: true,
		actionTicks: 0,
	});
}

function decideActions(time: number, state: GameState): void {
	if (!state.currentLevel) {
		return;
	}

	const currentLevel = getLevel(state, state.currentLevel);
	let nextActingEntity = findNextActingEntity(state);

	while (nextActingEntity) {
		const currentActingEntity = nextActingEntity;

		// Try to find a path to the player
		const playerEntity = findEntity(getEntitiesInLevel(state, currentLevel), { isPlayer: true });

		if (playerEntity) {
			const levelGraph = createGraphFromLevel(state, currentLevel);
			const nonPlayerTile = findTileInLevel(state, currentLevel, currentActingEntity.position);
			const playerTile = findTileInLevel(state, currentLevel, playerEntity.position);
			const path = resolvePath(nonPlayerTile, playerTile, aStar(levelGraph, nonPlayerTile, playerTile, (current: Tile, goal: Tile): number => {
				return calculateManhattanDistance(current.position.x, current.position.y, goal.position.x, goal.position.y);
			}));

			if (path.length && path[0] === playerTile) {
				attackEntity(playerEntity, currentActingEntity);
				nextActingEntity = findNextActingEntity(state);
				continue;
			}

			if (path.length && getEntitiesOnTile(state, path[0]).every((entity: Entity) => !entity.isSolid)) {
				actInDirection(
					state,
					currentActingEntity,
					path[0].position.x - currentActingEntity.position.x,
					path[0].position.y - currentActingEntity.position.y
				);
				nextActingEntity = findNextActingEntity(state);
				continue;
			}
		}

		// If no path found, just do something random
		const surroundingTiles = findSurroundingTiles(state, currentLevel, currentActingEntity.position);

		const tilesWithoutObstacles = surroundingTiles.filter(tile => {
			const entitiesOnTile = getEntitiesOnTile(state, tile)
			return entitiesOnTile.every(entity => !entity.isSolid);
		});

		if (tilesWithoutObstacles.length === 0) {
			eventBus.emit('concludeTurn', currentActingEntity, currentActingEntity.actionCost);
			nextActingEntity = findNextActingEntity(state);
			continue;
		}

		const targetTile = choose(tilesWithoutObstacles);

		actInDirection(
			state,
			currentActingEntity,
			targetTile.position.x - currentActingEntity.position.x,
			targetTile.position.y - currentActingEntity.position.y
		);
		nextActingEntity = findNextActingEntity(state);
		continue;
	}
}

function createGraphFromLevel(state: GameState, level: Level): Graph {
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

	levelGraph.nodes.forEach(node => {
		const entitiesOnTile = getEntitiesOnTile(state, node);

		if (entitiesOnTile.some(entity => entity.isSolid && !entity.isActor)) {
			levelGraph.removeNode(node);
		}
	});

	return levelGraph;
}

function actInDirection(state: GameState, entity: Entity, dx: number, dy: number): void {
	const nextPosition: Position = {
		x: (entity.position.x as number) + dx,
		y: (entity.position.y as number) + dy,
	};
	const level = getLevel(state, entity.currentLevel);

    if (!doesPositionExistInLevel(level, nextPosition)) {
        return;
    }

    const nextTile = findTileInLevel(state, level, nextPosition);
    const entitiesOnNextTile = getEntitiesOnTile(state, nextTile);

    if (entitiesOnNextTile.some(entity => entity.isSolid && !entity.hasOwnProperty('health'))) {
        return;
    }

    const attackableEntity = entitiesOnNextTile.find(entity => entity.hasOwnProperty('health'));

    if (attackableEntity) {
		attackEntity(attackableEntity, entity);
		return;
	}

	moveEntityToPosition(state, entity, nextPosition);
	entity.drawOffset = {
		x: -1 * dx * TILE_SIZE,
		y: -1 * dy * TILE_SIZE,
	}

	eventBus.emit('concludeTurn', entity, entity.actionCost);
	return;
}

function attackEntity(target: Entity, source: Entity): void {
	target.health.current -= 1;
	if (target.health.current === 0) {
		removeEntityFromLevel(state, target);
	}

	eventBus.emit('concludeTurn', source, source.actionCost);

}

function spendEnergy(entity: Entity, energy: number): void {
	if (!entity.hasOwnProperty('actionTicks')) {
		entity.actionTicks = energy;
	} else {
		entity.actionTicks = entity.actionTicks + energy;
	}
}

function updateActionTicks(time: number, state: GameState): void {
	if (state.currentLevel) {
		const currentLevel = getLevel(state, state.currentLevel);
		const entitiesInLevel = getEntitiesInLevel(state, currentLevel);

		const actorsWithoutActionTicks = findEntities(entitiesInLevel, {
			isActor: true,
			actionTicks: false,
		});

		actorsWithoutActionTicks.forEach(entity => {
			if (entity.isPlayer) {
				entity.actionTicks = 0;
			} else {
				entity.actionTicks = 100;
			}
		})

		const entitiesThatCanAct = findEntities(entitiesInLevel, { actionTicks: 0 });

		if (entitiesThatCanAct.length === 0) {
			const entitiesWithActionTicks = findEntities(entitiesInLevel, {
				actionTicks: (actionTicks: number) => actionTicks > 0,
			});

			if (entitiesWithActionTicks.length > 0) {
				const ticksUntilNextTurn = entitiesWithActionTicks.reduce((lowestTicksFound: number, entity) => {
					if (lowestTicksFound > entity.actionTicks) {
						return entity.actionTicks;
					}

					return lowestTicksFound;
				}, Infinity);

				entitiesWithActionTicks.forEach((entity) => {
					entity.actionTicks = entity.actionTicks - ticksUntilNextTurn;
				});
			}
		}
	}
}

function performContextSensitiveAction(state: GameState, entity: Entity): void {
	const currentLevel = getLevel(state, entity.currentLevel);
	const entitiesOnTile = getEntitiesOnTile(state, findTileInLevel(state, currentLevel, entity.position), [entity]);

	if (entitiesOnTile.some(entity => entity.isExit)) {
		exitLevel(state, entity);
	}
}

function exitLevel(state: GameState, entity: Entity): void {
	const isCurrentLevelFinalLevel = run.levels.indexOf(entity.currentLevel) === run.levels.length - 1;

	if (isCurrentLevelFinalLevel && entity.isPlayer) {
		console.log('Victory!');
		return;
	}

	if (isCurrentLevelFinalLevel && !entity.isPlayer) {
		removeEntityFromLevel(state, entity);
		return;
	}

	const nextLevel = getLevel(state, run.levels[run.levels.indexOf(entity.currentLevel) + 1]);
	const entranceToLevel = findEntity(getEntitiesInLevel(state, nextLevel), { isEntrance: true, position: true });
	if (entranceToLevel) {
		moveEntityToLevel(state, entity, nextLevel, entranceToLevel.position);
		state.currentLevel = nextLevel.id;
	}
}

function showNextLevel(): void {
	const currentLevelIndex = run.levels.indexOf(state.currentLevel as string);

	if (currentLevelIndex === run.levels.length - 1) {
		state.currentLevel = run.levels[0];
	} else {
		state.currentLevel = run.levels[currentLevelIndex + 1];
	}
}

function showPreviousLevel(): void {
	const currentLevelIndex = run.levels.indexOf(state.currentLevel as string);

	if (currentLevelIndex === 0) {
		state.currentLevel = run.levels[run.levels.length - 1];
	} else {
		state.currentLevel = run.levels[currentLevelIndex - 1];
	}
}
