import { Graph } from './graph.js';
import { Node } from './types.js';

export function floodFill(graph: Graph, start: Node): Node[] {
    if (!graph.hasNode(start)) {
        throw new Error('Starting node was not found.');
    }

    const frontier: Node[] = [start];
    const visited: Node[] = [start];

    while(frontier.length) {
        const currentNode = frontier.shift();
        const neighbours = graph.findNeighbours(currentNode);

        neighbours.forEach((neighbour) => {
            if (!visited.includes(neighbour)) {
                frontier.push(neighbour);
                visited.push(neighbour);
            }
        });
    }

    return visited;
}
