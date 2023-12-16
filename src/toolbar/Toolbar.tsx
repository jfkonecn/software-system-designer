import { DrawMode } from "../types";

type ToolbarProps = {
  drawMode: DrawMode;
  onDrawModeChange: (drawMode: DrawMode) => void;
};
export default function Toolbar({ drawMode, onDrawModeChange }: ToolbarProps) {
  return (
    <div className="w-screen md:w-44 h-16 md:h-auto bg-green-300">
      <nav className="w-full h-full flex flex-row md:flex-col">
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
    </div>
  );
}
