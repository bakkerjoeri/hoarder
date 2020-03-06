import { Position } from '../types';

export function addPositions(...positions: Position[]): Position {
	return positions.reduce((finalPosition, currentPosition) => {
		return {
			x: finalPosition.x + currentPosition.x,
			y: finalPosition.y + currentPosition.y,
		}
	}, {x: 0, y: 0});
}
