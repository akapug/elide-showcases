import React from 'react';
import { Button, IconButton, ButtonGroup, ToggleButton, FloatingActionButton } from '../src';

export function ButtonExamples() {
  return (
    <div className="space-y-6 p-6">
      <section>
        <h2 className="text-2xl font-bold mb-4">Button Variants</h2>
        <div className="flex gap-2">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Button Sizes</h2>
        <div className="flex items-center gap-2">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Button States</h2>
        <div className="flex gap-2">
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button isActive>Active</Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Icon Buttons</h2>
        <div className="flex gap-2">
          <IconButton icon={<span>+</span>} aria-label="Add" />
          <IconButton icon={<span>✓</span>} aria-label="Check" variant="success" />
          <IconButton icon={<span>×</span>} aria-label="Close" variant="danger" />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Button Group</h2>
        <ButtonGroup isAttached>
          <Button>Left</Button>
          <Button>Middle</Button>
          <Button>Right</Button>
        </ButtonGroup>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Toggle Button</h2>
        <ToggleButton>Toggle Me</ToggleButton>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Floating Action Button</h2>
        <FloatingActionButton leftIcon={<span>+</span>} extended>
          Create New
        </FloatingActionButton>
      </section>
    </div>
  );
}
