import Heatmap from '../Heatmap';
import type { HeatmapData } from '../../types';
import type { HabitDay } from '../../../shared/habits';
export default function HeatmapCalendar({ data }: { data: HeatmapData }) {
  const details = Object.fromEntries(
    data.days.map((day) => [day.log_date, day as unknown as HabitDay]),
  );
  return (
    <div className="panel">
      <div className="section-heading">
        <h2>Activity heatmap</h2>
      </div>
      <Heatmap details={details} />
    </div>
  );
}
