class TreeNode<T> {
  constructor(public value: T, public left: TreeNode<T> | null = null, public right: TreeNode<T> | null = null) {}
}
export class BinaryTree<T> {
  constructor(public root: TreeNode<T> | null = null) {}
  inorder(): T[] {
    const result: T[] = [];
    const traverse = (node: TreeNode<T> | null) => {
      if (!node) return;
      traverse(node.left);
      result.push(node.value);
      traverse(node.right);
    };
    traverse(this.root);
    return result;
  }
}
if (import.meta.url.includes("binary-tree")) {
  const tree = new BinaryTree(new TreeNode(1, new TreeNode(2), new TreeNode(3)));
  console.log("✅", tree.inorder());
}
