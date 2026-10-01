import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';
export function CountUp({
  value,
  format = (v: number) => Math.round(v).toLocaleString(),
}: {
  value: number;
  format?: (value: number) => string;
}) {
  const [shown, setShown] = useState(value);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    const animation = animate(shown, value, { duration: 0.16, onUpdate: setShown });
    return () => animation.stop();
  }, [value, reduced]);
  return <span className="tabular-nums">{format(shown)}</span>;
}
