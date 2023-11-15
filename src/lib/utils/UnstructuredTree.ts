export class Node<T> {

    data: T;
    forward: Node<T>;
    backward: Node<T>;

    constructor(data: T) {
        this.data = data;
        this.forward = this.backward = null;
    }
}

export class Tree<T> {
    root: Node<T>

    constructor(root: T) {
        this.root = new Node(root);
    }

    longestPath (root: Node<T>): Array<Node<T>> {
        if (root == null) {
            const output = [];
            return output;
        }
    
        const forward = this.longestPath(root.forward);
    
        const backward = this.longestPath(root.backward);
    
        if (forward.length < backward.length) {
            backward.push(root);
        }
        else {
            forward.push(root);
        }
    
        return (backward.length >
            forward.length ? backward : forward);
    }
}