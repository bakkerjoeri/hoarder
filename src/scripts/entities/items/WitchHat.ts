import { ItemEntity } from '../ItemEntity.js';
import { createUuid } from '../../utilities/createUuid.js';

export function createWitchHatEntity(): ItemEntity {
	return {
		id: createUuid(),
		isItem: true,
		sprite: 'witchhat',
		name: 'witch\'s hat',
		effectDescription: 'summon a frog buddy',
		cost: 2,
		effect: 'summonFrog',
	};
}


