import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { heatmapDays, parseDay, shiftDay } from '../../shared/analytics';
import { localDate } from '../../shared/productivity';
import { usePrivacy } from '../hooks/PrivacyContext';
import type { HabitDay } from '../../shared/habits';
const heatmapMetrics = { tooltipWidth: 320, viewportInset: 8, tooltipOffset: 36 };
const emptyValues: Record<string, number> = {};
export default function Heatmap({
  values = emptyValues,
  details,
  unit = 'completions',
  end = localDate(),
  label = 'Habit activity',
  journal = {},
}: {
  values?: Record<string, number>;
  details?: Record<string, HabitDay>;
  unit?: string;
  end?: string;
  label?: string;
  journal?: Record<string, string>;
}) {
  const privacy = usePrivacy();
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scroll.current) scroll.current.scrollLeft = scroll.current.scrollWidth;
  }, [end]);
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [activeDate, setActiveDate] = useState(end);
  const helpId = useId();
  useEffect(() => {
    setActiveDate(end);
    setTip(null);
  }, [end]);
  const { weeks, months, max, total } = useMemo(() => {
    const days = heatmapDays(values, end);
    const pad = parseDay(days[0].date).getDay();
    const cells = [...Array(pad).fill(null), ...days];
    const weeks = Array.from({ length: Math.ceil(cells.length / 7) }, (_, i) =>
      cells.slice(i * 7, i * 7 + 7),
    );
    let previous = '';
    const months = weeks.map((w) => {
      const d = w.find(Boolean);
      const month = d ? parseDay(d.date).toLocaleDateString(undefined, { month: 'short' }) : '';
      const label = month !== previous ? month : '';
      previous = month;
      return label;
    });
    return {
      weeks,
      months,
      max: Math.max(1, ...days.map((d) => d.value)),
      total: days.reduce((s, d) => s + d.value, 0),
    };
  }, [values, end]);
  return (
    <div
      className="heatmap"
      role="group"
      aria-label={`${label}, past 365 days`}
      aria-describedby={helpId}
    >
      <p id={helpId} className="sr-only">
        Use up and down arrows for adjacent days, left and right for weeks, Home for the first day
        and End for the last. Tab leaves the calendar.
      </p>
      <div className="heatmap-scroll" ref={scroll}>
        <div
          className="heatmap-months"
          style={{ gridTemplateColumns: `26px repeat(${weeks.length}, 1fr)` }}
        >
          <span />
          {months.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
        <div className="heatmap-body">
          <div className="heatmap-axis">
            <span />
            <span>Mon</span>
            <span />
            <span>Wed</span>
            <span />
            <span>Fri</span>
            <span />
          </div>
          <div
            className="heatmap-weeks"
            onKeyDown={(e) => {
              const date = (e.target as HTMLElement).dataset.date;
              if (!date) return;
              const offset: Record<string, number> = {
                ArrowUp: -1,
                ArrowDown: 1,
                ArrowLeft: -7,
                ArrowRight: 7,
                PageUp: -28,
                PageDown: 28,
              };
              let next: string;
              if (e.key === 'Home') next = shiftDay(end, -364);
              else if (e.key === 'End') next = end;
              else if (e.key in offset) next = shiftDay(date, offset[e.key]);
              else return;
              e.preventDefault();
              next = next < shiftDay(end, -364) ? shiftDay(end, -364) : next > end ? end : next;
              setActiveDate(next);
              const button = e.currentTarget.querySelector<HTMLButtonElement>(
                `[data-date="${next}"]`,
              );
              button?.focus({ preventScroll: true });
              button?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }}
            style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}
          >
            {weeks.map((week, i) => (
              <div className="heatmap-week" key={i}>
                {week.map((d, j) => {
                  const info = d ? details?.[d.date] : undefined;
                  const level = info
                    ? [0, 1, 2, 4][info.shade]
                    : d?.value
                      ? Math.max(1, Math.ceil((d.value / max) * 4))
                      : 0;
                  const text = d
                    ? info
                      ? `${parseDay(d.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}: ${info.done}/${info.due} done${info.neutral ? ' · not due' : ` · ${info.percent}%`}\n${info.missed.length ? 'Missed: ' + (privacy ? info.missed.length + ' habits' : info.missed.join(', ')) : 'No missed habits'}${info.freezes.length ? '\nFreezes: ' + (privacy ? info.freezes.length + ' habits' : info.freezes.join(', ')) : ''}`
                      : `${parseDay(d.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}: ${Number(d.value.toFixed(1))} ${unit}`
                    : '';
                  const tooltip =
                    text +
                    (d && !privacy && journal[d.date] ? '\nJournal: ' + journal[d.date] : '');
                  return d ? (
                    <button
                      key={d.date}
                      data-date={d.date}
                      tabIndex={d.date === activeDate ? 0 : -1}
                      className={`heat-cell level-${level} ${info?.neutral ? 'neutral' : ''} ${info?.freezes.length ? 'hatched' : ''}`}
                      aria-label={tooltip}
                      onMouseEnter={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setTip({
                          text: tooltip,
                          x: Math.max(
                            heatmapMetrics.viewportInset,
                            Math.min(
                              r.left,
                              window.innerWidth -
                                heatmapMetrics.tooltipWidth -
                                heatmapMetrics.viewportInset,
                            ),
                          ),
                          y: Math.max(
                            heatmapMetrics.viewportInset,
                            r.top - heatmapMetrics.tooltipOffset,
                          ),
                        });
                      }}
                      onMouseLeave={() => setTip(null)}
                      onFocus={(e) => {
                        setActiveDate(d.date);
                        const r = e.currentTarget.getBoundingClientRect();
                        setTip({
                          text: tooltip,
                          x: Math.max(
                            heatmapMetrics.viewportInset,
                            Math.min(
                              r.left,
                              window.innerWidth -
                                heatmapMetrics.tooltipWidth -
                                heatmapMetrics.viewportInset,
                            ),
                          ),
                          y: Math.max(
                            heatmapMetrics.viewportInset,
                            r.top - heatmapMetrics.tooltipOffset,
                          ),
                        });
                      }}
                      onBlur={() => setTip(null)}
                    />
                  ) : (
                    <span key={j} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="heatmap-footer">
        <span>
          {details
            ? Object.values(details).reduce((n, d) => n + d.done, 0)
            : Number(total.toFixed(1)).toLocaleString()}{' '}
          {unit} in the past year
        </span>
        <div className="heat-legend">
          <span>{details ? '0%' : 'Less'}</span>
          {(details ? [0, 1, 2, 4] : [0, 1, 2, 3, 4]).map((n) => (
            <i key={n} className={`heat-cell level-${n}`} />
          ))}
          <span>{details ? '100%' : 'More'}</span>
          {details && (
            <>
              <i className="heat-cell hatched" />
              <span>Freeze</span>
            </>
          )}
        </div>
      </div>
      {tip && (
        <div role="tooltip" className="heat-tooltip" style={{ left: tip.x, top: tip.y }}>
          {tip.text.split('\n').map((line, i) => (
            <span key={i} className={i ? 'habit-name' : ''}>
              {line}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
