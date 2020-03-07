import { ItemEntity } from '../ItemEntity';
import { createUuid } from '../../utilities/createUuid';

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


