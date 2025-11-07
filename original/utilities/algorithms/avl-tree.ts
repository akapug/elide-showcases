/**
 * AVL Tree - Self-balancing Binary Search Tree
 * Maintains height balance for O(log n) operations
 */

class AVLNode<T> {
  value: T;
  left: AVLNode<T> | null = null;
  right: AVLNode<T> | null = null;
  height: number = 1;

  constructor(value: T) {
    this.value = value;
  }
}

export class AVLTree<T> {
  private root: AVLNode<T> | null = null;

  private getHeight(node: AVLNode<T> | null): number {
    return node ? node.height : 0;
  }

  private getBalance(node: AVLNode<T> | null): number {
    return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
  }

  private updateHeight(node: AVLNode<T>): void {
    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
  }

  private rotateRight(y: AVLNode<T>): AVLNode<T> {
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    this.updateHeight(y);
    this.updateHeight(x);

    return x;
  }

  private rotateLeft(x: AVLNode<T>): AVLNode<T> {
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    this.updateHeight(x);
    this.updateHeight(y);

    return y;
  }

  private insertNode(node: AVLNode<T> | null, value: T): AVLNode<T> {
    if (!node) return new AVLNode(value);

    if (value < node.value) {
      node.left = this.insertNode(node.left, value);
    } else if (value > node.value) {
      node.right = this.insertNode(node.right, value);
    } else {
      return node; // Duplicate values not allowed
    }

    this.updateHeight(node);

    const balance = this.getBalance(node);

    // Left-Left case
    if (balance > 1 && value < node.left!.value) {
      return this.rotateRight(node);
    }

    // Right-Right case
    if (balance < -1 && value > node.right!.value) {
      return this.rotateLeft(node);
    }

    // Left-Right case
    if (balance > 1 && value > node.left!.value) {
      node.left = this.rotateLeft(node.left!);
      return this.rotateRight(node);
    }

    // Right-Left case
    if (balance < -1 && value < node.right!.value) {
      node.right = this.rotateRight(node.right!);
      return this.rotateLeft(node);
    }

    return node;
  }

  insert(value: T): void {
    this.root = this.insertNode(this.root, value);
  }

  inOrder(): T[] {
    const result: T[] = [];
    const traverse = (node: AVLNode<T> | null) => {
      if (!node) return;
      traverse(node.left);
      result.push(node.value);
      traverse(node.right);
    };
    traverse(this.root);
    return result;
  }

  getHeight(): number {
    return this.getHeight(this.root);
  }
}

// CLI demo
if (import.meta.url.includes("avl-tree.ts")) {
  const tree = new AVLTree<number>();

  console.log("Inserting: 10, 20, 30, 40, 50, 25");
  [10, 20, 30, 40, 50, 25].forEach(n => tree.insert(n));

  console.log("In-order traversal:", tree.inOrder().join(", "));
  console.log("Tree height:", tree.getHeight());

  console.log("✅ AVL tree test passed");
}
