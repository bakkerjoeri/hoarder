import { ActorEntity } from './ActorEntity.js';

export interface NonPlayerEntity extends ActorEntity {
	isNonPlayer: true;
	inventory: string[];
}
