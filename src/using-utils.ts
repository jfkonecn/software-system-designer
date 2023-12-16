import { useEffect, useState } from "react";

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

export function useScale(
  canvasRef: React.RefObject<HTMLCanvasElement>,
): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleKeyDown = (e: WheelEvent) => {
      const scaleMultiplier = 0.8;
      const maxScale = 3;
      const minScale = 0.8;
      if (e.ctrlKey) {
        if (e.deltaY > 0) {
          setScale((prev) => {
            const next = prev * scaleMultiplier;
            return next >= minScale ? next : prev;
          });
        } else {
          setScale((prev) => {
            const next = prev / scaleMultiplier;
            return next <= maxScale ? next : prev;
          });
        }
      }
    };
    canvasRef.current?.addEventListener("wheel", handleKeyDown);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      canvasRef.current?.removeEventListener("wheel", handleKeyDown);
    };
  }, [canvasRef]);
  return scale;
}
