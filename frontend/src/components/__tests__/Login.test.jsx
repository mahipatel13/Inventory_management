import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../Login';

describe('Login component', () => {
  it('validates empty fields', async () => {
    const onLogin = jest.fn(() => Promise.resolve());
    render(<Login onLogin={onLogin} />);

    fireEvent.click(screen.getByText(/login/i));
    expect(await screen.findByRole('alert')).toHaveTextContent('Username and password are required.');
  });
});