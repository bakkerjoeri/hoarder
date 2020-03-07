import { ItemEntity } from './entities/ItemEntity.js';
import { choose } from './random/choose.js';
import { arrayWithout } from './utilities/arrayWithout.js';
import { createHornetBoxEntity, useHornetBox } from './entities/items/HornetBox.js';
import { createWitchHatEntity, useWitchHat } from './entities/items/WitchHat.js';
import { createHealingRingEntity, useHealingRing  } from './entities/items/HealingRing.js';
import { ActorEntity } from './entities/ActorEntity.js';
import { GameState } from './types.js';
import { createBlackOpalPendant, useBlackOpalPendant } from './entities/items/BlackOpalPendant.js';
import { createFourSidedDie, useFourSidedDie } from './entities/items/FourSidedDie.js';
import { createScrollOfFire, useScrollOfFire } from './entities/items/ScrollOfFire.js';

export type ItemName = 'witchHat'
	| 'hornetBox'
	| 'healingRing'
	| 'blackOpalPendant'
	| 'fourSidedDie'
	| 'scrollOfFire';

interface CreateItem { (): ItemEntity }
type ItemPool = { [item in ItemName]: CreateItem };

interface UseItem { (state: GameState, user: ActorEntity): boolean }
type ItemEffects = { [item in ItemName]: UseItem };

const itemPool: Partial<ItemPool> = {
	witchHat: createWitchHatEntity,
	hornetBox: createHornetBoxEntity,
	healingRing: createHealingRingEntity,
	blackOpalPendant: createBlackOpalPendant,
	fourSidedDie: createFourSidedDie,
	scrollOfFire: createScrollOfFire,
}

const itemEffects: ItemEffects = {
	witchHat: useWitchHat,
	hornetBox: useHornetBox,
	healingRing: useHealingRing,
	blackOpalPendant: useBlackOpalPendant,
	fourSidedDie: useFourSidedDie,
	scrollOfFire: useScrollOfFire,
}

let availableItems: ItemName[] = [];

export function pullRandomItem(): ItemEntity {
	if (availableItems.length === 0) {
		availableItems = Object.keys(itemPool) as ItemName[];
	}

	const itemName = choose(availableItems);
	const itemCreateFunction = itemPool[itemName];

	availableItems = arrayWithout(availableItems, itemName);

	return itemCreateFunction();
}

export function useItem(state: GameState, item: ItemName, user: ActorEntity): boolean {
	const useItemFunction = itemEffects[item];

	return useItemFunction(state, user);
}
