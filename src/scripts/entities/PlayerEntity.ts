import { Entity } from '../entities';
import { PositionComponent } from '../components/PositionComponent';
import { HealthComponnent } from '../components/HealthComponent';

export interface PlayerEntity extends ActorEntity {
	isPlayer: true;
	inventory: string[];
}

export interface ActorEntity extends Entity {
	isActor: true;
	isSolid: boolean;
	health: HealthComponnent;
	sprite?: string;
	position?: PositionComponent;
}
