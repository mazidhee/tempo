import React, {useEffect,useRef,useState} from 'react';

import {createRoot} from 'react-dom/client';

import {AudioLines,BookOpen,Files,BriefcaseBusiness,Search,Plus,PanelLeft,PanelRight,ChevronRight,ChevronDown,X,FileText,Folder,Sun,Moon,Download,Columns2,ListTree,Link2,Network,ArrowLeft,ArrowRight,Check,Maximize2,ArrowUpRight} from 'lucide-react';

import {EditorView,Decoration,ViewPlugin} from '@codemirror/view';

import {EditorState,StateEffect} from '@codemirror/state';

import {markdown,markdownLanguage} from '@codemirror/lang-markdown';

import {syntaxTree,HighlightStyle,syntaxHighlighting} from '@codemirror/language';

import {tags} from '@lezer/highlight';

import {basicSetup} from 'codemirror';

import MarkdownIt from 'markdown-it';



const STORE='tempo-writing-options-v1';

const layouts=[['A','Vault desk','Persistent files, tabs and outline.'],['B','Notebook','Familiar navigation and a generous document.'],['C','Reference desk','Write with a second document beside you.'],['D','Study desk','Curriculum tree and notes in one working view.'],['E','Writing room','An open canvas; panels only when needed.']];

const initialDocs=[

 {id:'boundary',folder:'Work/Warehouse migration',title:'Ingestion boundaries',body:'# Ingestion boundaries\n\nA pipeline is a contract between a source and the people who depend on its output. The first boundary is where we decide what to accept, what to preserve, and what to reject.\n\n## Preserve the original\n\nKeep the **raw input** before transforming it. A failed transformation should never erase the evidence needed to reproduce it.\n\n- Store the source timestamp and ingestion timestamp separately.\n- Give each batch a stable identifier.\n- Record the reason a row was rejected.\n\n## Make failure visible\n\nA successful job is not the same as correct data. Start with these checks:\n\n```sql\nSELECT source_id, COUNT(*) AS occurrences\nFROM staging.events\nGROUP BY source_id\nHAVING COUNT(*) > 1;\n```\n\n> Make the boundary explicit before making the pipeline clever.\n\n## A small experiment\n\nChange one input at a time. Predict the result, run the pipeline, and compare the output with your prediction.\n\nSee [[Command reference]] for the commands used to reproduce a run.\n\n### Questions to revisit\n\n- What happens if the source sends the same batch twice?\n- Which fields make a record trustworthy?\n- Can a rejected row be replayed without duplication?\n\n## Next session\n\nBuild a fixture with duplicate IDs and a missing timestamp. Keep the expected result beside the fixture.\n\n### Observations\n\nWrite what the system actually did, including surprises.\n\n## Follow-up\n\nSeparate schema checks from business rules. They fail for different reasons and should have different recovery paths.\n'},

 {id:'commands',folder:'Study/Software engineering/Python/Practical engineering',title:'Command reference',body:'# Command reference\n\nCommands I use when building, testing and revisiting a small project.\n\n## Git\n\n### Inspect the working tree\n\n```sh\ngit status --short\ngit diff --stat\n```\n\n### Keep a checkpoint\n\nCommit one coherent change with its validation. Name the result rather than the sequence of edits.\n\n## Python\n\n```sh\npython -m venv .venv\npython -m pytest -q\n```\n\n## Debugging\n\nReduce the failing input. Keep the small example that explains the problem.\n\nSee [[Ingestion boundaries]] for a practical use of this workflow.\n'},

 {id:'objects',folder:'Study/Software engineering/Python/Core language/Object model',title:'Names and objects',body:'# Names and objects\n\nA name refers to an object. Assignment changes what a name refers to. It does not automatically create a copy of the object.\n\n## Predict first\n\n```python\na = [1, 2]\nb = a\nb.append(3)\nprint(a)\n```\n\nBefore running this, write your prediction and explain which object each name refers to.\n\n## Observation\n\nBoth names refer to the same list. Changing the list through one name is visible through the other.\n\n## Revisit\n\nHow would copying the list change the result?\n'},

 {id:'values',folder:'Study/Software engineering/Python/Core language/Object model',title:'Mutability and identity',body:'# Mutability and identity\n\nIdentity tells us which object we have. Mutability tells us whether its value can change.\n\n## Build an example\n\nCompare a list and a tuple. Keep the language guarantee separate from an implementation detail.\n\n## Notes\n\nExplain the result in your own words.\n'},

 {id:'indexes',folder:'Work/Warehouse migration/Experiments',title:'Index experiment',body:'# Index experiment\n\nCompare a query plan before and after adding an index.\n\n## Baseline\n\nKeep the row count, query and execution plan together.\n\n## Result\n\nRecord what improved and what did not.\n'},

 {id:'meeting',folder:'Work/Reporting',title:'Reporting handover',body:'# Reporting handover\n\n## Context\n\nThe team needs a dependable daily extract.\n\n## Decisions\n\n- Keep a clear ownership boundary.\n- Document freshness expectations.\n\n## Open questions\n\nWhat should happen when the upstream data arrives late?\n'},

 {id:'journal',folder:'Personal/Journal',title:'October 8',body:'# October 8\n\nA little room to notice what I learned today.\n\n## One thing to remember\n\nClarity comes from returning to the same problem with a better question.\n'}

];

