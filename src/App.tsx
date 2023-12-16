import Canvas from "./canvas/Canvas";
import Toolbar from "./toolbar/Toolbar";

function App() {
  return (
    <div className="h-screen w-screen fixed left-0 top-0">
      <div className="h-full w-full grid grid-cols-1 md:grid-cols-[auto,1fr]">
        <Toolbar />
        <Canvas />
      </div>
    </div>
  );
}

export default App;
