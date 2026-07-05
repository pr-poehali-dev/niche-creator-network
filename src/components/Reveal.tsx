import { type ReactNode } from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Задержка появления в миллисекундах (для каскадного эффекта). */
  delay?: number;
  as?: "div" | "section";
}

/**
 * Обёртка плавного появления при прокрутке.
 * Использование: <Reveal><YourContent /></Reveal>
 */
export function Reveal({ children, className = "", delay = 0, as = "div" }: RevealProps) {
  const ref = useScrollReveal<HTMLDivElement>();
  const style = delay ? { transitionDelay: `${delay}ms` } : undefined;
  const Tag = as;
  return (
    <Tag ref={ref as never} className={`reveal ${className}`} style={style}>
      {children}
    </Tag>
  );
}

export default Reveal;
