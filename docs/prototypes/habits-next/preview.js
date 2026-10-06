const $ = (s) => document.querySelector(s);
const flame = '<svg viewBox="0 0 28 36" fill="none" aria-hidden="true"><path d="M15 2c2 8-3 9-1 15 2-1 4-4 5-7 5 6 7 11 5 17-2 5-6 7-10 7S4 32 3 27c-2-7 2-11 5-15 0 5 1 7 3 8-2-8 0-13 4-18Z" fill="currentColor"/><path d="M14 23c-3 3-4 5-2 7 2 2 5 0 5-2s-1-4-3-5Z" fill="var(--bg)"/></svg>';
const marks = [
  '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M49 18a23 23 0 1 0 5 24" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><path d="M22 34l8 8 20-22" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M12 16h40M32 16v34" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><path d="M15 48h7M42 48h7" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>',
  '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 7 55 32 32 57 9 32Z" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><path d="m23 35 7 7 13-20" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
];
$('#brand-mark').innerHTML = marks[0];
const habits = [
 {name:'Read for 25 minutes',meta:'Evening · Non-negotiable',streak:12,done:false,type:'check'},
 {name:'Drink enough water',meta:'Anytime · 2,000 ml target',streak:8,done:false,type:'quantity',quantity:1250},
 {name:'Keep a clear mind',meta:'Anytime · Avoid',streak:0,done:false,type:'avoid',slip:true},
 {name:'Move for 20 minutes',meta:'Afternoon · 3 times a week',streak:4,unit:'weeks',done:true,type:'check'},
 {name:'Practise one problem',meta:'Morning · Selected weekdays',streak:6,done:true,type:'check'},
];
let layout='a';
let focused=0;
const escape = s => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notify(s){$('#status').textContent=s;$('#status').style.display='block';clearTimeout(window.noticeTimer);window.noticeTimer=setTimeout(()=>$('#status').style.display='none',4500)}
function dots(h){return `<div class="week-dots" aria-label="Recent due occurrences">${Array.from({length:7},(_,i)=>`<span class="dot ${i<5||h.done?'filled':''}"></span>`).join('')}</div>`}
function streak(h){return `<div class="streak">${flame}<div>${h.streak}<small>${h.unit||'occurrences'}</small></div></div>`}
function actions(h,i){return `<div class="actions">${h.type==='quantity'?`<button data-water="${i}">+250 ml</button><button data-water="${i}" data-amount="500">+500 ml</button>`:h.slip?`<button data-note="${i}">View slip note</button>`:`<button data-focus="${i}">Start focus</button>`}<button data-more="${i}" aria-label="More options for ${escape(h.name)}">•••</button></div>`}
function row(h,i){return `<article class="habit-row"><button class="check ${h.done?'done':''}" data-check="${i}" aria-label="${h.done?'Undo':'Complete'} ${escape(h.name)}">${h.done?'✓':''}</button><div><div class="name">${escape(h.name)}</div><div class="meta">${h.type==='quantity'?h.quantity+' / 2,000 ml':h.slip?'Slip logged · note kept private':escape(h.meta)}</div>${dots(h)}</div>${streak(h)}${actions(h,i)}<p class="note" data-note-body="${i}" hidden>I noticed a distraction today. I’ll make a small adjustment to my environment tomorrow. Long notes belong here, below the title and controls, instead of squeezing the habit name.</p></article>`}
function render(){
 const count=habits.filter(h=>h.done).length;
 const summary=`<div class="summary"><strong>${count} of ${habits.length} complete</strong><span>One check-in at a time</span><progress max="${habits.length}" value="${count}"></progress></div>`;
 $('#layout-description').textContent={a:'The fastest check-in: one calm list, visible streaks and a clear primary action. Notes and recovery stay out of the way.',b:'The week shows your pattern; today shows your next action. One calendar view, with check-ins beside it.',c:'One habit gets your full attention. A larger streak and the next action lead, with the rest of your day underneath.'}[layout];
 if(layout==='a')$('#habit-content').innerHTML=summary+'<h2 class="period">Still to do</h2>'+habits.map((h,i)=>!h.done?row(h,i):'').join('')+'<h2 class="period">Completed</h2>'+habits.map((h,i)=>h.done?row(h,i):'').join('');
 if(layout==='b')$('#habit-content').innerHTML=summary+`<div class="week-layout"><div><h2>This week</h2><table class="week-table"><thead><tr><th>Habit</th>${['M','T','W','T','F','S','S'].map(d=>'<th>'+d+'</th>').join('')}</tr></thead><tbody>${habits.map(h=>`<tr><td>${escape(h.name)}</td>${Array.from({length:7},(_,i)=>`<td><span class="week-cell ${i<2||i===4?'filled':''}"></span></td>`).join('')}</tr>`).join('')}</tbody></table></div><div><h2>Today</h2>${habits.map(row).join('')}</div></div>`;
 if(layout==='c'){const h=habits[focused];$('#habit-content').innerHTML=summary+`<div class="focus-habit">${streak(h)}<div><h2>${escape(h.name)}</h2><p>${escape(h.meta)} · ${h.done?'Completed today':'Your next small commitment'}</p>${dots(h)}<div class="actions"><button class="primary" data-check="${focused}">${h.done?'Undo check-in':'Complete this habit'}</button><button id="next-habit">Next habit →</button></div>${actions(h,focused)}</div></div><h2 class="period list-label">The rest of your day</h2>`+habits.map((h,i)=>i!==focused?row(h,i):'').join('');}
 document.querySelectorAll('[data-check]').forEach(b=>b.onclick=()=>{const h=habits[+b.dataset.check];if(h.type==='quantity'&&!h.done){notify('Add water until you meet the target.');return}if(h.slip&&!h.done){notify('A slip stays recorded; it does not count as a clean occurrence.');return}h.done=!h.done;h.streak+=h.done?1:-1;render();document.querySelectorAll('.streak').forEach(s=>s.classList.add('celebrate'))});
 document.querySelectorAll('[data-water]').forEach(b=>b.onclick=()=>{const h=habits[+b.dataset.water];h.quantity+=+(b.dataset.amount||250);if(h.quantity>=2000&&!h.done){h.done=true;h.streak++}render()});
 document.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>{const note=document.querySelector(`[data-note-body="${b.dataset.note}"]`);if(note)note.hidden=!note.hidden;else notify('In the app, this opens the saved note below the habit.');});
 document.querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>notify('Preview: focus will start linked to '+habits[+b.dataset.focus].name));
 document.querySelectorAll('[data-more]').forEach(b=>b.onclick=()=>notify('Habit options: edit schedule · freeze · archive · delete'));
 if($('#next-habit'))$('#next-habit').onclick=()=>{focused=(focused+1)%habits.length;render()};
}
document.querySelectorAll('[data-layout]').forEach(b=>b.onclick=()=>{layout=b.dataset.layout;document.querySelectorAll('[data-layout]').forEach(x=>x.classList.toggle('active',x===b));render()});
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{document.querySelectorAll('.page').forEach(p=>p.hidden=p.id!==b.dataset.page);document.querySelectorAll('[data-page]').forEach(x=>x.classList.toggle('active',x===b));});
$('#theme').onclick=()=>{document.body.classList.toggle('light');$('#theme').textContent=document.body.classList.contains('light')?'Dark theme':'Light theme'};
$('#new-habit').onclick=()=>notify('Preview: New habit will open the existing Check / Quantity / Avoid editor.');
$('#freeze').onclick=()=>notify('Preview: one freeze used. The streak stays at 12; a freeze does not increase it.');
function reflect(){ $('#reflection').hidden=false;$('#reflection').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('#reflection textarea').focus(); }
const thought='Put your effort into what you can choose: your attention, judgement and actions.';
const attribution='Inspired by Epictetus · Enchiridion, section 1';
const reflectionLink='<button class="reflect-link" id="reflect">Reflect this evening <span aria-hidden="true">↗</span></button>';
function renderThoughtDesign(design){
  $('#reflection').hidden=true;
  $('#thought-design-description').textContent={a:'A · The thought is the headline. Wide, confident type; no extra greeting or box.',b:'B · A reading page. Centred serif type, a calm measure and generous space.',c:'C · A quiet margin. Date and attribution sit beside the thought, leaving its words uninterrupted.',d:'D · Your familiar greeting leads. The thought sits quietly below, without becoming another dashboard card.',e:'E · One word to carry. An optional focus word leads, with the full thought beneath it.'}[design];
  const content={
    a:`<div class="thought-open"><h1>${thought}</h1><div class="thought-footer"><span>${attribution}</span>${reflectionLink}</div></div>`,
    b:`<div class="thought-reading"><h1>${thought}</h1><p>${attribution}</p>${reflectionLink}</div>`,
    c:`<div class="thought-margin"><div class="thought-side"><strong>October 6</strong><span>Tuesday</span><p>${attribution}</p></div><div><h1>${thought}</h1>${reflectionLink}</div></div>`,
    d:`<div class="thought-familiar"><h1>Good morning, Divine.</h1><p>${thought}</p><div class="thought-footer"><span>${attribution}</span>${reflectionLink}</div></div>`,
    e:`<div class="thought-word"><h1>Attention.</h1><p>${thought}</p><div class="thought-footer"><span>${attribution}</span>${reflectionLink}</div></div>`,
  };
  $('#home-thought-design').innerHTML=content[design];$('#reflect').onclick=reflect;
  document.querySelectorAll('[data-thought-design]').forEach(b=>b.classList.toggle('active',b.dataset.thoughtDesign===design));
}
document.querySelectorAll('[data-thought-design]').forEach(b=>b.onclick=()=>renderThoughtDesign(b.dataset.thoughtDesign));
$('.year-grid').innerHTML=Array.from({length:364},(_,i)=>`<span class="year-day ${i%13===0||i%11===0?'recorded':''}"></span>`).join('');
renderThoughtDesign('a');
const entries=[{text:'Keep promises to myself small enough to practise, not just admire.',author:'My own words',active:true},{text:'A difficult moment is a chance to practise patience.',author:'My own words',active:true}];
function renderThoughts(){const list=$('#thought-list');list.replaceChildren();entries.forEach((e,i)=>{const el=document.createElement('div');el.className='thought-entry'+(e.active?'':' paused');const p=document.createElement('p');p.textContent=e.text;el.append(p);const author=document.createElement('p');author.className='muted';author.textContent=e.author;el.append(author);const tools=document.createElement('div');tools.className='tools';for(const [title,fn] of [['Edit',()=>{$('#thought-text').value=e.text;$('#thought-author').value=e.author;$('#thought-prompt').value=e.prompt||'';$('#thought-form').dataset.edit=i;$('#thought-text').focus()}],[e.active?'Pause':'Include',()=>{e.active=!e.active;renderThoughts()}],['Move up',()=>{if(i){[entries[i-1],entries[i]]=[entries[i],entries[i-1]];renderThoughts()}}]]){const b=document.createElement('button');b.textContent=title;b.onclick=fn;tools.append(b)}el.append(tools);list.append(el)})}
$('#thought-form').onsubmit=e=>{e.preventDefault();const text=$('#thought-text').value.trim();if(!text)return;const entry={text,author:$('#thought-author').value.trim()||'My own words',prompt:$('#thought-prompt').value.trim(),active:true};const edit=$('#thought-form').dataset.edit;if(edit!==undefined){entries[+edit]=entry;delete $('#thought-form').dataset.edit}else entries.push(entry);$('#thought-form').reset();renderThoughts();notify('Added to the preview rotation. Today’s thought is unchanged.');};
const titles=['A · Continuity','B · Tempo T','C · Intention'];const descriptions=['An open circle and a simple check: continuity, with room to begin again.','A compact, confident T. Recognisable at tray-icon size without resembling a waveform.','A directional mark and check: give attention a destination. A more structured silhouette.'];
$('#logo-options').innerHTML=marks.map((m,i)=>`<div class="logo-option">${m}<div><h2>${titles[i]}</h2><p>${descriptions[i]}</p></div><button data-logo="${i}">Preview in sidebar</button></div>`).join('');document.querySelectorAll('[data-logo]').forEach(b=>b.onclick=()=>{$('#brand-mark').innerHTML=marks[+b.dataset.logo];notify(titles[+b.dataset.logo]+' selected in this preview.');});render();renderThoughts();
