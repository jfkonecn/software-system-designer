import { useEffect, useRef, useState } from "react";
import Canvas from "./canvas/Canvas";
import Toolbar from "./toolbar/Toolbar";
import { DrawMode, Grid } from "./types";

function App() {
  const appRef = useRef<HTMLDivElement>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>({
    typename: "select",
    phase: { typename: "idle" },
  });
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
      nodes: [
        {
          x: 50,
          y: 500,
          radius: 100,
          uuid: crypto.randomUUID(),
        },
      ],
      gridSquareSize: 25,
      edges: [],
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
          onDrawModeChange={setDrawMode}
        />
      </div>
    </div>
  );
}

export default App;
