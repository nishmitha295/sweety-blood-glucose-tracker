import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReadingForm from '../components/ReadingForm.jsx';

describe('ReadingForm validation', () => {
  it('shows error when value is empty', async () => {
    render(<ReadingForm date="2026-10-15" onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByTestId('slot-select'), { target: { value: 'After lunch' } });
    fireEvent.click(screen.getByText('Add'));
    expect(await screen.findByText('Please enter a glucose value.')).toBeTruthy();
  });

  it('shows error for out-of-range value', async () => {
    render(<ReadingForm date="2026-10-15" onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByTestId('slot-select'), { target: { value: 'After lunch' } });
    fireEvent.change(screen.getByTestId('value-input'), { target: { value: '700' } });
    fireEvent.click(screen.getByText('Add'));
    expect(await screen.findByText('Value must be between 40 and 600 mg/dl.')).toBeTruthy();
  });

  it('submits valid reading', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<ReadingForm date="2026-10-15" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByTestId('slot-select'), { target: { value: 'After lunch' } });
    fireEvent.change(screen.getByTestId('value-input'), { target: { value: '120' } });
    fireEvent.click(screen.getByText('Add'));
    expect(onSubmit).toHaveBeenCalledWith({ date: '2026-10-15', slot: 'After lunch', value: 120 });
  });
});
