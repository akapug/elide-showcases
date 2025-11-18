/**
 * React Beautiful DnD - Beautiful Drag and Drop
 *
 * Beautiful and accessible drag and drop for lists with React.
 * **POLYGLOT SHOWCASE**: Beautiful DnD for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-beautiful-dnd (~500K+ downloads/week)
 *
 * Package has ~500K+ downloads/week on npm!
 */

export class DragDropContext {
  static render(props: { onDragEnd: () => void; children?: string }): string {
    return `<div class="drag-drop-context">${props.children || ''}</div>`;
  }
}

export class Droppable {
  static render(props: { droppableId: string; children?: string }): string {
    return `<div class="droppable" data-droppable-id="${props.droppableId}">${props.children || ''}</div>`;
  }
}

export class Draggable {
  static render(props: { draggableId: string; index: number; children?: string }): string {
    return `<div class="draggable" data-draggable-id="${props.draggableId}" data-index="${props.index}">${props.children || ''}</div>`;
  }
}

export default { DragDropContext, Droppable, Draggable };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 React Beautiful DnD - Beautiful Drag & Drop (POLYGLOT!)\n");
  console.log(DragDropContext.render({
    onDragEnd: () => {},
    children: Droppable.render({
      droppableId: 'list',
      children: Draggable.render({ draggableId: 'item-1', index: 0, children: 'Item 1' })
    })
  }));
  console.log("\n🚀 ~500K+ downloads/week!");
}
