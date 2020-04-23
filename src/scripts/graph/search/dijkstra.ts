import { Graph } from './../graph.js';
import { Node, GraphSearchResults } from './../types.js';
import { PriorityQueue } from './../../utilities/PriorityQueue.js';

export function dijkstra(graph: Graph, startNodes: Node[], goal?: Node): GraphSearchResults;
export function dijkstra(graph: Graph, startNode: Node, goal?: Node): GraphSearchResults;

export function dijkstra(graph: Graph, startNodeOrNodes: Node | Node[], goal?: Node): GraphSearchResults {
    const frontier = new PriorityQueue<Node>();
    const results = new Map();

    if (!Array.isArray(startNodeOrNodes)) {
        startNodeOrNodes = [ startNodeOrNodes ];
    }

    startNodeOrNodes.forEach((startNode: Node) => {
        if (!graph.hasNode(startNode)) {
            throw new Error('Starting node was not found in graph.');
        }

        frontier.enqueue(startNode, 0);
        results.set(startNode, {
            distance: 0,
            parent: undefined,
        });
    })

    while (frontier.length) {
        const currentNode = frontier.dequeue();

        if (currentNode === goal) {
            break;
        }

        const currentDistance = results.get(currentNode).distance;
        const edgesOfCurrentNode = graph.findEdgesFromNode(currentNode);
        edgesOfCurrentNode.forEach((edge) => {
            const newDistance = currentDistance + edge.weight;

            if (!results.has(edge.to) || newDistance < results.get(edge.to).distance) {
                frontier.enqueue(edge.to, newDistance);
                results.set(edge.to, {
                    distance: newDistance,
                    parent: currentNode,
                });
            }
        });
    }

    return results;
}
