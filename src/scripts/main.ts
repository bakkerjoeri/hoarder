import { GameState, Position } from './types.js';
import { generateLevel, doesPositionExistInLevel, getLevel, findTileInLevel, getEntitiesInLevel, addEntityToLevel, Level, findSurroundingTiles, createGraphFromLevel, findTileInLevelWithEntity, findNearestEmptyTile } from './levels.js';
import { draw, addSprite, GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from './rendering.js';
import { Entity, moveEntityToPosition, addEntity, removeEntityFromLevel, findEntities, findEntity, moveEntityToLevel, getEntity, getEntities, EntityWith } from './entities.js';
import { setupGame } from './utilities/setupGame.js';
import { start } from './utilities/tick.js';
import { getEntitiesOnTile, Tile } from './tiles.js';
import { choose } from './random/choose.js';
import { resolvePath } from './graph/resolvePath.js';
import { aStar } from './graph/search/aStar.js';
import { calculateManhattanDistance } from './graph/calculateManhattanDistance.js';
import { spritesheet } from '../assets/spritesheet.js';
import { floodFill } from './graph/floodFill.js';
import { breadthFirstSearch } from './graph/search/breadthFirstSearch.js';
import { createPileOfCoinsEntity, getSpriteNameForCoinAmount } from './entities/PileOfCoins.js';
import { createPlayerEntity, PlayerEntity } from './entities/actors/Player.js';
import { createGochaponEggEntity } from './entities/GochaponEgg.js';
import { pullRandomItem, useItem } from './items.js';
import { ItemEntity } from './entities/ItemEntity.js';
import { ActorEntity } from './entities/ActorEntity.js';
import { EventHandlerTypes, StartSceneEvent, EndSceneEvent, ConcludeTurnEvent } from './events/types.js';
import { FunctionalEventEmitter } from './utilities/FunctionalEventEmitter.js';
import { arrayWithout } from './utilities/arrayWithout.js';

const { context } = setupGame('body', {width: GAME_WIDTH, height: GAME_HEIGHT}, 1);

const eventEmitter = new FunctionalEventEmitter<EventHandlerTypes>();

eventEmitter.on('start', startGame);
eventEmitter.on('afterUpdate', updateScene);
eventEmitter.on('startScene', handleStartScene);
eventEmitter.on('endScene', handleEndScene);
eventEmitter.on('draw', draw);

let state: GameState = {
	scene: {
		current: 'run',
		next: null,
		history: [],
	},
	currentLevel: null,
    entities: {},
	tiles: {},
	levels: {},
	sprites: {},
}

spritesheet.forEach((sprite) => {
	addSprite(state, sprite.name, sprite.path, sprite.size, sprite.origin);
});

function startGame(state: GameState): GameState {
	return eventEmitter.emit('startScene', state, { sceneName: state.scene.current });
}

function updateScene(state: GameState): GameState {
	if (!state.scene.next) {
		return state;
	}

	const currentScene = state.scene.current;
	const newScene = state.scene.next;

	state = {
		...state,
		scene: {
			...state.scene,
			current: currentScene,
			next: null,
		},
	};

	state.scene.history.push(currentScene);
	state = eventEmitter.emit('endScene', state, { sceneName: currentScene });
	state = eventEmitter.emit('startScene', state, { sceneName: newScene });

	return state;
}

function switchScene(state: GameState, newSceneName: string): void {
	if (state.scene.current === newSceneName) {
		return;
	}

	state.scene.next = newSceneName;
}

function handleStartScene(state: GameState, { sceneName }: StartSceneEvent): GameState {
	if (sceneName === 'run') {
		eventEmitter.on('update', updateActionTicks);
		eventEmitter.on('update', decideActions);
		eventEmitter.on('concludeTurn', spendEnergy);
		eventEmitter.on('beforeDraw', updateDrawOffset);
		eventEmitter.on('beforeDraw', updateCoinSprite);

		return createRunScene(state);
	}

	return state;
}

function handleEndScene(state: GameState, { sceneName }: EndSceneEvent): GameState {
	if (sceneName === 'run') {
		eventEmitter.remove('update', updateActionTicks);
		eventEmitter.remove('update', decideActions);
		eventEmitter.remove('concludeTurn', spendEnergy);
		eventEmitter.remove('beforeDraw', updateDrawOffset);
		eventEmitter.remove('beforeDraw', updateCoinSprite);
	}

	return state;
}

function createRunScene(state: GameState): GameState {
	const levelOne = generateLevel(state, { width: 7, height: 7 });
	const levelTwo = generateLevel(state, { width: 7, height: 7 }, findLevelExitPosition(state, levelOne));
	const levelThree = generateLevel(state, { width: 7, height: 7 }, findLevelExitPosition(state, levelTwo));
	const levelFour = generateLevel(state, { width: 7, height: 7 }, findLevelExitPosition(state, levelThree));
	const levelFive = generateLevel(state, { width: 7, height: 7 }, findLevelExitPosition(state, levelFour));
	const levelSix = generateLevel(state, { width: 7, height: 7 }, findLevelExitPosition(state, levelFive));
	const levelSeven = generateLevel(state, { width: 7, height: 7 }, findLevelExitPosition(state, levelSix));

	state.currentRun = {
		levels: [
			levelOne.id,
			levelTwo.id,
			levelThree.id,
			levelFour.id,
			levelFive.id,
			levelSix.id,
			levelSeven.id,
		],
	};

	state.currentLevel = levelOne.id;

	const entranceEntity = getEntitiesInLevel(state, levelOne).find((entity) => entity.isEntrance);
	if (entranceEntity) {
		const entranceTile = findTileInLevel(state, levelOne, entranceEntity.position);
		addEntityToLevel(state, addEntity(state, createPlayerEntity()), levelOne, entranceTile.position);
	}

	console.log(state);

	return state;
}

function findLevelExitPosition(state: GameState, level: Level): Position | undefined {
	const exitObject = findEntity(getEntitiesInLevel(state, level), { isExit: true });

	if (!exitObject) {
		return;
	}

	return exitObject.position;
}

state = eventEmitter.emit('start', state, {});
start((time: number) => {
	state = eventEmitter.emit('beforeUpdate', state, { time });
	state = eventEmitter.emit('update', state, { time });
	state = eventEmitter.emit('afterUpdate', state, { time });
	state = eventEmitter.emit('beforeDraw', state, { time });
	state = eventEmitter.emit('draw', state, { time, context });
	state = eventEmitter.emit('afterDraw', state, { time });

	return state;
});

window.addEventListener('keyup', (event: KeyboardEvent) => {
	if (!state.currentLevel) {
		return;
	}

	const playerEntityThatCanAct = findEntity(getEntitiesInLevel(state, getLevel(state, state.currentLevel)), {
		isPlayer: true,
		actionTicks: 0,
	}) as PlayerEntity;

	if (!playerEntityThatCanAct) {
		return;
	}

	if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
		event.preventDefault();
		actInDirection(state, playerEntityThatCanAct, 0, -1);
	}

	if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
		event.preventDefault();
		actInDirection(state, playerEntityThatCanAct, 1, 0);
	}

	if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
		event.preventDefault();
		actInDirection(state, playerEntityThatCanAct, 0, 1);
	}

	if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
		event.preventDefault();
		actInDirection(state, playerEntityThatCanAct, -1, 0);
	}

	if (event.key === ' ' || event.key.toLowerCase() === 'e') {
		event.preventDefault();
		performContextSensitiveAction(state, playerEntityThatCanAct);
	}

	if (event.keyCode === 49 && !event.shiftKey) { // 1
		event.preventDefault();
		useItemInSlot(state, playerEntityThatCanAct, 0);
	}

	if (event.keyCode === 50 && !event.shiftKey) { // 2
		event.preventDefault();
		useItemInSlot(state, playerEntityThatCanAct, 1);
	}

	if (event.keyCode === 51 && !event.shiftKey) { // 3
		event.preventDefault();
		useItemInSlot(state, playerEntityThatCanAct, 2);
	}

	if (event.keyCode === 52 && !event.shiftKey) { // 4
		event.preventDefault();
		useItemInSlot(state, playerEntityThatCanAct, 3);
	}

	if (event.keyCode === 49 && event.shiftKey) { // shift + 1
		event.preventDefault();
		sellItemInSlot(playerEntityThatCanAct, 0);
	}

	if (event.keyCode === 50 && event.shiftKey) { // shift + 2
		event.preventDefault();
		sellItemInSlot(playerEntityThatCanAct, 1);
	}

	if (event.keyCode === 51 && event.shiftKey) { // shift + 3
		event.preventDefault();
		sellItemInSlot(playerEntityThatCanAct, 2);
	}

	if (event.keyCode === 52 && event.shiftKey) { // shift + 4
		event.preventDefault();
		sellItemInSlot(playerEntityThatCanAct, 3);
	}
});

