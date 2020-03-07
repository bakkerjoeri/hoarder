import { ActorEntity } from './../ActorEntity.js';
import { createUuid } from './../../utilities/createUuid.js';
import { createHealthComponent } from './../../components/HealthComponent.js';

export interface PlayerEntity extends ActorEntity {
	isPlayer: true;
	isEnemy: false;
	inventory: string[];
}

export function createPlayerEntity(): PlayerEntity {
	return {
		id: createUuid(),
		sprite: 'hoarder',
		isActor: true,
		isPlayer: true,
		isEnemy: false,
		isSolid: true,
		actionCost: 100,
		health: createHealthComponent(5),
		inventory: [],
		coins: 99,
	}
}
