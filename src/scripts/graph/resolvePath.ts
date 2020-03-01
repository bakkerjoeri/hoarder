import { GraphSearchResults, Node } from './types.js';

export function resolvePath(start: Node, goal: Node, graphSearchResults: GraphSearchResults): Node[] {
    const path: Node[] = [];
    let currentNode: Node = goal;

    while (currentNode !== start) {
        path.unshift(currentNode);
        const currentSearchResult = graphSearchResults.get(currentNode);

        if (!currentSearchResult) {
            throw new Error('Couldn\'t resolve path because of a missing graph search result for node.');
        }

        currentNode = currentSearchResult.parent;
    }

    return path;
}
