import { GameState, Position } from './types.js';
import { generateLevel, doesPositionExistInLevel, getLevel, findTileInLevel } from './levels.js';
import { draw, addSprite } from './rendering.js';
import { Entity, findEntitiesWithComponent, moveEntityToPosition } from './entities.js';
import { eventBus } from './utilities/EventBus.js';
import { setupGame } from './utilities/setupGame.js';
import { start } from './utilities/tick.js';
import { getEntitiesOnTile } from './tiles.js';

const GAME_WIDTH = 320;
const GAME_HEIGHT = 320;

const { context } = setupGame('body', {width: GAME_WIDTH, height: GAME_HEIGHT}, 1);

// eventBus.on('update', update);
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

const level = generateLevel(state, { width: 7, height: 7 });
state.currentLevel = level.id;

console.log(state);

start((time: number) => {
    eventBus.emit('update', time);
    eventBus.emit('draw', state, time, context);
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
			// performContextSensitiveAction(state, playerEntity);
		}
    });
});

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
    }

    eventBus.emit('concludeTurn', entity);
}