const baseline={layout:'C',section:'Notes',theme:'dark',mode:'live',right:'Outline',showRight:true,showLeft:true,leftWidth:256,rightWidth:244,split:true,reference:'commands',selected:'',treeFilter:'',expanded:['Work','Work/Warehouse migration','Study','Study/Software engineering','Study/Software engineering/Python','Study/Software engineering/Python/Core language','Study/Software engineering/Python/Core language/Object model'],docs:initialDocs,views:{Notes:{active:'boundary',tabs:['boundary','commands'],positions:{}},Study:{active:'objects',tabs:['objects','values'],positions:{}},Work:{active:'boundary',tabs:['boundary','meeting'],positions:{}}}};

let storageFailure=false;

function read(){try{const saved={...baseline,...JSON.parse(localStorage.getItem(STORE)||'{}')};saved.views=Object.fromEntries(Object.keys(baseline.views).map(section=>[section,{...baseline.views[section],...saved.views?.[section],expanded:saved.views?.[section]?.expanded||saved.expanded||baseline.expanded,treeScroll:saved.views?.[section]?.treeScroll||0}]));return window.innerWidth<850?{...saved,showLeft:false,showRight:false}:saved}catch{storageFailure=true;return {...baseline,views:Object.fromEntries(Object.entries(baseline.views).map(([name,v])=>[name,{...v,expanded:baseline.expanded,treeScroll:0}]))}}}

let live=read();

function persist(value){live=value;try{localStorage.setItem(STORE,JSON.stringify(value));storageFailure=false}catch{storageFailure=true}window.dispatchEvent(new CustomEvent('preview-save',{detail:{ok:!storageFailure}}));return !storageFailure}

const md=new MarkdownIt({html:false,linkify:true,typographer:false});

const safe=(v)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function rendered(doc){return md.render(doc.body).replace(/\[\[([^\]]+)\]\]/g,(_,name)=>`<button class="wiki-link" data-note="${safe(name)}">${safe(name)}</button>`)}

