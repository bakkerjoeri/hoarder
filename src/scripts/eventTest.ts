import { FunctionalEventEmitter } from './utilities/FunctionalEventEmitter.js';

interface State {
	x: number;
	y: number;
}

let state: State = {
	x: 0,
	y: 0,
};

const eventEmitter = new FunctionalEventEmitter<{
	update: { time: number };
	draw: { time: number };
}>()

eventEmitter.on('update', (state: State): State => {
	return {
		x: state.x + 1,
		y: state.y,
	};
});

eventEmitter.on('draw', (state: State): State => {
	return state;
});

state = eventEmitter.emit('update', state, { time: 0 });

console.log(state);
