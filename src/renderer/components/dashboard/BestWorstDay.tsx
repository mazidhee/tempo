import { CalendarDays } from 'lucide-react';
import type { BestWorstDayData } from '../../types';
export default function BestWorstDay({ data }: { data: BestWorstDayData }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Best and worst day</h2>
        <CalendarDays />
      </div>
      {!data.best && !data.worst ? (
        <p className="muted">Not enough data yet.</p>
      ) : (
        <>
          <dl className="advanced-day-summary">
            {[
              { label: 'Highest completion', day: data.best },
              { label: 'Lowest completion', day: data.worst },
            ].map(
              ({ label, day }) =>
                day && (
                  <div key={label}>
                    <dt className="muted">{label}</dt>
                    <dd>
                      {day.day_name}
                      <small className="muted">
                        {Math.round(day.avg_rate * 100)}% average completion
                      </small>
                    </dd>
                  </div>
                ),
            )}
          </dl>
          {data.all.map((day) => (
            <div className="advanced-day-rate" key={day.day_num}>
              <span>{day.day_name}</span>
              <div
                className="progress-track"
                role="progressbar"
                aria-label={`${day.day_name} average completion`}
                aria-valuenow={Math.round(day.avg_rate * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <i style={{ width: `${Math.round(day.avg_rate * 100)}%` }} />
              </div>
              <strong>{Math.round(day.avg_rate * 100)}%</strong>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
