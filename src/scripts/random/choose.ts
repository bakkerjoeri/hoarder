import { getRandomNumberInRange } from './getRandomNumberInRange.js';

export function choose<TypeOfItem>(choices: TypeOfItem[]): TypeOfItem {
	if (choices.length === 0) {
		throw new Error('Cannot choose from 0 choices.');
	}

	return choices[getRandomNumberInRange(0, choices.length - 1)];
}
