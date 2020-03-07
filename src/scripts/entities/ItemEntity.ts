import { Entity } from '../entities.js';
import { ItemName } from './../items.js';

export interface ItemEntity extends Entity {
	isItem: true;
	sprite: string;
	name: ItemName;
	title: string;
	effectDescription: string;
	cost: number;
}
