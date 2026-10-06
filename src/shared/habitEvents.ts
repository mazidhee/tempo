import { validDate } from './habits';
export interface HabitEvent { id: number; habit_id: number; occurred_at: string; note: string; source: string; imported_at: string }
export interface ImportedHabitEvent { occurred_at: string; note: string; source: string }
export function validOccurrence(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) && validDate(value.slice(0,10)) &&
    Number(value.slice(11,13)) < 24 && Number(value.slice(14,16)) < 60 && Number(value.slice(17,19)) < 60;
}
/** CSV quoting includes embedded commas, escaped quotes and line breaks. Local wall times stay unchanged. */
export function parseSlipCSV(csv: string) {
  if (typeof csv !== 'string' || csv.length > 5_000_000) throw Error('Choose a CSV smaller than 5 MB.');
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false;
  const input = csv.replace(/^\uFEFF/, '');
  for (let i=0; i<input.length; i++) {
    const c=input[i];
    if (c === '"') { if (quoted && input[i+1] === '"') { field+='"'; i++; } else quoted=!quoted; }
    else if (c === ',' && !quoted) { row.push(field); field=''; }
    else if ((c === '\n' || c === '\r') && !quoted) { if(c==='\r' && input[i+1]==='\n')i++; row.push(field); if(row.some(v=>v.trim()))rows.push(row); row=[];field=''; }
    else field+=c;
  }
  if (quoted) throw Error('The CSV has an unfinished quoted field. Nothing was imported.');
  row.push(field); if(row.some(v=>v.trim())) rows.push(row);
  const header=rows.shift()?.map(v=>v.trim().toLowerCase());
  if (!header || ['category','event','occurrence','note'].some(v=>!header.includes(v))) throw Error('Expected Category, Event, Occurrence and Note columns.');
  const result: ImportedHabitEvent[]=[]; let ignored=0;
  for (const cells of rows) {
    if(cells.length!==header.length)throw Error('A CSV row has the wrong number of columns. Nothing was imported.');
    const get=(name:string)=>cells[header.indexOf(name)];
    if(get('category').trim().toLowerCase() !== 'habits' || get('event').trim().toLowerCase() !== 'relapsed'){ignored++;continue;}
    const occurred_at=get('occurrence').trim(),note=get('note');
    if(!validOccurrence(occurred_at)||note.length>10000)throw Error('A selected event has an invalid timestamp or oversized note. Nothing was imported.');
    result.push({occurred_at,note,source:'csv:habits:relapsed'});
  }
  if(result.length>20000)throw Error('Import at most 20,000 events at a time.');
  return {events:result,ignored,days:new Set(result.map(e=>e.occurred_at.slice(0,10))).size};
}
export function eventMonths(events: Pick<HabitEvent,'occurred_at'>[]) {
  if(!events.length)return [];
  const counts=new Map<string,number>(); for(const e of events){const m=e.occurred_at.slice(0,7);counts.set(m,(counts.get(m)??0)+1);}
  const sorted=[...counts.keys()].sort(); const result:{month:string;count:number}[]=[];
  let month=sorted[0]; while(month<=sorted[sorted.length-1]) {result.push({month,count:counts.get(month)??0});const [y,m]=month.split('-').map(Number);month=m===12?`${y+1}-01`:`${y}-${String(m+1).padStart(2,'0')}`;}
  return result;
}
