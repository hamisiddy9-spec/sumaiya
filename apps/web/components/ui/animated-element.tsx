import { animationClasses } from "@/lib/motion";

type AnimationType = keyof typeof animationClasses;

interface AnimatedElementProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: "fast" | "normal" | "slow";
  className?: string;
}

const durationMap = {
  fast: "duration-150",
  normal: "duration-200",
  slow: "duration-300",
};

export function AnimatedElement({
  children,
  animation = "fadeIn",
  delay = 0,
  duration = "normal",
  className = "",
}: AnimatedElementProps) {
  const animationClass = animationClasses[animation];
  const delayClass = delay > 0 ? `delay-[${delay}ms]` : "";
  const durationClass = durationMap[duration];

  return (
    <div className={`${animationClass} ${durationClass} ${delayClass} ${className}`}>
      {children}
    </div>
  );
}
