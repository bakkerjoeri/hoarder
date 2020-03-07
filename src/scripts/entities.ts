import { GameState, Position } from './types.js';
import { createUuid } from './utilities/createUuid.js';
import { findTileInLevel, getLevel, addEntityToLevel, Level } from './levels.js';
import { addEntityToTile, removeEntityFromTile } from './tiles.js';

export type Component = any;

export interface Entity {
    id: string;
    [componentName: string]: Component;
}

export interface ComponentFilterMap {
	[componentName: string]: ComponentFilter;
}

export type ComponentFilter = boolean | any | {
	(value: any): boolean;
};

export function addEntity(state: GameState, components: any): Entity {
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

export function findEntities(entities: Entity[], filters: ComponentFilterMap): Entity[] {
	return entities.filter(entity => {
		return doesEntityValueMatch(entity, filters);
	});
}

export function findEntity(entities: Entity[], filters: ComponentFilterMap): Entity | undefined {
	return entities.find(entity => {
		return doesEntityValueMatch(entity, filters);
	});
}

export function doesEntityValueMatch(entity: Entity, filters: ComponentFilterMap): boolean {
	return Object.entries(filters).every(([componentName, filterValue]) => {
		if (typeof filterValue === 'function' && entity.hasOwnProperty(componentName)) {
			return filterValue(entity[componentName]);
		}

		if (typeof filterValue === 'boolean' && !filterValue) {
			return !entity.hasOwnProperty(componentName) || !entity[componentName];
		}

		if (typeof filterValue === 'boolean' && filterValue) {
			return entity.hasOwnProperty(componentName) && !!entity[componentName];
		}

		return entity.hasOwnProperty(componentName) && filterValue === entity[componentName];
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

export function moveEntityToLevel(state: GameState, entity: Entity, level: Level, position: Position): void {
	if (entity.currentLevel) {
		removeEntityFromLevel(state, entity);
	}

	addEntityToLevel(state, entity, level, position);
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
