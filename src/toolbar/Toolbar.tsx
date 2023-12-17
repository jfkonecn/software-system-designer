import { DrawMode } from "../types";

type ToolbarProps = {
  drawMode: DrawMode;
  onDrawModeChange: (drawMode: DrawMode) => void;
  snapToGrid: boolean;
  onSnapToGridChange: (snapToGrid: boolean) => void;
};
export default function Toolbar({
  drawMode: { typename: drawModeTypename },
  onDrawModeChange,
  snapToGrid,
  onSnapToGridChange,
}: ToolbarProps) {
  return (
    <div className="w-screen md:w-44 h-16 md:h-auto bg-yellow-300">
      <nav>
        <section className="w-full h-full flex flex-row md:flex-col">
          <button
            className={`${
              drawModeTypename === "select" ? "bg-blue-300" : "bg-white"
            }`}
            onClick={() => onDrawModeChange({ typename: "select" })}
          >
            Select
          </button>
          <button
            className={`${
              drawModeTypename === "addRectangle" ? "bg-blue-300" : "bg-white"
            }`}
            onClick={() => onDrawModeChange({ typename: "addRectangle" })}
          >
            Add Rectangle
          </button>
        </section>
        <section className="w-full h-full flex flex-row md:flex-col">
          <button
            onClick={() => onSnapToGridChange(!snapToGrid)}
            className={`${snapToGrid ? "bg-green-300" : "bg-white"}`}
          >
            Snap to Grid
          </button>
        </section>
      </nav>
    </div>
  );
}
