import { forwardRef, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variantClass: Record<Variant, string> = {
  primary: "bg-zinc-700 text-zinc-100 hover:bg-zinc-600",
  secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
  ghost: "bg-transparent text-zinc-200 hover:bg-zinc-800/70",
  danger: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
});
