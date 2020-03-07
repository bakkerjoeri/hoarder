import { ItemEntity } from '../ItemEntity.js';
import { createUuid } from '../../utilities/createUuid.js';
import { GameState } from '../../types.js';
import { ActorEntity } from '../ActorEntity.js';
import { getLevel, getTilesInLevelWithoutEntities, addEntityToLevel } from '../../levels.js';
import { choose } from '../../random/choose.js';
import { addEntity } from '../../entities.js';
import { createFrogEntity } from '../actors/Frog.js';

export function createWitchHatEntity(): ItemEntity {
	return {
		id: createUuid(),
		isItem: true,
		sprite: 'witchhat',
		name: 'witchHat',
		title: 'witch\'s hat',
		effectDescription: 'summon a frog buddy',
		cost: 2,
		effect: 'summonFrog',
	};
}

export function useWitchHat(state: GameState, user: ActorEntity): boolean {
	const levelOfEntity = getLevel(state, user.currentLevel);
	const freeTiles = getTilesInLevelWithoutEntities(state, getLevel(state, user.currentLevel));

	if (!freeTiles.length) {
		return false;
	}

	const tileForFrog = choose(freeTiles);
	addEntityToLevel(state, addEntity(state, createFrogEntity(false)), levelOfEntity, tileForFrog.position);

	return true;
}
