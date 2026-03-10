import { useEffect, useState } from "react";

/**
 * Delays showing a loading state to avoid skeleton flashes on fast loads.
 * Returns true only if `isLoading` has been true for longer than `delay` ms.
 */
export function useDeferredLoading(isLoading: boolean, delay = 300): boolean {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
      return;
    }

    const timer = setTimeout(() => setShowLoading(true), delay);
    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  return showLoading;
}
