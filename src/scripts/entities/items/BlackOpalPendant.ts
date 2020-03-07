import { ItemEntity } from '../ItemEntity.js';
import { createUuid } from '../../utilities/createUuid.js';
import { GameState } from '../../types.js';
import { ActorEntity } from '../ActorEntity.js';
import { getLevel, getTilesInLevelWithoutEntities } from '../../levels.js';
import { choose } from '../../random/choose.js';
import { moveEntityToPosition } from '../../entities.js';

export function createBlackOpalPendant(): ItemEntity {
	return {
		id: createUuid(),
		isItem: true,
		sprite: 'black-opal-pendant',
		name: 'blackOpalPendant',
		title: 'black opal pendant',
		effectDescription: 'teleport!',
		cost: 1,
	};
}

export function useBlackOpalPendant(state: GameState, user: ActorEntity): boolean {
	const levelOfEntity = getLevel(state, user.currentLevel);
	const freeTiles = getTilesInLevelWithoutEntities(state, levelOfEntity);

	if (!freeTiles.length) {
		return false;
	}

	moveEntityToPosition(state, user, choose(freeTiles).position);
	return true;
}
