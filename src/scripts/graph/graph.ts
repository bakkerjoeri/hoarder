import { Node, Edge } from './types.js';

export class Graph {
    nodes: Node[] = [];
    edges: Edge[] = [];

    addNode(node: Node): void {
        this.nodes = [
            ...this.nodes,
            node,
        ];
    }

    findNeighbours(node: Node): Node[] {
        return this.findEdgesFromNode(node).map((edge) => {
            return edge.to;
        });
    }

    removeNode(nodeToRemove: Node): void {
        this.nodes = this.nodes.filter((node) => {
            return node !== nodeToRemove;
        });

        this.edges = this.edges.filter((edge) => {
            return edge.from !== nodeToRemove && edge.to !== nodeToRemove;
        });
    }

    addEdge(from: Node, to: Node, weight = 1, data?: Edge['data']): void {
        this.edges = [
            ...this.edges,
            { from, to, weight, data }
        ];
    }

    removeEdge(from: Node, to: Node): void {
        const edgeToRemove = this.findEdge(from, to);

        this.edges = this.edges.filter((edge) => {
            return edge !== edgeToRemove;
        });
    }

    findEdge(from: Node, to: Node): Edge | undefined {
        return this.edges.find((edge) => {
            return edge.from === from && edge.to === to;
        });
    }

    findEdgesFromNode(node: Node): Edge[] {
        return this.edges.filter((edge) => {
            return edge.from === node;
        });
    }

    findEdgesToNode(node: Node): Edge[] {
        return this.edges.filter((edge) => {
            return edge.to === node;
        });
    }
}
