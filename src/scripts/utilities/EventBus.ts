type EventHandler = (...args: any[]) => void;

export class EventBus {
    private eventHandlers: {
        [eventType: string]: EventHandler[];
    } = {};

    on(eventType: string, handler: EventHandler): void {
        this.eventHandlers = {
            ...this.eventHandlers,
            [eventType]: [
                ...this.eventHandlers.eventType || [],
                handler,
            ],
        };
    }

    emit(eventType: string, ...args: any[]): void {
        if (!this.eventHandlers.hasOwnProperty(eventType)) {
            return;
        }

        this.eventHandlers[eventType].forEach((eventHandler): void => {
            eventHandler(...args);
        });
    }
}

export const eventBus = new EventBus();
