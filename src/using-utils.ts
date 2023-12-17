import { useEffect, useRef, useState } from "react";

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
      const maxScale = 5;
      const minScale = 0.5;
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

export type UseTranslatePositionRtn = {
  translateX: number;
  translateY: number;
};
export function useTranslatePosition(
  canvasRef: React.RefObject<HTMLCanvasElement>,
): UseTranslatePositionRtn {
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const mouseDownRef = useRef(false);
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      // middle mouse button
      mouseDownRef.current = e.button === 1;
    };
    const onMouseUp = () => {
      mouseDownRef.current = false;
    };
    canvasRef.current?.addEventListener("mousedown", onMouseDown);
    canvasRef.current?.addEventListener("mouseup", onMouseUp);
    canvasRef.current?.addEventListener("mouseout", onMouseUp);
    canvasRef.current?.addEventListener("mouseover", onMouseUp);

    const onMouseMove = (e: MouseEvent) => {
      if (mouseDownRef.current) {
        setTranslateX((prev) => prev + e.movementX);
        setTranslateY((prev) => prev + e.movementY);
      }
    };
    canvasRef.current?.addEventListener("mousemove", onMouseMove);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      canvasRef.current?.removeEventListener("mousedown", onMouseDown);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      canvasRef.current?.removeEventListener("mouseup", onMouseUp);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      canvasRef.current?.removeEventListener("mouseout", onMouseUp);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      canvasRef.current?.removeEventListener("mouseover", onMouseUp);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      canvasRef.current?.removeEventListener("mousemove", onMouseMove);
    };
  }, [canvasRef]);
  return { translateX, translateY };
}

export function useCursor(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  scale: number,
  {
    translateX,
    translateY,
  }: {
    translateX: number;
    translateY: number;
  },
): { x: number; y: number } {
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { left, top } = canvasRef.current?.getBoundingClientRect() || {
        left: 0,
        top: 0,
      };
      const x = (clientX - left - translateX) / scale;
      const y = (clientY - top - translateY) / scale;
      setCursor({ x, y });
    };
    canvasRef.current?.addEventListener("mousemove", onMouseMove);
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      canvasRef.current?.removeEventListener("mousemove", onMouseMove);
    };
  }, [canvasRef, scale, translateX, translateY]);
  return cursor;
}
