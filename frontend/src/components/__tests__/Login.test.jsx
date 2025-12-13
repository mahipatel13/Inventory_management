import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';

describe('Login component', () => {
  it('validates empty fields', async () => {
    const onLogin = jest.fn(() => Promise.resolve());
    render(
      <MemoryRouter>
        <Login onLogin={onLogin} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/login/i));
    expect(await screen.findByRole('alert')).toHaveTextContent('Username and password are required.');
  });
});