import { createHealthComponent } from '../../components/HealthComponent.js';
import { createUuid } from '../../utilities/createUuid.js';
import { ActorEntity } from '../ActorEntity.js';

export function createHornetEntity(isEnemy = true): ActorEntity {
	return {
		id: createUuid(),
		sprite: 'hornet',
		isActor: true,
		isNonPlayer: true,
		isEnemy: isEnemy,
		isSolid: true,
		health: createHealthComponent(1),
		actionCost: 100,
		coins: 1,
	}
}
