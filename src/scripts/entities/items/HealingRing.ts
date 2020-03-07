import { ItemEntity } from '../ItemEntity.js';
import { createUuid } from './../../utilities/createUuid.js';
import { GameState } from '../../types.js';
import { ActorEntity } from '../ActorEntity.js';

export function createHealingRingEntity(): ItemEntity {
	return {
		id: createUuid(),
		isItem: true,
		sprite: 'green-ring',
		name: 'healingRing',
		title: 'emerald ring',
		effectDescription: '+1 health',
		cost: 1,
	};
}

export function useHealingRing(state: GameState, user: ActorEntity): boolean {
	if (user.health.current === user.health.max) {
		return false;
	}

	user.health.current = Math.min(user.health.current + 1, user.health.max);
	return true;
}
