import { render, screen } from '@testing-library/react';
import { Input } from '../src/components/inputs/Input';

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    input.setAttribute('value', 'test');
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows invalid state', () => {
    render(<Input isInvalid />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });
});
