import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Tracks the previous internal route in sessionStorage.
 * This allows "smart" back buttons to know if they should return to 
 * /notifications, /explore, etc., without query parameters.
 */
export function useNavigationHistory() {
  const [location] = useLocation();

  useEffect(() => {
    // Before updating current path, store it as previous
    const current = sessionStorage.getItem('currentPath');
    if (current && current !== location) {
      sessionStorage.setItem('prevPath', current);
    }
    sessionStorage.setItem('currentPath', location);
  }, [location]);
}

/**
 * Returns the best "Back" destination based on history.
 * @param {string} defaultFallback - Where to go if no history exists
 * @returns {string}
 */
export function getBackDestination(defaultFallback = '/') {
  const prevPath = sessionStorage.getItem('prevPath');
  
  // High priority destinations
  if (prevPath === '/notifications') return '/notifications';
  if (prevPath === '/explore') return '/explore';
  if (prevPath === '/threads') return '/threads';
  
  return defaultFallback;
}
