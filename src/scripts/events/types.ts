import { GameState } from './../types.js';
import { Entity } from './../entities.js';

export interface EventHandlerTypes {
	start: {};
	beforeUpdate: BeforeUpdateEvent;
	update: UpdateEvent;
	afterUpdate: AfterUpdateEvent;
	beforeDraw: BeforeDrawEvent;
	draw: DrawEvent;
	afterDraw: AfterDrawEvent;
	startScene: StartSceneEvent;
	endScene: EndSceneEvent;
	concludeTurn: ConcludeTurnEvent;
}

export interface EventHandler<Event = {}> {
	(state: GameState, event: Event): GameState;
}

export interface BeforeUpdateEvent {
	time: number;
}

export interface UpdateEvent {
	time: number;
}

export interface AfterUpdateEvent {
	time: number;
}

export interface DrawEvent {
	time: number;
	context: CanvasRenderingContext2D;
}

export interface BeforeDrawEvent {
	time: number;
}

export interface AfterDrawEvent {
	time: number;
}

export interface StartSceneEvent {
	sceneName: string;
}

export interface EndSceneEvent {
	sceneName: string;
}

export interface ConcludeTurnEvent {
	entity: Entity;
	energy: number;
}
