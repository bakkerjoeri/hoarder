import { Entity } from '../entities.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { HealthComponnent } from '../components/HealthComponent.js';

export interface ActorEntity extends Entity {
	isActor: true;
	isSolid: boolean;
	health: HealthComponnent;
	coins: number;
	actionCost: number;
	sprite?: string;
	position?: PositionComponent;
}
