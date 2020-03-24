import { ItemEntity } from '../ItemEntity.js';
import { createUuid } from './../../utilities/createUuid.js';
import { GameState } from '../../types.js';
import { ActorEntity } from '../ActorEntity.js';
import { getLevel, getTilesInLevelWithoutEntities, addEntityToLevel } from '../../levels.js';
import { choose } from '../../random/choose.js';
import { addEntity } from '../../entities.js';
import { createHornetEntity } from '../actors/Hornet.js';

export function createHornetBoxEntity(): ItemEntity {
	return {
		id: createUuid(),
		isItem: true,
		sprite: 'hornet-box',
		name: 'hornetBox',
		title: 'box with an H on it',
		effectDescription: 'summon a hornet',
		cost: 1,
		effect: 'summonHornet',
	};
}

export function useHornetBox(state: GameState, user: ActorEntity): GameState {
	const levelOfEntity = getLevel(state, user.currentLevel);
	const freeTiles = getTilesInLevelWithoutEntities(state, getLevel(state, user.currentLevel));

	if (!freeTiles.length) {
		return state;
	}

	const tileForHornet = choose(freeTiles);
	addEntityToLevel(state, addEntity(state, createHornetEntity(false)), levelOfEntity, tileForHornet.position);

	state = {
		...state,
		entities: {
			...state.entities,
			[user.id]: {
				...state.entities[user.id],
				coins: state.entities[user.id].coins - 1,
			},
		},
	};

	return state;
}
