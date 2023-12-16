import { useEffect, useRef } from "react";
import Canvas from "./canvas/Canvas";
import Toolbar from "./toolbar/Toolbar";

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
  return (
    <div ref={appRef} className="h-screen w-screen fixed left-0 top-0">
      <div className="h-full w-full grid grid-cols-1 md:grid-cols-[auto,1fr]">
        <Toolbar />
        <Canvas />
      </div>
    </div>
  );
}

export default App;
