import { Graph } from './../graph.js';
import { Node, GraphSearchResults, GraphSearchResult } from './../types.js';

export function breadthFirstSearch(graph: Graph, start: Node, goal: Node | ((node: Node) => boolean)): GraphSearchResults {
    if (!graph.nodes.includes(start)) {
        throw new Error('Starting node was not found in graph.');
    }

    const frontier: Node[] = [start];
    const results: GraphSearchResults = new Map();

    results.set(start, {
        distance: 0,
        parent: undefined,
    });

    while(frontier.length) {
        const currentNode = frontier.shift();

        if (
			(typeof goal === 'function' && goal(currentNode)) ||
			(currentNode === goal)
		) {
            break;
        }

        const neighbours = graph.findNeighbours(currentNode);
        const newDistance = (results.get(currentNode) as GraphSearchResult).distance + 1;

        neighbours.forEach((neighbour) => {
            if (!results.has(neighbour)) {
                frontier.push(neighbour);
                results.set(neighbour, {
                    distance: newDistance,
                    parent: currentNode
                });
            }
        });
    }

    return results;
}
