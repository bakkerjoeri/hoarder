import { ItemEntity } from '../ItemEntity.js';
import { createUuid } from '../../utilities/createUuid.js';
import { GameState } from '../../types.js';
import { repeat } from '../../utilities/repeat.js';
import { addEntity } from '../../entities.js';
import { pullRandomItem } from '../../items.js';
import { ActorEntity } from '../ActorEntity.js';

export function createFourSidedDie(): ItemEntity {
	return {
		id: createUuid(),
		isItem: true,
		sprite: 'd4',
		name: 'fourSidedDie',
		title: 'four-sided die',
		effectDescription: 'reroll your items',
		cost: 1,
	}
}

export function useFourSidedDie(state: GameState, user: ActorEntity): boolean {
	if (!user.inventory) {
		return false;
	}

	const amountOfItemsToReroll = user.inventory.length;

	repeat(amountOfItemsToReroll, (slotIndex) => {
		const newItem = addEntity(state, pullRandomItem());
		user.inventory[slotIndex] = newItem.id;
	});

	return true;
}
