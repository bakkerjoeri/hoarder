import { Entity } from '../entities.js';
import { createUuid } from '../utilities/createUuid.js';

export interface PileOfCoinsEntity extends Entity {
	isPileOfCoins: true;
	sprite: 'single-coin' | 'two-coins' | 'three-coins' | 'four-coins';
	amount: number;
}

export function createPileOfCoinsEntity(amount: number): PileOfCoinsEntity {
	return {
		id: createUuid(),
		isPileOfCoins: true,
		sprite: getSpriteNameForCoinAmount(amount),
		amount: amount,
	}
}

export function getSpriteNameForCoinAmount(amount: number): PileOfCoinsEntity['sprite'] {
	if (amount === 1) {
		return 'single-coin';
	}

	if (amount === 2) {
		return 'two-coins';
	}

	if (amount === 3) {
		return 'three-coins'
	}

	return 'four-coins';
}
