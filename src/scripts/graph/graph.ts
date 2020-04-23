import { Node, Edge } from './types.js';

export class Graph {
    edges: Edge[] = [];

    findNeighbours(node: Node): Node[] {
        return this.findEdgesFromNode(node).map((edge) => {
            return edge.to;
        });
	}

	hasNode(node: Node): boolean {
		return this.edges.some(edge => {
			return edge.to === node || edge.from === node;
		});
	}

    removeNode(nodeToRemove: Node): void {
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
