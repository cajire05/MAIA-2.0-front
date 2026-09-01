import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatProvider, useChat } from '../ChatContext';

function Probe() {
  const { isOpen, openChat, closeChat } = useChat();
  return (
    <div>
      <span data-testid="open-state">{isOpen ? 'open' : 'closed'}</span>
      <button type="button" onClick={openChat}>open</button>
      <button type="button" onClick={closeChat}>close</button>
    </div>
  );
}

describe('ChatContext', () => {
  it('opens and closes chat panel state', async () => {
    const user = userEvent.setup();
    render(
      <ChatProvider>
        <Probe />
      </ChatProvider>,
    );

    expect(screen.getByTestId('open-state')).toHaveTextContent('closed');
    await user.click(screen.getByText('open'));
    expect(screen.getByTestId('open-state')).toHaveTextContent('open');
    await user.click(screen.getByText('close'));
    expect(screen.getByTestId('open-state')).toHaveTextContent('closed');
  });

  it('throws when useChat is used outside provider', () => {
    const Broken = () => {
      useChat();
      return null;
    };
    expect(() => render(<Broken />)).toThrow(/ChatProvider/);
  });
});
