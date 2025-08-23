import React, { useState } from 'react';

const Main: React.FC = () => {
  const [input, setInput] = useState('');
  const [latest, setLatest] = useState<{ user?: string; assistant?: string }>({});

  const send = () => {
    const text = input.trim();
    if (!text) return;

    // Clear the input immediately
    setInput('');

    // Show latest user msg and a static assistant response
    setLatest({
      user: text,
      assistant: 'This is a static response.',
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  };

  return (
    <main className="min-h-screen p-6">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1>Chat</h1>

        <div style={{ marginTop: 16, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
          {latest.user ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#666' }}>You</div>
                <div>{latest.user}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Assistant</div>
                <div>{latest.assistant}</div>
              </div>
            </>
          ) : (
            <div style={{ color: '#888' }}>No messages yet. Type below to start.</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your message..."
            style={{ flex: 1, padding: '10px 12px', border: '1px solid #ccc', borderRadius: 6 }}
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            style={{
              padding: '10px 16px',
              borderRadius: 6,
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              opacity: input.trim() ? 1 : 0.7,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
};

export default Main;
