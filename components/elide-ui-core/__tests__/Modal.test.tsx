import { render, screen } from '@testing-library/react';
import { Modal, ModalHeader, ModalBody } from '../src/components/overlay/Modal';

describe('Modal', () => {
  it('renders when open', () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <ModalHeader>Title</ModalHeader>
        <ModalBody>Content</ModalBody>
      </Modal>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <ModalHeader>Title</ModalHeader>
      </Modal>
    );
    expect(screen.queryByText('Title')).not.toBeInTheDocument();
  });
});
