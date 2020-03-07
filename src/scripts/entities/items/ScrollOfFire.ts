import { ItemEntity } from '../ItemEntity.js';
import { createUuid } from '../../utilities/createUuid.js';
import { GameState } from '../../types.js';
import { ActorEntity } from '../ActorEntity.js';

export function createScrollOfFire(): ItemEntity {
	return {
		id: createUuid(),
		isItem: true,
		sprite: 'firescroll',
		name: 'scrollOfFire',
		title: 'scroll of fire',
		effectDescription: 'Launch a fireball',
		cost: 1,
	};
}

export function useScrollOfFire(state: GameState, user: ActorEntity): boolean {
	return true;
}
