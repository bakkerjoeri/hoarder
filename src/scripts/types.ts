import { Entity } from './entities.js';
import { Level } from './levels.js';
import { Tile } from './tiles.js';
import { Sprite } from './rendering.js';

export interface Size {
	width: number;
	height: number;
}

export interface Position {
	x: number;
	y: number;
}

export interface GameState {
	scene: {
		current: string;
		next: null | string;
		history: string[];
	};
	entities: {
		[entityId: string]: Entity;
	};
	tiles: {
		[tileId: string]: Tile;
	};
	levels: {
		[levelId: string]: Level;
	};
	currentRun?: {
		levels: Level['id'][];
	};
	currentLevel: null | string;
	sprites: {
		[spriteName: string]: Sprite;
	};
}
