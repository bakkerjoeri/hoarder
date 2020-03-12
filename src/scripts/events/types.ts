import { GameState } from './../types.js';
import { Entity } from './../entities.js';

export interface EventHandlerTypes {
	start: EventHandler<{}>;
	beforeUpdate: EventHandler<BeforeUpdateEvent>;
	update: EventHandler<UpdateEvent>;
	afterUpdate: EventHandler<AfterUpdateEvent>;
	beforeDraw: EventHandler<BeforeDrawEvent>;
	draw: EventHandler<DrawEvent>;
	afterDraw: EventHandler<AfterDrawEvent>;
	startScene: EventHandler<StartSceneEvent>;
	endScene: EventHandler<EndSceneEvent>;
	concludeTurn: EventHandler<ConcludeTurnEvent>;
}

export interface EventHandler<Event = {}> {
	(state: GameState, event: Event): void;
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
