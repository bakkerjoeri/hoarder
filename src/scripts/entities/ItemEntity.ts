import { Entity } from '../entities.js';

export interface ItemEntity extends Entity {
	isItem: true;
	sprite: string;
	name: string;
	effectDescription: string;
	cost: number;
	effect: string;
}
