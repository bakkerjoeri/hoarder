import { ItemEntity } from '../ItemEntity.js';
import { createUuid } from '../../utilities/createUuid.js';
import { GameState } from '../../types.js';
import { repeat } from '../../utilities/repeat.js';
import { addEntity } from '../../entities.js';
import { pullRandomItem } from '../../items.js';

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

export function useFourSidedDie(state: GameState): boolean {
	const amountOfItemsToReroll = state.inventory.length;

	repeat(amountOfItemsToReroll, (slotIndex) => {
		const newItem = addEntity(state, pullRandomItem());
		state.inventory[slotIndex] = newItem.id;
	});

	return true;
}
