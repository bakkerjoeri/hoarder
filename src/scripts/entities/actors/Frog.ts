import { createHealthComponent } from '../../components/HealthComponent.js';
import { createUuid } from '../../utilities/createUuid.js';
import { ActorEntity } from '../ActorEntity.js';

export function createFrogEntity(isEnemy = true): ActorEntity {
	return {
		id: createUuid(),
		sprite: 'frog',
		isActor: true,
		isNonPlayer: true,
		isEnemy: isEnemy,
		isSolid: true,
		health: createHealthComponent(3),
		actionCost: 100,
		coins: 3,
	};
}
