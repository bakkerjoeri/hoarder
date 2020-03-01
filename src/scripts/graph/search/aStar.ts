import { Graph } from '../graph.js';
import { Node, GraphSearchResults, GraphSearchResult } from '../types.js';
import { PriorityQueue } from '../../utilities/PriorityQueue.js';

interface AStarHeuristic {
    (current: Node, goal: Node): number;
}

export function aStar(graph: Graph, start: Node, goal: Node, heuristic: AStarHeuristic): GraphSearchResults {
    const frontier = new PriorityQueue<Node>();
    const results: GraphSearchResults = new Map();

    frontier.enqueue(start, 0);
    results.set(start, { distance: 0, parent: undefined });

    while (frontier.length) {
        const currentNode = frontier.dequeue();

        if (currentNode === goal) {
            break;
        }

        const currentDistance = (results.get(currentNode) as GraphSearchResult).distance;
        const edgesOfCurrentNode = graph.findEdgesFromNode(currentNode);
        edgesOfCurrentNode.forEach((edge) => {
            const newDistance = currentDistance + edge.weight;

            if (
                !results.has(edge.to) ||
                newDistance < (results.get(edge.to) as GraphSearchResult).distance
            ) {
                const priority = newDistance + (1.1 * heuristic(edge.to, goal));
                frontier.enqueue(edge.to, priority);
                results.set(edge.to, {
                    distance: newDistance,
                    parent: currentNode,
                });
            }
        });
    }

    return results;
}
