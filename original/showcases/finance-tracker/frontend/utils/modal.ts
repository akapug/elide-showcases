/**
 * Modal Utility
 *
 * Simple modal dialog helper
 */

export class Modal {
  private modalElement: HTMLElement;
  private modalBody: HTMLElement;

  constructor() {
    this.modalElement = document.getElementById('modal')!;
    this.modalBody = document.getElementById('modal-body')!;

    // Close on backdrop click
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.hide();
      }
    });

    // Close button
    const closeBtn = this.modalElement.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.hide();
      }
    });
  }

  show(content: string): void {
    this.modalBody.innerHTML = content;
    this.modalElement.classList.add('active');
  }

  hide(): void {
    this.modalElement.classList.remove('active');
    this.modalBody.innerHTML = '';
  }

  isVisible(): boolean {
    return this.modalElement.classList.contains('active');
  }
}