const headings=(body)=>body.split('\n').flatMap((text,i)=>/^#{1,3} /.test(text)?[{text:text.replace(/^#+ /,''),level:text.match(/^#+/)[0].length,line:i+1}]:[]);

function liveSyntax(view){const state=view.state,ranges=[],active=state.doc.lineAt(state.selection.main.head).number;

 syntaxTree(state).iterate({enter(n){if(n.to<=n.from)return;const line=state.doc.lineAt(n.from);if(line.number===active)return;

 if(['HeaderMark','EmphasisMark','CodeMark'].includes(n.name))ranges.push(Decoration.replace({}).range(n.from,n.to));

 if(n.name==='FencedCode')ranges.push(Decoration.mark({class:'md-codeblock'}).range(n.from,n.to));

 if(n.name==='StrongEmphasis')ranges.push(Decoration.mark({class:'md-strong'}).range(n.from,n.to));

 if(n.name==='Emphasis')ranges.push(Decoration.mark({class:'md-em'}).range(n.from,n.to));

 if(n.name==='InlineCode')ranges.push(Decoration.mark({class:'md-code'}).range(n.from,n.to));

 }});

 for(let i=1;i<=state.doc.lines;i++){const line=state.doc.line(i);if(/^#{1,3} /.test(line.text))ranges.push(Decoration.line({class:'md-h'+line.text.match(/^#+/)[0].length}).range(line.from));if(/^> /.test(line.text))ranges.push(Decoration.line({class:'md-quote'}).range(line.from));}

 return Decoration.set(ranges,true);

}

const decoration=ViewPlugin.fromClass(class{decorations;constructor(view){this.decorations=liveSyntax(view)}update(u){if(u.docChanged||u.selectionSet||u.viewportChanged)this.decorations=liveSyntax(u.view)}},{decorations:v=>v.decorations});

const editorAppearance=(mode,theme)=>EditorView.theme({'&':{background:'transparent',color:'var(--text)',height:'100%'},'.cm-scroller':{fontFamily:mode==='source'?'var(--mono)':'var(--sans)',fontSize:'16px',lineHeight:'1.85',overflow:'auto'},'.cm-content':{padding:'36px 8px 160px',maxWidth:'var(--document-width)',margin:'0 auto',width:'100%',caretColor:'var(--accent)'},'.cm-gutters':{display:mode==='source'?'flex':'none',background:'transparent',border:'none',color:'var(--muted)'},'.cm-activeLine':{background:'transparent'},'.cm-activeLineGutter':{background:'transparent'},'&.cm-focused':{outline:'none'},'.cm-selectionBackground':{background:'var(--selection) !important'},'.cm-cursor':{borderLeftColor:'var(--accent)'},'.cm-line':{padding:'0 12px'},'.cm-foldGutter':{width:'18px'}},{dark:theme==='dark'});

const editorSessions=new Map();

const editorHighlight=HighlightStyle.define([{tag:tags.heading,color:'var(--text)',fontWeight:'600',textDecoration:'none'},{tag:tags.link,color:'var(--accent)'},{tag:tags.meta,color:'var(--muted)'},{tag:tags.keyword,color:'var(--accent)'},{tag:tags.string,color:'var(--text)'},{tag:tags.comment,color:'var(--muted)'}]);

function RememberedScroll({className,identity,scroll,onScroll,children,...rest}){const element=useRef(null);useEffect(()=>{const el=element.current;el.scrollTop=scroll||0;return undefined},[identity]);return <div tabIndex={0} {...rest} ref={element} className={className} onScroll={e=>onScroll(e.currentTarget.scrollTop)}>{children}</div>}

function ReadingDocument({doc,position,onPosition}){return <RememberedScroll className="reading" identity={doc.id} scroll={position?.readScroll} onScroll={readScroll=>onPosition({readScroll})} onClick={e=>{const name=e.target.closest('[data-note]')?.dataset.note;if(name)window.dispatchEvent(new CustomEvent('open-note',{detail:name}))}}><div dangerouslySetInnerHTML={{__html:rendered(doc)}}/></RememberedScroll>}

function MarkdownEditor({doc,mode,theme,onChange,onPosition,jump,position}){

 const mount=useRef(null),view=useRef(null),callback=useRef({onChange,onPosition});callback.current={onChange,onPosition};

 useEffect(()=>{if(mode==='read')return;const cached=editorSessions.get(doc.id);const v=new EditorView({parent:mount.current,state:EditorState.create({doc:doc.body,extensions:[basicSetup,syntaxHighlighting(editorHighlight),markdown({base:markdownLanguage}),EditorView.lineWrapping,EditorView.contentAttributes.of({'aria-label':`Markdown: ${doc.title}`,'spellcheck':'true'}),...(mode==='live'?[decoration]:[]),EditorView.updateListener.of(u=>{if(u.docChanged)callback.current.onChange(u.state.doc.toString());if(u.selectionSet)callback.current.onPosition({cursor:u.state.selection.main.head})}),EditorView.domEventHandlers({scroll:(_,v)=>{callback.current.onPosition({scroll:v.scrollDOM.scrollTop});return false}}),editorAppearance(mode,theme)]})});if(cached&&cached.doc.toString()===doc.body){v.setState(cached);v.dispatch({effects:StateEffect.reconfigure.of([basicSetup,syntaxHighlighting(editorHighlight),markdown({base:markdownLanguage}),EditorView.lineWrapping,EditorView.contentAttributes.of({'aria-label':`Markdown: ${doc.title}`,'spellcheck':'true'}),...(mode==='live'?[decoration]:[]),EditorView.updateListener.of(u=>{if(u.docChanged)callback.current.onChange(u.state.doc.toString());if(u.selectionSet)callback.current.onPosition({cursor:u.state.selection.main.head})}),EditorView.domEventHandlers({scroll:(_,v)=>{callback.current.onPosition({scroll:v.scrollDOM.scrollTop});return false}}),editorAppearance(mode,theme)])})}view.current=v;

 if(position?.cursor!=null)v.dispatch({selection:{anchor:Math.min(position.cursor,v.state.doc.length)}});

 requestAnimationFrame(()=>v.scrollDOM.scrollTop=position?.scroll||0);

 return()=>{editorSessions.set(doc.id,v.state);onPosition({cursor:v.state.selection.main.head});v.destroy();view.current=null};},[doc.id,mode,theme]);

 useEffect(()=>{if(jump?.id===doc.id&&view.current){const line=view.current.state.doc.line(Math.min(jump.line,view.current.state.doc.lines));view.current.dispatch({selection:{anchor:line.from},effects:EditorView.scrollIntoView(line.from,{y:'start'})});view.current.focus()}},[jump]);

 return mode==='read'?<ReadingDocument doc={doc} position={position} onPosition={onPosition}/>:<div className={`editor editor-${mode}`} ref={mount}/>;

}

function IconButton({label,children,onClick,...rest}){return <button type="button" className="icon" aria-label={label} title={label} onClick={onClick} {...rest}>{children}</button>}

function App(){

 const [s,setS]=useState(live),[filter,setFilter]=useState(''),[jump,setJump]=useState(null),[status,setStatus]=useState(storageFailure?'Not saved · export a copy':'Preview · autosave'),[chosen,setChosen]=useState(''),[searchOpen,setSearchOpen]=useState(false);

 const searchReturn=useRef(null);

 const current=s.views[s.section],doc=s.docs.find(d=>d.id===current.active)||s.docs[0];

 function update(fn){setS(()=>{const next=typeof fn==='function'?fn(live):{...live,...fn};persist(next);return next})}

 function setView(fields){update(old=>({...old,views:{...old.views,[old.section]:{...old.views[old.section],...fields}}}))}

 function openSearch(){searchReturn.current=document.activeElement;setSearchOpen(true)}

 useEffect(()=>{const onSave=e=>setStatus(e.detail.ok?'Saved in preview':'Not saved · export a copy');window.addEventListener('preview-save',onSave);return()=>window.removeEventListener('preview-save',onSave)},[]);

 useEffect(()=>{if(!searchOpen)return;const trap=e=>{if(e.key!=='Tab')return;const controls=[...document.querySelectorAll('.switcher button,.switcher input')];const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}};document.addEventListener('keydown',trap);return()=>{document.removeEventListener('keydown',trap);requestAnimationFrame(()=>{const previous=searchReturn.current;(previous?.isConnected?previous:document.querySelector('.cm-content')||document.querySelector('.app-nav button'))?.focus()})}},[searchOpen]);

 function select(id){update(old=>{const view=old.views[old.section];return {...old,views:{...old.views,[old.section]:{...view,active:id,tabs:[...new Set([...view.tabs,id])]}}}})}

 function openName(name){const found=s.docs.find(d=>d.title.toLowerCase()===name.toLowerCase());if(found)select(found.id)}

 useEffect(()=>{const fn=e=>openName(e.detail);window.addEventListener('open-note',fn);return()=>window.removeEventListener('open-note',fn)},[s.docs,s.section]);

 useEffect(()=>{const keyboard=e=>{if(document.querySelector('.switcher')&&e.key!=='Escape'&&!(e.ctrlKey&&e.key.toLowerCase()==='k'))return;if(e.ctrlKey&&e.key.toLowerCase()==='b'){e.preventDefault();update({showLeft:!live.showLeft})}if(e.ctrlKey&&e.key.toLowerCase()==='k'){e.preventDefault();searchReturn.current=document.activeElement;setSearchOpen(v=>!v)}if(e.ctrlKey&&e.key.toLowerCase()==='s'){e.preventDefault();persist(live)}if(e.key==='Escape'){setSearchOpen(false);setFilter('')}};window.addEventListener('keydown',keyboard);return()=>window.removeEventListener('keydown',keyboard)},[]);

 const positions=(id,p,section)=>{const state={...live,views:{...live.views,[section]:{...live.views[section],positions:{...live.views[section].positions,[id]:{...live.views[section].positions[id],...p}}}}};persist(state)};

 const change=body=>{update(old=>({...old,docs:old.docs.map(d=>d.id===doc.id?{...d,body}:d)}));};

 function newNote(){const id=crypto.randomUUID(),folder=s.section==='Work'?'Work/Warehouse migration':s.section==='Study'?'Study/Software engineering/Python/Core language/Object model':'Personal';update(old=>{const view=old.views[old.section];return {...old,docs:[...old.docs,{id,folder,title:'Untitled',body:'# Untitled\n\n'}],views:{...old.views,[old.section]:{...view,active:id,tabs:[...view.tabs,id]}}}})}

 function exportNote(){const blob=new Blob([doc.body],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=doc.title.replace(/[<>:"/\\|?*]/g,'-')+'.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),0)}

 function resize(side,e){e.preventDefault();const start=e.clientX,width=side==='left'?s.leftWidth:s.rightWidth;const move=ev=>update({[side==='left'?'leftWidth':'rightWidth']:Math.max(210,Math.min(380,width+(ev.clientX-start)*(side==='left'?1:-1)))});const done=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',done)};window.addEventListener('pointermove',move);window.addEventListener('pointerup',done)}

 const folderSet=[...new Set(s.docs.filter(d=>s.section==='Notes'||d.folder.startsWith(s.section+'/')).flatMap(d=>{const parts=d.folder.split('/');return parts.map((_,i)=>parts.slice(0,i+1).join('/'))}))];

 function tree(parent=''){const folders=folderSet.filter(f=>f.split('/').slice(0,-1).join('/')===parent);return <>{folders.map(f=>{const expanded=current.expanded.includes(f);return <div className="tree-branch" key={f}><button className="tree-folder" aria-expanded={expanded} onClick={()=>setView({expanded:expanded?current.expanded.filter(x=>x!==f):[...current.expanded,f]})}>{expanded?<ChevronDown/>:<ChevronRight/>}<Folder/><span>{f.split('/').at(-1)}</span></button>{expanded&&<div className="tree-children">{tree(f)}</div>}</div>})}{s.docs.filter(d=>d.folder===parent).map(d=><button key={d.id} className={'tree-file '+(doc.id===d.id?'active':'')} onClick={()=>select(d.id)}><FileText/><span>{d.title}</span></button>)}</>}

 const filtered=s.docs.filter(d=>(s.section==='Notes'||d.folder.startsWith(s.section))&&(!filter||`${d.title} ${d.folder} ${d.body}`.toLowerCase().includes(filter.toLowerCase())));

 const showLeft=s.showLeft,showRight=s.showRight;

 const graphNodes=s.docs.map((d,i)=>({...d,x:110+78*Math.cos(i*2*Math.PI/s.docs.length),y:110+78*Math.sin(i*2*Math.PI/s.docs.length)}));

 const graphEdges=graphNodes.flatMap(from=>[...from.body.matchAll(/\[\[([^\]]+)\]\]/g)].flatMap(m=>{const to=graphNodes.find(d=>d.title===m[1]);return to?[{from,to}]:[]}));

 const reference=s.docs.find(d=>d.id===s.reference)||s.docs[1];

 return <div data-theme={s.theme} className={`application layout-${s.layout} ${showLeft?'':'left-hidden'} ${showRight?'':'right-hidden'}`} style={{'--left-width':s.leftWidth+'px','--right-width':s.rightWidth+'px'}}>

 <header className="options" inert={searchOpen}><div className="option-heading"><strong>Writing workspace</strong><span>Working preview · fictional notes</span></div><div className="option-controls">{layouts.map(([id,name])=><button key={id} className={s.layout===id?'selected':''} onClick={()=>{update({layout:id,...(id==='D'?{section:'Study'}:{}),split:id==='C',showLeft:window.innerWidth>=850&&id!=='E',showRight:window.innerWidth>=850&&(id==='A'||id==='C'||id==='D')});setChosen('')}}>{id}<span>{name}</span></button>)}<IconButton label={s.theme==='dark'?'Use light theme':'Use dark theme'} onClick={()=>update({theme:s.theme==='dark'?'light':'dark'})}>{s.theme==='dark'?<Sun/>:<Moon/>}</IconButton><button className="choose" onClick={()=>setChosen(s.layout)}>{chosen===s.layout?<><Check/>Chosen {chosen}</>:'Choose '+s.layout}</button></div></header>

 <div className="workspace" inert={searchOpen}>

 <nav className="app-nav" aria-label="Workspace sections"><div className="brand"><AudioLines/><span>Tempo</span></div><IconButton label="Search notes · Ctrl K" onClick={openSearch}><Search/></IconButton>{[['Notes',Files],['Study',BookOpen],['Work',BriefcaseBusiness]].map(([name,Icon])=><button key={name} className={s.section===name?'active':''} title={name} onClick={()=>{update({section:name});setFilter('')}}><Icon/><span>{name}</span></button>)}<div className="nav-bottom"><span>Local preview</span></div></nav>

 {showLeft&&<aside className="explorer" aria-label="Files and topics"><div className="explorer-header"><strong>{s.layout==='D'&&s.section==='Study'?'Curriculum':s.section==='Work'?'Work notes':'Files'}</strong><IconButton label="New note" onClick={newNote}><Plus/></IconButton><IconButton label="Hide file tree" onClick={()=>update({showLeft:false})}><PanelLeft/></IconButton></div><label className="tree-search"><Search/><input aria-label="Find a file" placeholder="Find a file…" value={filter} onChange={e=>setFilter(e.target.value)}/></label>{s.section==='Study'&&<div className="study-summary"><strong>Software engineering</strong><span>6 / 24 topics · 4h 20m</span><progress max="24" value="6"/><span>Current: {doc.title}</span></div>}<RememberedScroll className="file-tree" key={s.section} identity={s.section} scroll={current.treeScroll} onScroll={treeScroll=>persist({...live,views:{...live.views,[s.section]:{...live.views[s.section],treeScroll}}})}>{filter?<div className="search-files">{filtered.map(d=><button key={d.id} onClick={()=>select(d.id)}><FileText/><span>{d.title}<small>{d.folder}</small></span></button>)}</div>:tree()}</RememberedScroll><div className="explorer-foot"><span>{filtered.length} notes</span><button onClick={()=>{setView({expanded:folderSet});update({showLeft:true})}}>Expand all</button></div><div role="separator" aria-label="Resize file tree" aria-orientation="vertical" tabIndex={0} className="resize-left" onPointerDown={e=>resize('left',e)} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();update({leftWidth:Math.max(210,Math.min(380,s.leftWidth+(e.key==='ArrowRight'?16:-16)))})}}}/></aside>}

 <main className="writing-main"><div className="tabs" role="tablist" aria-label="Open documents">{!showLeft&&<IconButton label="Show file tree" onClick={()=>update({showLeft:true,...(window.innerWidth<850?{showRight:false}:{})})}><PanelLeft/></IconButton>}{current.tabs.map(id=>{const item=s.docs.find(d=>d.id===id);return <div key={id} className={'tab '+(id===doc.id?'active':'')}><button role="tab" aria-selected={id===doc.id} onClick={()=>select(id)}><FileText/><span>{item?.title}</span></button><IconButton label={`Close ${item?.title}`} onClick={()=>update(old=>{const v=old.views[old.section],tabs=v.tabs.filter(x=>x!==id);if(!tabs.length)return old;return {...old,views:{...old.views,[old.section]:{...v,tabs,active:v.active===id?tabs.at(-1):v.active}}}})}><X/></IconButton></div>})}<IconButton label="Create document" onClick={newNote}><Plus/></IconButton><span className="tab-spacer"/><IconButton label={showRight?'Hide context panel':'Show context panel'} onClick={()=>update({showRight:!showRight,...(window.innerWidth<850?{showLeft:false}:{})})}><PanelRight/></IconButton></div>

 <div className="document-toolbar"><div className="breadcrumb">{doc.folder.split('/').map((part,i)=><React.Fragment key={i}><button onClick={()=>{setView({expanded:folderSet});update({showLeft:true})}}>{part}</button><ChevronRight/></React.Fragment>)}<span>{doc.title}</span></div><div className="mode-control" role="group" aria-label="Writing mode">{[['live','Live preview'],['source','Source'],['read','Read']].map(([value,label])=><button key={value} aria-pressed={s.mode===value} className={s.mode===value?'active':''} onClick={()=>update({mode:value})}>{label}</button>)}</div><IconButton label="Export Markdown" onClick={exportNote}><Download/></IconButton><IconButton label="Toggle reference document" onClick={()=>update({split:!s.split})}><Columns2/></IconButton><IconButton label="Focus on writing" onClick={()=>update({showLeft:false,showRight:false,split:false})}><Maximize2/></IconButton></div>

 <div className={'documents '+(s.split?'split':'')}><div className="primary-document"><MarkdownEditor key={s.section+':'+doc.id} doc={doc} mode={s.mode} theme={s.theme} position={live.views[s.section].positions[doc.id]} onChange={change} onPosition={p=>positions(doc.id,p,s.section)} jump={jump}/></div>{s.split&&<aside className="reference-document" aria-label="Reference document"><div className="reference-toolbar"><select aria-label="Reference note" value={reference.id} onChange={e=>update({reference:e.target.value})}>{s.docs.filter(d=>d.id!==doc.id).map(d=><option key={d.id} value={d.id}>{d.title}</option>)}</select><IconButton label="Close reference" onClick={()=>update({split:false})}><X/></IconButton></div><div className="reading" onClick={e=>{const name=e.target.closest('[data-note]')?.dataset.note;if(name)openName(name)}} dangerouslySetInnerHTML={{__html:rendered(reference)}}/></aside>}</div>

 <footer className="document-status"><span role={status.startsWith('Not saved')?'alert':'status'}>{status}</span>{status.startsWith('Not saved')&&<button onClick={()=>persist(live)}>Retry save</button>}<span>{doc.body.trim().split(/\s+/).length} words</span><span>Markdown</span><span>Ctrl B · files</span></footer></main>

 {showRight&&<aside className="context-panel" aria-label="Document context"><div role="separator" tabIndex={0} aria-label="Resize context panel" aria-orientation="vertical" className="resize-right" onPointerDown={e=>resize('right',e)} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();update({rightWidth:Math.max(210,Math.min(380,s.rightWidth+(e.key==='ArrowLeft'?16:-16)))})}}}/><div className="context-tabs">{[['Outline',ListTree],['Links',Link2],['Graph',Network]].map(([name,Icon])=><IconButton key={name} label={name} aria-pressed={s.right===name} onClick={()=>update({right:name})}><Icon/></IconButton>)}<span/><IconButton label="Close context panel" onClick={()=>update({showRight:false})}><X/></IconButton></div><div className="context-content"><h2>{s.right}</h2>{s.right==='Outline'?<nav aria-label="Document outline">{headings(doc.body).map(h=><button key={h.line} style={{paddingLeft:((h.level-1)*12)+'px'}} onClick={()=>{update({mode:'live'});setJump({id:doc.id,line:h.line,time:Date.now()})}}>{h.text}</button>)}</nav>:s.right==='Links'?<><h3>Linked from</h3>{s.docs.filter(d=>d.id!==doc.id&&d.body.includes('[['+doc.title+']]')).map(d=><button className="linked-note" key={d.id} onClick={()=>select(d.id)}><FileText/>{d.title}<ArrowUpRight/></button>)}<h3>Related notes</h3>{s.docs.filter(d=>d.id!==doc.id&&d.folder.split('/')[0]===doc.folder.split('/')[0]).map(d=><button className="linked-note" key={d.id} onClick={()=>select(d.id)}><FileText/>{d.title}</button>)}</>:<><svg className="graph" viewBox="0 0 220 220" aria-label="Fictional linked-note graph">{graphEdges.map(({from,to},i)=><line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}/>)}{graphNodes.map(d=><g key={d.id} onClick={()=>select(d.id)}><circle className={d.id===doc.id?'graph-current':''} cx={d.x} cy={d.y} r={d.id===doc.id?8:5}/><text x={d.x} y={d.y+19} textAnchor="middle">{d.title.slice(0,14)}</text></g>)}</svg><div className="graph-note-list">{s.docs.map(d=><button key={d.id} onClick={()=>select(d.id)}>{d.title}</button>)}</div></>}</div></aside>}

 </div>

 {searchOpen&&<div className="switcher-overlay" onClick={()=>setSearchOpen(false)}><section role="dialog" aria-modal="true" aria-label="Find a note" className="switcher" onClick={e=>e.stopPropagation()}><div className="switcher-input"><Search/><input autoFocus placeholder="Find a note…" aria-label="Search all notes" value={filter} onChange={e=>setFilter(e.target.value)}/><IconButton label="Close search" onClick={()=>setSearchOpen(false)}><X/></IconButton></div>{s.docs.filter(d=>`${d.title} ${d.folder}`.toLowerCase().includes(filter.toLowerCase())).map(d=><button className="switch-result" key={d.id} onClick={()=>{select(d.id);setSearchOpen(false);setFilter('')}}><FileText/><span>{d.title}<small>{d.folder}</small></span><ArrowUpRight/></button>)}</section></div>}

 {chosen&&<div className="choice-confirmation" role="status">{chosen} · {layouts.find(l=>l[0]===chosen)[1]} selected</div>}

 </div>;

}

createRoot(document.getElementById('root')).render(<App/>);
