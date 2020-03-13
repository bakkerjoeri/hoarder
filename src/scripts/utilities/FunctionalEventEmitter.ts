import { arrayWithout } from './arrayWithout.js';
import { objectWithout } from './objectWithout.js';

interface EventHandler<State, Event> {
    (state: State, event: Event): State;
}

export class FunctionalEventEmitter<Events> {
	private eventHandlers: any = {};

    public on<EventType extends keyof Events, State>(
        eventType: EventType,
        handler: EventHandler<State, Events[EventType]>
    ): void {
        this.eventHandlers = {
            ...this.eventHandlers,
            [eventType]: [
                ...this.eventHandlers[eventType] || [],
                handler,
            ]
        }
	}

	public remove<EventType extends keyof Events, State>(
		eventType: EventType,
		handler: EventHandler<State, Events[EventType]>
	): void {
		this.eventHandlers = {
			...this.eventHandlers,
			[eventType]: arrayWithout(this.eventHandlers[eventType], handler),
		};
	}

	public removeEventType<EventType extends keyof Events>(eventType: EventType): void {
		this.eventHandlers = objectWithout(this.eventHandlers, eventType);
	}

    public emit<EventType extends keyof Events, State>(
		eventType: EventType,
		initialState: State,
        event: Events[EventType],
    ): State {
        if (!this.eventHandlers.hasOwnProperty(eventType)) {
            return initialState;
        }

		const handlers = this.eventHandlers[eventType] as EventHandler<State, Events[EventType]>[];

		return handlers.reduce((newState: State, currentHandler) => {
			return currentHandler(newState, event);
		}, initialState);
	}
}
