import clsx from "clsx";

type Props = {
  total: number;
  current: number;
};

export function CarouselIndicators({ total, current }: Props) {
  if (total <= 1) return null;

  return (
    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-2 py-1">
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={clsx(
            "h-1.5 w-1.5 rounded-full transition",
            current === index ? "bg-white" : "bg-white/40",
          )}
        />
      ))}
    </div>
  );
}
