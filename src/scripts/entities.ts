import { GameState, Position } from './types.js';
import { createUuid } from './utilities/createUuid.js';
import { findTileInLevel, getLevel } from './levels.js';
import { addEntityToTile, removeEntityFromTile } from './tiles.js';

export interface Entity {
    id: string;
    [componentName: string]: any;
}

export function createEntity(state: GameState, components: any): Entity {
    const entity = {
        id: components.id || createUuid(),
        ...components,
	};

	state.entities = {
        ...state.entities,
        [entity.id]: entity,
	};

	return entity;
}

export function getEntity(state: GameState, entityId: string): Entity {
    if (!state.entities.hasOwnProperty(entityId)) {
        throw new Error(`Entity with id ${entityId} doesn't exist.`);
    }

    return state.entities[entityId];
}

export function getEntities(state: GameState): Entity[] {
    return Object.values(state.entities).reduce((entities: Entity[], entity: Entity): Entity[] => {
        return [
            ...entities,
            entity,
        ]
    }, []);
}

export function findEntitiesWithComponent(state: GameState, componentName: string, value?: any): Entity[] {
    return getEntities(state).filter((entity: Entity) => {
        if (value) {
            return entity[componentName] === value;
        }

        return !!entity[componentName];
    });
}

export function moveEntityToPosition(state: GameState, entity: Entity, position: Position): void {
	if (!entity.currentLevel) {
		throw new Error(`Cannot move entity ${entity.id} because it doesn't exist in any level.`);
	}

	const currentLevel = getLevel(state, entity.currentLevel);

    if (entity.position) {
        const currentTile = findTileInLevel(state, currentLevel, entity.position);
        removeEntityFromTile(entity, currentTile);
    }

	const nextTile = findTileInLevel(state, currentLevel, position);
	addEntityToTile(entity, nextTile);
    entity.position = position;
}

export function removeEntityFromLevel(state: GameState, entity: Entity): void {
    if (entity.position && entity.currentLevel) {
		const currentLevel = getLevel(state, entity.currentLevel);
		const currentTile = findTileInLevel(state, currentLevel, entity.position);

		removeEntityFromTile(entity, currentTile);

		delete entity.currentLevel;
		delete entity.position;
    }
}