function updateDrawOffset(state: GameState): GameState {
	if (!state.currentLevel) {
		return state;
	}

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

	return state;
}

function updateCoinSprite(state: GameState): GameState {
	const pileOfCoinsEntities = findEntities(getEntities(state), {
		isPileOfCoins: true,
	});

	pileOfCoinsEntities.forEach(pileOfCoinsEntity => {
		pileOfCoinsEntity.sprite = getSpriteNameForCoinAmount(pileOfCoinsEntity.amount);
	});

	return state;
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

function decideActions(state: GameState): GameState {
	if (!state.currentLevel) {
		return state;
	}

	const currentLevel = getLevel(state, state.currentLevel);
	let nextActingEntity = findNextActingEntity(state);

	while (nextActingEntity) {
		const currentActingEntity = nextActingEntity;

		// Find current closest target
		// create a level graph
		const levelGraph = createGraphFromLevel(state, currentLevel, (entity) => {
			return !entity.isSolid || entity.isActor;
		});

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
				attackEntity(state, targetEntity, currentActingEntity);
				nextActingEntity = findNextActingEntity(state);
				continue;
			}

			if (path.length && getEntitiesOnTile(state, path[0]).every((entity: Entity) => !entity.isSolid)) {
				moveEntityInDirection(
					state,
					currentActingEntity,
					path[0].position.x - currentActingEntity.position.x,
					path[0].position.y - currentActingEntity.position.y
				);
				state = eventEmitter.emit('concludeTurn', state, {
					entity: currentActingEntity,
					energy: currentActingEntity.actionCost
				});
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
			state = eventEmitter.emit('concludeTurn', state, {
				entity: currentActingEntity,
				energy: currentActingEntity.actionCost
			});
			nextActingEntity = findNextActingEntity(state);
			continue;
		}

		const targetTile = choose(tilesWithoutObstacles);

		moveEntityInDirection(
			state,
			currentActingEntity,
			targetTile.position.x - currentActingEntity.position.x,
			targetTile.position.y - currentActingEntity.position.y
		);
		state = eventEmitter.emit('concludeTurn', state, {
			entity: currentActingEntity,
			energy: currentActingEntity.actionCost
		});
		nextActingEntity = findNextActingEntity(state);
		continue;
	}

	return state;
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

    const attackableEntity = entitiesOnNextTile.find(entity => entity.hasOwnProperty('health'));
    if (attackableEntity) {
		attackEntity(state, attackableEntity, entity);
		return;
	}

	const gochaponMachineEntity = entitiesOnNextTile.find(entity => entity.isGochaponMachine);
    if (gochaponMachineEntity) {
		// pay the machine
		if (entity.coins < gochaponMachineEntity.cost) {
			return;
		}

		// the machine should spawn an egg somewhere
		const spawnTile = findNearestEmptyTile(state, level, entity.position);

		if (!spawnTile) {
			return;
		}

		entity.coins = entity.coins - gochaponMachineEntity.cost;
		const gochaponEggContents = pullRandomItem();
		addEntity(state, gochaponEggContents);
		addEntityToLevel(state, addEntity(state, createGochaponEggEntity(gochaponEggContents.id)), level, spawnTile.position);

		return;
	}

	if (entitiesOnNextTile.some(entity => entity.isSolid)) {
		return;
	}

	moveEntityInDirection(state, entity, dx, dy);
	state = eventEmitter.emit('concludeTurn', state, {
		entity: entity,
		energy: entity.actionCost
	});
	return;
}

