import { GameState, Position } from './types.js';
import { generateLevel, doesPositionExistInLevel, getLevel, findTileInLevel, getEntitiesInLevel, addEntityToLevel, Level, findSurroundingTiles, getTilesInLevelWithoutEntities, createGraphFromLevel, findTileInLevelWithEntity } from './levels.js';
import { draw, addSprite, GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from './rendering.js';
import { Entity, moveEntityToPosition, addEntity, removeEntityFromLevel, findEntities, findEntity, moveEntityToLevel, getEntity, getEntities } from './entities.js';
import { eventBus } from './utilities/EventBus.js';
import { setupGame } from './utilities/setupGame.js';
import { start } from './utilities/tick.js';
import { getEntitiesOnTile, Tile } from './tiles.js';
import { choose } from './random/choose.js';
import { resolvePath } from './graph/resolvePath.js';
import { aStar } from './graph/search/aStar.js';
import { calculateManhattanDistance } from './graph/calculateManhattanDistance.js';
import { createHealthComponent } from './components/HealthComponent.js';
import { spritesheet } from '../assets/spritesheet.js';
import { floodFill } from './graph/floodFill.js';
import { breadthFirstSearch } from './graph/search/breadthFirstSearch.js';
import { createWitchHatEntity } from './entities/items/WitchHat.js';
import { createHornetBoxEntity } from './entities/items/HornetBox.js';
import { createPileOfCoinsEntity, getSpriteNameForCoinAmount } from './entities/PileOfCoins.js';
import { repeat } from './utilities/repeat.js';
import { createHornetEntity } from './entities/actors/Hornet.js';
import { createFrogEntity } from './entities/actors/Frog.js';
import { createPlayerEntity } from './entities/actors/Player.js';

const { context } = setupGame('body', {width: GAME_WIDTH, height: GAME_HEIGHT}, 1);

eventBus.on('update', update);
eventBus.on('update', updateActionTicks);
eventBus.on('update', decideActions);
eventBus.on('concludeTurn', spendEnergy);
eventBus.on('beforeDraw', updateCoinSprite);
eventBus.on('draw', draw);

const state: GameState = {
	currentLevel: null,
    entities: {},
	tiles: {},
	levels: {},
	sprites: {},
	debugging: false,
}

spritesheet.forEach((sprite) => {
	addSprite(state, sprite.name, sprite.path, sprite.size, sprite.origin);
});

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

	addEntityToLevel(state, addEntity(state, createPlayerEntity()), levelOne, entranceTile.position);

	repeat(5, (amount) => {
		addEntityToLevel(
			state,
			addEntity(state, createPileOfCoinsEntity(amount)),
			levelOne,
			choose(getTilesInLevelWithoutEntities(state, levelOne)).position
		);
	})

	addEntityToLevel(
		state,
		addEntity(state, createWitchHatEntity()),
		levelOne,
		choose(getTilesInLevelWithoutEntities(state, levelOne)).position
	);

	addEntityToLevel(
		state,
		addEntity(state, createHornetBoxEntity()),
		levelOne,
		choose(getTilesInLevelWithoutEntities(state, levelOne)).position
	);
}

console.log(state);

start((time: number) => {
	eventBus.emit('update', time, state);
    eventBus.emit('beforeDraw', time, state, context);
    eventBus.emit('draw', time, state, context);
});

