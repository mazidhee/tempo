import { Link } from 'react-router-dom';
import { ArrowRight, Timer } from 'lucide-react';
import type { DailyThought } from '../../shared/thoughts';
import '../styles/daily-thought.css';
export default function HomeThought({ thought, date, onFocus }: { thought?: DailyThought; date: string; onFocus: () => void }) {
  return <section className="home-reading" aria-label="Daily thought">
    <div className="home-reading-tools"><span>{new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric' })}</span>
      <button className="btn-ghost" onClick={onFocus}><Timer />Start focusing</button></div>
    <div className="home-reading-text">
      <h1>{thought?.text || 'Make room for a thought worth returning to.'}</h1>
      {thought?.author && <p className="home-reading-author">{thought.author}</p>}
      {thought ? <Link className="text-link" to={`/journal?date=${date}&thought=1`}>Reflect on this tonight<ArrowRight /></Link>
        : <Link className="text-link" to="/settings?section=thoughts">Choose your daily thoughts<ArrowRight /></Link>}
    </div>
  </section>;
}
