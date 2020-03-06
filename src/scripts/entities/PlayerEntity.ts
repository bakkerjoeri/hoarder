import { ActorEntity } from './ActorEntity.js';

export interface PlayerEntity extends ActorEntity {
	isPlayer: true;
	inventory: string[];
}

