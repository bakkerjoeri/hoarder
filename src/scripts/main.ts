import { GameState, Position } from './types.js';
import { generateLevel, doesPositionExistInLevel, getLevel, findTileInLevel, getEntitiesInLevel, addEntityToLevel, Level } from './levels.js';
import { draw, addSprite, GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from './rendering.js';
import { Entity, findEntitiesWithComponent, moveEntityToPosition, createEntity, removeEntityFromLevel, findEntities, findEntity, moveEntityToLevel } from './entities.js';
import { eventBus } from './utilities/EventBus.js';
import { setupGame } from './utilities/setupGame.js';
import { start } from './utilities/tick.js';
import { getEntitiesOnTile } from './tiles.js';

const { context } = setupGame('body', {width: GAME_WIDTH, height: GAME_HEIGHT}, 1);

eventBus.on('update', update);
eventBus.on('draw', draw);
eventBus.on('actInDirection', actInDirection);

const state: GameState = {
	currentLevel: null,
    entities: {},
	tiles: {},
	levels: {},
	sprites: {},
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
		player: true,
		sprite: 'hoarder',
		isSolid: true,
		health: {
			max: 3,
			current: 3,
		},
	}), levelOne, entranceTile.position);
}

console.log(state);

start((time: number) => {
    eventBus.emit('update', time, state);
    eventBus.emit('draw', time, state, context);
});

window.addEventListener('keyup', (event: KeyboardEvent) => {
    const playerEntities = findEntitiesWithComponent(state, 'player');

    playerEntities.forEach((playerEntity: Entity) => {
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

		if (event.key.toLowerCase() === '[') {
			showPreviousLevel();
		}

		if (event.key.toLowerCase() === ']') {
			showNextLevel();
		}
    });
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
        eventBus.emit('doDamage', state, entity, attackableEntity);
    } else {
		moveEntityToPosition(state, entity, nextPosition);
		entity.drawOffset = {
			x: -1 * dx * TILE_SIZE,
			y: -1 * dy * TILE_SIZE,
		}
    }

    eventBus.emit('concludeTurn', entity);
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
		eventBus.emit('concludeTurn', entity);
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