function moveEntityInDirection(state: GameState, entity: Entity, dx: number, dy: number): void {
	const nextPosition: Position = {
		x: (entity.position.x as number) + dx,
		y: (entity.position.y as number) + dy,
	};

	moveEntityToPosition(state, entity, nextPosition);
		entity.drawOffset = {
			x: -1 * dx * TILE_SIZE,
			y: -1 * dy * TILE_SIZE,
		}
}

function attackEntity(state: GameState, target: Entity, source: Entity): void {
	target.health.current -= 1;

	if (!target.isPlayer && target.isEnemy === source.isEnemy) {
		target.isEnemy = !target.isEnemy;
	}

	if (target.health.current === 0) {
		if (target.hasOwnProperty('coins') && target.coins > 0) {
			dropCoins(state, target, target.position, target.coins);
		}

		if (target.hasOwnProperty('hasItem')) {
			addEntityToLevel(
				state,
				getEntity(state, target.hasItem),
				getLevel(state, target.currentLevel),
				target.position
			);
		}

		removeEntityFromLevel(state, target);

		if (target.isPlayer) {
			switchScene(state, 'gameOver');
		}
	}

	state = eventEmitter.emit('concludeTurn', state, {
		entity: source,
		energy: source.actionCost
	});
}

function spendEnergy(state: GameState, { entity, energy }: ConcludeTurnEvent): GameState {
	if (!entity.hasOwnProperty('actionTicks')) {
		entity.actionTicks = energy;
	} else {
		entity.actionTicks = entity.actionTicks + energy;
	}

	return state;
}

