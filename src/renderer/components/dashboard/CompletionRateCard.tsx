import { useState } from 'react';
import { Target } from 'lucide-react';
import type { CompletionRateData } from '../../types';
const periods = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
];
export default function CompletionRateCard({ data }: { data: CompletionRateData }) {
  const [period, setPeriod] = useState('7d');
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Completion rate</h2>
        <Target />
      </div>
      <div className="tabs" aria-label="Completion rate period">
        {periods.map((p) => (
          <button
            key={p.key}
            className={period === p.key ? 'selected' : ''}
            aria-pressed={period === p.key}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="advanced-metric">
        <span className="muted">Overall · {periods.find((p) => p.key === period)?.label}</span>
        <strong>{data.overall[period] || 0}%</strong>
      </div>
      {data.habits.map((h) => (
        <div className="advanced-rate" key={h.habitId}>
          <div>
            <span className="habit-name">{h.habitName}</span>
            <strong>{h.rates[period] || 0}%</strong>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label={`${h.habitName} completion rate`}
            aria-valuenow={h.rates[period] || 0}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <i style={{ width: `${h.rates[period] || 0}%` }} />
          </div>
        </div>
      ))}
    </section>
  );
}
