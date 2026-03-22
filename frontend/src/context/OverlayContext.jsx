import { createContext, useState, useEffect } from 'react';

export const OverlayContext = createContext({
  isOverlayEnabled: false,
  setIsOverlayEnabled: () => {},
});

export function OverlayProvider({ children }) {
  const [isOverlayEnabled, setIsOverlayEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return JSON.parse(localStorage.getItem('lt_backgroundOverlay') || 'false');
  });

  useEffect(() => {
    localStorage.setItem('lt_backgroundOverlay', JSON.stringify(isOverlayEnabled));
  }, [isOverlayEnabled]);

  return (
    <OverlayContext.Provider value={{ isOverlayEnabled, setIsOverlayEnabled }}>
      {children}
    </OverlayContext.Provider>
  );
}
