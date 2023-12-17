import { DrawMode } from "../types";

type ToolbarProps = {
  drawMode: DrawMode;
  onDrawModeChange: (drawMode: DrawMode) => void;
  snapToGrid: boolean;
  onSnapToGridChange: (snapToGrid: boolean) => void;
};
export default function Toolbar({
  drawMode,
  onDrawModeChange,
  snapToGrid,
  onSnapToGridChange,
}: ToolbarProps) {
  return (
    <div className="w-screen md:w-44 h-16 md:h-auto bg-yellow-300">
      <div>
        <nav className="w-full h-full flex flex-row md:flex-col">
          <button
            className={`${drawMode === "select" ? "bg-blue-300" : "bg-white"}`}
            onClick={() => onDrawModeChange("select")}
          >
            Select
          </button>
          <button
            className={`${
              drawMode === "addRectangle" ? "bg-blue-300" : "bg-white"
            }`}
            onClick={() => onDrawModeChange("addRectangle")}
          >
            Add Rectangle
          </button>
          <button
            className={`${drawMode === "erase" ? "bg-blue-300" : "bg-white"}`}
            onClick={() => onDrawModeChange("erase")}
          >
            Erase
          </button>
        </nav>
        <nav className="w-full h-full flex flex-row md:flex-col">
          <button
            onClick={() => onSnapToGridChange(!snapToGrid)}
            className={`${snapToGrid ? "bg-green-300" : "bg-white"}`}
          >
            Snap to Grid
          </button>
        </nav>
      </div>
    </div>
  );
}
