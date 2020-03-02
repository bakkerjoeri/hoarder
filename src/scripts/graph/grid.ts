import { Graph } from './graph.js';
import { Node, GraphSearchResults } from './types.js';
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

    repeat(width, (x) => {
        repeat(height, (y) => {
            graph.addNode({ position: [x, y] });
        });
    });

    let directionsForNeighbours = cardinalDirections;

    if (directions === 'principal') {
        directionsForNeighbours = principalDirections;
    }

    graph.nodes.forEach((node) => {
        directionsForNeighbours.forEach((direction) => {
            const neighbouringNode = findNodeWithPosition(graph, node.position[0] + direction[0], node.position[1] + direction[1]);

            if (neighbouringNode) {
                graph.addEdge(node, neighbouringNode);
            }
        });
    });

    return graph;
}

export function findNodeWithPosition(graph: Graph, x: number, y: number): Node {
    return graph.nodes.find((node) => {
        return node.position && node.position[0] === x && node.position[1] === y;
    });
}

export function renderGrid(graph: Graph, width: number, height: number): string {
    let renderedGraph = '';

    repeat(width, (y) => {
        repeat(height, (x) => {
            const node = findNodeWithPosition(graph, x, y);

            if (node) {
                if (node.hasOwnProperty('weight')) {
                    renderedGraph = `${renderedGraph}${node.weight.toString().padStart(2, ' ')} `
                } else {
                    renderedGraph = `${renderedGraph} . `
                }
            } else {
                renderedGraph = `${renderedGraph} # `
            }
        });

        renderedGraph = `${renderedGraph}\n`;
    });

    return renderedGraph;
}

export function renderGridWithGraphSearchResults(width: number, height: number, graph: Graph, graphSearchResults: GraphSearchResults, path?: Node[]): string {
    let renderedGraph = '';

    repeat(width, (y) => {
        repeat(height, (x) => {
            const node = findNodeWithPosition(graph, x, y);
            const result = graphSearchResults.get(node);

            if (node) {
                if (path && path.includes(node)) {
                    renderedGraph = `${renderedGraph} @ `
                } else if (result && result.distance) {
                    renderedGraph = `${renderedGraph}${result.distance.toString().padStart(2, ' ')} `
                } else {
                    renderedGraph = `${renderedGraph} . `
                }
            } else {
                renderedGraph = `${renderedGraph} # `
            }
        });

        renderedGraph = `${renderedGraph}\n`;
    });

    return renderedGraph;
}
