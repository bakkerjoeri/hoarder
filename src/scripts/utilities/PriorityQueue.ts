export class PriorityQueue<EntryType extends any> {
    private entries: [EntryType, number][] = [];

    enqueue(item: EntryType, priority: number): void {
        this.entries.push([item, priority]);
        this.entries.sort((a, b) => {
            return a[1] - b[1];
        })
    }

    dequeue(): EntryType | undefined {
        const item = this.entries.shift();

        if (!item) {
            return;
        }

        return item[0];
    }

    get length(): number {
        return this.entries.length;
    }
}
