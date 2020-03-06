import { GameState, Position } from './types.js';
import { Entity, getEntity } from './entities.js';
import { createUuid } from './utilities/createUuid.js';
import { arrayWithout } from './utilities/arrayWithout.js';

export interface Tile {
	id: string;
    position: Position;
    entities: string[];
}

export function createTile(state: GameState, position: Position): Tile {
    const tile = {
		id: createUuid(),
        position,
        entities: [],
	};

	state.tiles = {
        ...state.tiles,
        [tile.id]: tile,
	};

	return tile;
}

export function getTile(state: GameState, tileId: string): Tile {
	if (!state.tiles.hasOwnProperty(tileId)) {
        throw new Error(`Tile with ID ${tileId} doesn't exist.`);
	}

	return state.tiles[tileId];
}

export function addEntityToTile(entity: Entity, tile: Tile): void {
	tile.entities = [
		...tile.entities,
		entity.id,
	];
}

export function removeEntityFromTile(entity: Entity, tile: Tile): void {
	tile.entities = arrayWithout(tile.entities, entity.id);
}

export function getEntitiesOnTile(state: GameState, tile: Tile, entitiesToExclude: Entity[] = []): Entity[] {
	const entities =  tile.entities.map((entityId: string) => getEntity(state, entityId));

	if (!entitiesToExclude.length) {
		return entities;
	}

	return entities.filter(entity => !entitiesToExclude.includes(entity))
}
