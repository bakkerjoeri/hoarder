import { Node, GraphSearchResults } from './types.js';
import { Graph } from './graph.js';

export function rollDownhill(graph: Graph, graphSearchResults: GraphSearchResults, start: Node, maximumLength = Infinity): Node[] {
    const path: Node[] = [start];
    let currentNode: Node = start;

    while(path.length < maximumLength) {
        const currentResult = graphSearchResults.get(currentNode);

        if (!currentResult) {
            throw new Error('Couldn\'t roll downhill because of a missing graph search result for node.');
        }

        const neighbours = graph.findNeighbours(currentNode);
        const nextNode = neighbours.find((neighbouringNode) => {
            const neighbourNodeResult = graphSearchResults.get(neighbouringNode);

            if (!neighbourNodeResult) {
                return false;
            }

            return neighbourNodeResult.distance < currentResult.distance;
        });

        if (!nextNode) {
            break;
        }

        path.push(nextNode);
        currentNode = nextNode;
    }

    return path;
}
