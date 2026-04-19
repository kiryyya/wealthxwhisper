import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MouseEvent } from "react";

type Props = {
  direction: "left" | "right";
  onClick: () => void;
};

export function CarouselArrow({ direction, onClick }: Props) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white transition hover:bg-black/65 ${
        direction === "left" ? "left-2" : "right-2"
      }`}
    >
      {direction === "left" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  );
}
