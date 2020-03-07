import { Entity } from './../entities.js';
import { createUuid } from './../utilities/createUuid.js';

export function createGochaponMachineEntity(): Entity {
	return {
		id: createUuid(),
		isGochaponMachine: true,
		sprite: 'gochapon-machine',
		isSolid: true,
		cost: 2,
	}
}
