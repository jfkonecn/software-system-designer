import { useEffect, useRef, useState } from "react";
import Canvas from "./canvas/Canvas";
import Toolbar from "./toolbar/Toolbar";
import { DrawMode, Grid } from "./types";

function App() {
  const appRef = useRef<HTMLDivElement>(null);
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
  const [grid, setGrid] = useState<Grid>({
    rectangles: [
      {
        x: 50,
        y: 500,
        width: 100,
        height: 100,
      },
    ],
    gridSquareSize: 25,
  });

  const [drawMode, setDrawMode] = useState<DrawMode>("addRectangle");
  return (
    <div ref={appRef} className="h-screen w-screen fixed left-0 top-0">
      <div className="h-full w-full grid grid-cols-1 md:grid-cols-[auto,1fr]">
        <Toolbar drawMode={drawMode} onDrawModeChange={setDrawMode} />
        <Canvas grid={grid} onGridChange={setGrid} drawMode={drawMode} />
      </div>
    </div>
  );
}

export default App;
