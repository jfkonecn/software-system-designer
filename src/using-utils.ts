import { useEffect } from "react";

export function useResizeObserver(
  ref: React.RefObject<HTMLElement>,
  onResize: () => void,
) {
  useEffect(() => {
    const observer = new ResizeObserver(onResize);
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [ref, onResize]);
}
