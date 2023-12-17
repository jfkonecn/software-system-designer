import { useEffect, useRef, useState } from "react";
import Canvas from "./canvas/Canvas";
import Toolbar from "./toolbar/Toolbar";
import { DrawMode, Grid } from "./types";

function App() {
  const appRef = useRef<HTMLDivElement>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>("select");
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  useEffect(() => {
    const handleKeyDown = (e: WheelEvent) => {
      e.preventDefault();
    };
    appRef.current?.addEventListener("wheel", handleKeyDown);
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      appRef.current?.removeEventListener("wheel", handleKeyDown);
    };
  }, []);
  const [gridState, setGridState] = useState<{ grid: Grid }>({
    grid: {
      rectangles: [
        {
          x: 50,
          y: 500,
          width: 100,
          height: 100,
        },
      ],
      gridSquareSize: 25,
    },
  });

  return (
    <div ref={appRef} className="h-screen w-screen fixed left-0 top-0">
      <div className="h-full w-full grid grid-cols-1 md:grid-cols-[auto,1fr]">
        <Toolbar
          snapToGrid={snapToGrid}
          onSnapToGridChange={setSnapToGrid}
          drawMode={drawMode}
          onDrawModeChange={setDrawMode}
        />
        <Canvas
          snapToGrid={snapToGrid}
          grid={gridState.grid}
          onGridChange={(x) => setGridState({ grid: x })}
          drawMode={drawMode}
        />
      </div>
    </div>
  );
}

export default App;
