export type Node = any;

export interface Edge {
    from: Node;
    to: Node;
    weight: number;
    data?: any;
}

export interface GraphSearchResult {
    distance: number;
    parent: Node;
}

export type GraphSearchResults = Map<Node, GraphSearchResult>
