import { ItemEntity } from '../ItemEntity';
import { createUuid } from '../../utilities/createUuid';

export function createHornetBoxEntity(): ItemEntity {
	return {
		id: createUuid(),
		isItem: true,
		sprite: 'hornet-box',
		name: 'box with an H on it',
		effectDescription: 'summon a hornet',
		cost: 1,
		effect: 'summonHornet',
	};
}