function updateActionTicks(state: GameState): GameState {
	if (!state.currentLevel) {
		return state;
	}

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

	return state;
}

function performContextSensitiveAction(state: GameState, entity: Entity): void {
	const currentLevel = getLevel(state, entity.currentLevel);
	const entitiesOnTile = getEntitiesOnTile(state, findTileInLevel(state, currentLevel, entity.position), [entity]);

	const pileOfCoinsEntity = entitiesOnTile.find(entityOnTile => entityOnTile.isPileOfCoins);
	if (pileOfCoinsEntity) {
		entity.coins = entity.coins + pileOfCoinsEntity.amount;
		removeEntityFromLevel(state, pileOfCoinsEntity);
		return;
	}

	const itemEntity = entitiesOnTile.find(entityOnTile => entityOnTile.isItem);
	if (itemEntity && entity.inventory.length < 4) {
		entity.inventory.push(itemEntity.id);
		removeEntityFromLevel(state, itemEntity);
		return;
	}

	const exitEntity = entitiesOnTile.find(entityOnTile => entityOnTile.isExit)
	if (exitEntity) {
		exitLevel(state, entity);
		return;
	}
}

function exitLevel(state: GameState, entity: Entity): void {
	if (!state.currentRun) {
		return;
	}

	const isCurrentLevelFinalLevel = state.currentRun.levels.indexOf(entity.currentLevel) === state.currentRun.levels.length - 1;

	if (isCurrentLevelFinalLevel && entity.isPlayer) {
		console.log('Victory!');
		return;
	}

	if (isCurrentLevelFinalLevel && !entity.isPlayer) {
		removeEntityFromLevel(state, entity);
		return;
	}

	const nextLevel = getLevel(state, state.currentRun.levels[state.currentRun.levels.indexOf(entity.currentLevel) + 1]);
	const entranceToLevel = findEntity(getEntitiesInLevel(state, nextLevel), { isEntrance: true, position: true });
	if (entranceToLevel) {
		moveEntityToLevel(state, entity, nextLevel, entranceToLevel.position);
		state.currentLevel = nextLevel.id;
	}
}

function useItemInSlot(state: GameState, entity: ActorEntity, slotIndex: number): GameState {
	if (!entity.inventory[slotIndex]) {
		return state;
	}

	const itemEntity = getEntity(state, entity.inventory[slotIndex]) as ItemEntity;

	if (entity.coins < itemEntity.cost) {
		return state;
	}

	const hasUsedItemWithSuccess = useItem(state, itemEntity.name, entity);

	if (hasUsedItemWithSuccess) {
		entity.coins = entity.coins - itemEntity.cost;
	}
}

function sellItemInSlot<EntityType extends EntityWith<{
	inventory: string[];
	coins: number;
}>>(
	entity: EntityType,
	slotIndex: number
): EntityType {
	if (!entity.inventory[slotIndex]) {
		return entity;
	}

	entity.inventory.splice(slotIndex, 1);
	entity.coins = entity.coins + 1;

	return {
		...entity,
		inventory: arrayWithout(entity.inventory, entity.inventory[slotIndex]),
		coins: entity.coins + 1,
	};
}
