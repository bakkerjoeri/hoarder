import { choose } from './../random/choose.js';
import { Entity } from './../entities.js';
import { createUuid } from './../utilities/createUuid.js';
import { createHealthComponent } from '../components/HealthComponent.js';

export function createGochaponEggEntity(hasItem: string): Entity {
	return {
		id: createUuid(),
		sprite: choose([
			'gochapon-egg-1',
			'gochapon-egg-2',
			'gochapon-egg-3',
			'gochapon-egg-4',
			'gochapon-egg-5',
			'gochapon-egg-6',
		]),
		isSolid: true,
		health: createHealthComponent(1),
		hideHealth: true,
		hasItem: hasItem,
	}
}
