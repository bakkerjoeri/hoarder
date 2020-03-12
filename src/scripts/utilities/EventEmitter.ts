import { arrayWithout } from './arrayWithout.js';
import { objectWithout } from './objectWithout.js';

type EventHandlerArguments<Event> =
	[Event] extends [(...args: infer U) => any] ? U :
	[Event] extends [void] ? [] :
    [Event];

type EventHandlerReturnType<Event> =
    Event extends (...args: any) => infer R ? R :
    Event;

interface EventHandler<Events, EventType extends keyof Events> {
    (...args: EventHandlerArguments<Events[EventType]>): EventHandlerReturnType<Events[EventType]>;
}

export class EventEmitter<Events> {
	private eventHandlers: any = {};

    public on<EventType extends keyof Events>(
        eventType: EventType,
        handler: EventHandler<Events, EventType>
    ): void {
        this.eventHandlers = {
            ...this.eventHandlers,
            [eventType]: [
                ...this.eventHandlers[eventType] || [],
                handler,
            ]
        }
	}

	public remove<EventType extends keyof Events>(
		eventType: EventType,
		handler: EventHandler<Events, EventType>
	): void {
		this.eventHandlers = {
			...this.eventHandlers,
			[eventType]: arrayWithout(this.eventHandlers[eventType], handler),
		};
	}

	public removeEventType<EventType extends keyof Events>(eventType: EventType): void {
		this.eventHandlers = objectWithout(this.eventHandlers, eventType);
	}

    public emit<EventType extends keyof Events>(
        eventType: EventType,
        ...args: EventHandlerArguments<Events[EventType]>
    ): void {
        if (!this.eventHandlers.hasOwnProperty(eventType)) {
            return;
        }

        const handlers = this.eventHandlers[eventType] as EventHandler<Events, EventType>[];
        handlers.forEach((handler) => {
            handler(...args);
        });
	}
}
