import { useMemo, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Upload } from 'lucide-react';
import { eventMonths, parseSlipCSV, type HabitEvent } from '../../shared/habitEvents';
import { habitDataChanged } from '../hooks/useHabitData';
import '../styles/habit-events.css';
export default function HabitEventHistory({habitId,events}:{habitId:number;events:HabitEvent[]}) {
  const [csv,setCSV]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[limit,setLimit]=useState(10);
  const working=useRef(false);
  const preview=useMemo(()=>{if(!csv.trim())return null;try{return parseSlipCSV(csv);}catch(e){return {error:(e as Error).message};}},[csv]);
  const months=useMemo(()=>eventMonths(events),[events]);
  const ordered=useMemo(()=>[...events].sort((a,b)=>b.occurred_at.localeCompare(a.occurred_at)),[events]);
  const days=new Set(events.map(e=>e.occurred_at.slice(0,10))).size;
  return <section className="habit-event-history">
    <div className="section-heading"><h2>Recorded events</h2>{!!events.length && <span className="muted small">{events.length} entries · {days} days</span>}</div>
    <p className="muted">Imported slip history, with every original timestamp. This record does not mark unlogged days clean or change existing check-ins.</p>
    {!!months.length && <>
      <div className="habit-event-chart" role="img" aria-label={`Recorded events by month: ${months.map(m=>`${m.month}: ${m.count}`).join('; ')}`}>
        <ResponsiveContainer width="100%" height="100%"><LineChart data={months} margin={{top:16,right:16,bottom:0,left:0}}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 6" />
          <XAxis dataKey="month" tick={{fill:'var(--muted)',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>new Date(`${v}-01T12:00:00`).toLocaleDateString(undefined,{month:'short'})} />
          <YAxis allowDecimals={false} width={32} tick={{fill:'var(--muted)',fontSize:11}} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)'}} labelStyle={{color:'var(--text)'}} />
          <Line name="Recorded events" type="linear" dataKey="count" stroke="var(--accent)" strokeWidth={2} dot={{r:3}} isAnimationActive={false} />
        </LineChart></ResponsiveContainer>
      </div>
      <p className="muted small">Counts describe the imported record only; gaps may mean events were not recorded.</p>
      <details className="habit-event-list"><summary>View timestamped history</summary>
        <ol>{ordered.slice(0,limit).map(e=><li key={e.id}><time dateTime={e.occurred_at.replace(' ','T')}>{e.occurred_at}</time>{e.note && <details><summary>View note</summary><p className="habit-name">{e.note}</p></details>}</li>)}</ol>
        {ordered.length>limit && <button className="btn-secondary" onClick={()=>setLimit(v=>v+25)}>Show more</button>}
      </details>
    </>}
    <details className="habit-event-import"><summary><Upload />Import slip history</summary>
      <p className="muted small">Choose or paste a CSV with Category, Event, Occurrence and Note columns. Only Habits / Relapsed rows are imported. Local timestamps and notes are preserved. Reimporting an identical entry will skip it.</p>
      <label>CSV file<input type="file" accept=".csv,text/csv,text/plain" disabled={busy} onChange={async e=>{const file=e.currentTarget.files?.[0];if(!file)return;if(file.size>5_000_000){setError('Choose a CSV smaller than 5 MB.');return;}setCSV(await file.text());setError('');setMessage('');}} /></label>
      <label>CSV contents<textarea className="input habit-name" rows={5} value={csv} disabled={busy} onChange={e=>{setCSV(e.target.value);setMessage('');setError('');}} placeholder="Category,Event,Occurrence,Note" /></label>
      {preview && ('error' in preview ? <p role="alert" className="inline-error">{preview.error}</p> : <p className="muted small">{preview.events.length} selected entries across {preview.days} days · {preview.ignored} unrelated rows skipped</p>)}
      <button className="btn-secondary" disabled={busy || !preview || 'error' in preview || !preview.events.length} onClick={async()=>{
        if(working.current)return;working.current=true;setBusy(true);setError('');
        try {const result=await window.habitAPI.importHabitEvents(habitId,csv);setMessage(`${result.imported} entries imported · ${result.duplicates} already present · ${result.ignored} unrelated rows skipped`);setCSV('');habitDataChanged();}
        catch(e){setError((e as Error).message);}finally{working.current=false;setBusy(false);}
      }}>{busy?'Importing…':'Import into this habit'}</button>
      {error && <p className="inline-error" role="alert">{error}</p>}{message && <p role="status" className="muted">{message}</p>}
    </details>
  </section>;
}
