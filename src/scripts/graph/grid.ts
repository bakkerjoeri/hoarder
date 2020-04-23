import { Graph } from './graph.js';
import { Node } from './types.js';
import { repeat } from './../utilities/repeat.js';

export const DIRECTION_NORTH     = [0, -1];
export const DIRECTION_NORTHEAST = [1, -1];
export const DIRECTION_EAST      = [1, 0];
export const DIRECTION_SOUTHEAST = [1, 1];
export const DIRECTION_SOUTH     = [0, 1];
export const DIRECTION_SOUTHWEST = [-1, 1];
export const DIRECTION_WEST      = [-1, 0];
export const DIRECTION_NORTHWEST = [-1, -1];

export const cardinalDirections = [DIRECTION_NORTH, DIRECTION_EAST, DIRECTION_SOUTH, DIRECTION_WEST];
export const principalDirections = [DIRECTION_NORTH, DIRECTION_NORTHEAST, DIRECTION_EAST, DIRECTION_SOUTHEAST, DIRECTION_SOUTH, DIRECTION_SOUTHWEST, DIRECTION_WEST, DIRECTION_NORTHWEST];

export function createGridGraph(width: number, height: number, directions: 'cardinal' | 'principal' = 'cardinal'): Graph {
    const graph = new Graph();
	const nodes: { position: [number, number] }[] = [];

    repeat(width, (x) => {
        repeat(height, (y) => {
            nodes.push({ position: [x, y] });
        });
    });

    const directionsForNeighbours = directions === 'principal' ? principalDirections : cardinalDirections;

    nodes.forEach((node) => {
        directionsForNeighbours.forEach((direction) => {
            const neighbouringNode = findNodeWithPosition(nodes, node.position[0] + direction[0], node.position[1] + direction[1]);

            if (neighbouringNode) {
                graph.addEdge(node, neighbouringNode);
            }
        });
    });

    return graph;
}

export function findNodeWithPosition(nodes: { position: [number, number] }[], x: number, y: number): Node {
    return nodes.find((node) => {
        return node.position && node.position[0] === x && node.position[1] === y;
    });
}
