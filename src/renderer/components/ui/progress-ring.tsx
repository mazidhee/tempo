import { motion, useReducedMotion } from 'motion/react';
export function ProgressRing({
  value,
  label,
  children,
}: {
  value: number;
  label: string;
  children?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const ratio = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-ring" role="img" aria-label={label}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ring-track" cx="50" cy="50" r="44" />
        <motion.circle
          className="ring-value"
          cx="50"
          cy="50"
          r="44"
          pathLength="100"
          initial={false}
          animate={{ strokeDasharray: `${ratio} 100` }}
          transition={{ duration: reduced ? 0 : 0.16 }}
        />
      </svg>
      {children && <div className="ring-content">{children}</div>}
    </div>
  );
}
