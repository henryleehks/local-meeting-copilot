import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ variant = "secondary", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
        variant === "primary" && "bg-lime-300 text-black shadow-[0_0_36px_rgba(190,242,100,.22)] hover:bg-lime-200",
        variant === "danger" && "bg-white/10 text-white ring-1 ring-white/12 hover:bg-white/15",
        variant === "ghost" && "bg-transparent text-zinc-300 hover:bg-white/8 hover:text-white",
        variant === "secondary" && "bg-white/8 text-zinc-100 ring-1 ring-white/10 hover:bg-white/12",
        className
      )}
    />
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "live" | "warn" | "neutral" }) {
  return (
    <span
      className={clsx(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1",
        tone === "live" && "bg-lime-300/12 text-lime-200 ring-lime-300/25",
        tone === "warn" && "bg-amber-400/12 text-amber-200 ring-amber-300/25",
        tone === "neutral" && "bg-white/7 text-zinc-300 ring-white/10"
      )}
    >
      {children}
    </span>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={clsx("rounded-2xl border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 backdrop-blur", className)}>{children}</section>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-xs font-bold uppercase tracking-normal text-zinc-500">{children}</p>;
}
