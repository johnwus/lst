import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Minimal thread panel state persisted across the expand navigation.
 * Does NOT store localMessages — TanStack cache is the message store.
 *
 * @typedef {Object} ThreadPanelState
 * @property {string|null} threadId
 * @property {Object|null} replyTo
 * @property {number} scrollTop
 */

const INITIAL_STATE = { threadId: null, replyTo: null, scrollTop: 0 };

const ThreadContext = createContext({
  panelState: INITIAL_STATE,
  setPanelState: () => {},
  clearPanelState: () => {},
});

export function ThreadProvider({ children }) {
  const [panelState, setPanelStateRaw] = useState(INITIAL_STATE);

  const setPanelState = useCallback((next) => {
    setPanelStateRaw((prev) => ({ ...prev, ...next }));
  }, []);

  const clearPanelState = useCallback(() => {
    setPanelStateRaw(INITIAL_STATE);
  }, []);

  return (
    <ThreadContext.Provider value={{ panelState, setPanelState, clearPanelState }}>
      {children}
    </ThreadContext.Provider>
  );
}

export function useThreadContext() {
  const ctx = useContext(ThreadContext);
  if (!ctx) throw new Error('useThreadContext must be used within ThreadProvider');
  return ctx;
}