window.addEventListener('keyup', (event: KeyboardEvent) => {
	if (!state.currentLevel) {
		return;
	}

	const playerEntityThatCanAct = findEntity(getEntitiesInLevel(state, getLevel(state, state.currentLevel)), {
		isPlayer: true,
		actionTicks: 0,
	});

	if (!playerEntityThatCanAct) {
		return;
	}

	if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
		actInDirection(state, playerEntityThatCanAct, 0, -1);
	}

	if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
		actInDirection(state, playerEntityThatCanAct, 1, 0);
	}

	if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
		actInDirection(state, playerEntityThatCanAct, 0, 1);
	}

	if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
		actInDirection(state, playerEntityThatCanAct, -1, 0);
	}

	if (event.key === ' ' || event.key.toLowerCase() === 'e') {
		performContextSensitiveAction(state, playerEntityThatCanAct);
	}

	if (event.key === 'q') {
		eventBus.emit('concludeTurn', playerEntityThatCanAct, playerEntityThatCanAct.actionCost);
	}

	if (event.key === 'g') {
		dropCoins(state, playerEntityThatCanAct, playerEntityThatCanAct.position, 3);
	}

	if (event.key === '1') {
		useItemInSlot(state, playerEntityThatCanAct, 0);
	}

	if (event.key === '2') {
		useItemInSlot(state, playerEntityThatCanAct, 1);
	}

	if (event.key === '3') {
		useItemInSlot(state, playerEntityThatCanAct, 2);
	}

	if (event.key === '4') {
		useItemInSlot(state, playerEntityThatCanAct, 3);
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

function updateCoinSprite(time: number, state: GameState): void {
	const pileOfCoinsEntities = findEntities(getEntities(state), {
		isPileOfCoins: true,
	});

	pileOfCoinsEntities.forEach(pileOfCoinsEntity => {
		pileOfCoinsEntity.sprite = getSpriteNameForCoinAmount(pileOfCoinsEntity.amount);
	})
}

function dropCoins(state: GameState, entity: Entity, position: Position, amount: number): void {
	const currentLevel = getLevel(state, entity.currentLevel);
	const droppedAmount = Math.min(amount, entity.coins);

	entity.coins = entity.coins - droppedAmount;

	putCoinsOnPositionInLevel(state, position, currentLevel, droppedAmount);
}

function putCoinsOnPositionInLevel(state: GameState, position: Position, level: Level, amount: number): void {
	const tileToPutCoinsOn = findTileInLevel(state, level, position)
	const coinPileOnTile = findEntity(getEntitiesOnTile(state, tileToPutCoinsOn), {
		isPileOfCoins: true,
	});

	if (coinPileOnTile) {
		coinPileOnTile.amount = coinPileOnTile.amount + amount;
	} else {
		addEntityToLevel(state, addEntity(state, createPileOfCoinsEntity(amount)), level, position);
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

		// Find current closest target
		// create a level graph
		const levelGraph = createGraphFromLevel(state, currentLevel);

		// floodfill to find reachable tiles and filter by which contain opposing creatures
		// Alternative: find tiles with opposing creatures and filter by whether they're in graph
		const actingEntityTile = findTileInLevel(state, currentLevel, currentActingEntity.position);
		const reachableTiles = floodFill(levelGraph, actingEntityTile) as Tile[];

		// find entities within those tiles that are of the opposite alliance
		const possibleTargets = reachableTiles.reduce((targets: Entity[], tile): Entity[] => {
			const targetsOnTile = findEntities(getEntitiesOnTile(state, tile, [currentActingEntity]), {
				isEnemy: (isEnemy: boolean) => isEnemy === !currentActingEntity.isEnemy,
			});
			return [
				...targets,
				...targetsOnTile,
			];
		}, []);

		// find the closest of those targets
		let pathLength = Infinity;

		const closestTarget = possibleTargets.reduce((closestTarget: Entity | undefined, currentTarget) => {
			const startTile = actingEntityTile
			const goalTile = findTileInLevelWithEntity(state, currentLevel, currentTarget);
			const pathToTarget = resolvePath(startTile, startTile, breadthFirstSearch(levelGraph, startTile, goalTile));

			if (pathToTarget.length < pathLength) {
				pathLength = pathToTarget.length;
				return currentTarget;
			}

			return closestTarget;
		}, undefined);

		if (closestTarget) {
			const targetEntity = closestTarget;
			const targetEntityTile = findTileInLevelWithEntity(state, currentLevel, targetEntity);

			const path = resolvePath(
				actingEntityTile,
				targetEntityTile,
				aStar(levelGraph, actingEntityTile, targetEntityTile, (current: Tile, goal: Tile): number => {
					return calculateManhattanDistance(current.position.x, current.position.y, goal.position.x, goal.position.y);
				})
			);

			if (path.length && path[0] === targetEntityTile) {
				attackEntity(targetEntity, currentActingEntity);
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

		// If no path to a potential target could be found, just do something random
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

	if (target.isEnemy === source.isEnemy) {
		target.isEnemy = !target.isEnemy;
	}

	if (target.health.current === 0) {
		dropCoins(state, target, target.position, target.coins);
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

	const exitEntity = entitiesOnTile.find(entityOnTile => entityOnTile.isExit)
	if (exitEntity) {
		exitLevel(state, entity);
		return;
	}

	const itemEntity = entitiesOnTile.find(entityOnTile => entityOnTile.isItem);
	if (itemEntity) {
		entity.inventory.push(itemEntity.id);
		removeEntityFromLevel(state, itemEntity);
		return;
	}

	const pileOfCoinsEntity = entitiesOnTile.find(entityOnTile => entityOnTile.isPileOfCoins);
	if (pileOfCoinsEntity) {
		entity.coins = entity.coins + pileOfCoinsEntity.amount;
		removeEntityFromLevel(state, pileOfCoinsEntity);
		return;
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

function useItemInSlot(state: GameState, entity: Entity, slotIndex: number): void {
	if (!entity.inventory.hasOwnProperty(slotIndex)) {
		return;
	}

	const itemEntity = getEntity(state, entity.inventory[slotIndex]);

	if (entity.coins < itemEntity.cost) {
		return;
	}

	if (itemEntity.effect === 'summonFrog') {
		const levelOfEntity = getLevel(state, entity.currentLevel);
		const freeTiles = getTilesInLevelWithoutEntities(state, getLevel(state, entity.currentLevel));

		if (!freeTiles.length) {
			return;
		}

		const tileForFrog = choose(freeTiles);
		addEntityToLevel(state, addEntity(state, createFrogEntity(false)), levelOfEntity, tileForFrog.position);

		entity.coins = entity.coins - itemEntity.cost;
	}

	if (itemEntity.effect === 'summonHornet') {
		const levelOfEntity = getLevel(state, entity.currentLevel);
		const freeTiles = getTilesInLevelWithoutEntities(state, getLevel(state, entity.currentLevel));

		if (!freeTiles.length) {
			return;
		}

		const tileForHornet = choose(freeTiles);
		addEntityToLevel(state, addEntity(state, createHornetEntity(false)), levelOfEntity, tileForHornet.position);

		entity.coins = entity.coins - itemEntity.cost;
	}
}
