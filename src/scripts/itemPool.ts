import { ItemEntity } from './entities/ItemEntity.js';
import { choose } from './random/choose.js';
import { createHornetBoxEntity } from './entities/items/HornetBox.js';
import { createWitchHatEntity } from './entities/items/WitchHat.js';
import { arrayWithout } from './utilities/arrayWithout.js';

type ItemKey = 'witchhat' | 'hornetbox';
type ItemPool = {
	[itemKey in ItemKey]: () => ItemEntity;
};

const itemPool: ItemPool = {
	witchhat: createWitchHatEntity,
	hornetbox: createHornetBoxEntity,
}

let availableItems: ItemKey[] = [];

export function pullRandomItem(): ItemEntity {
	if (availableItems.length === 0) {
		availableItems = Object.keys(itemPool) as ItemKey[];
	}

	const itemName = choose(availableItems);
	const itemCreateFunction = itemPool[itemName];

	availableItems = arrayWithout(availableItems, itemName);

	return itemCreateFunction();
}
