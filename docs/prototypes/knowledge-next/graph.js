/* Local, bounded force layout. Nodes and edges arrive as typed record fixtures.
   No decoration nodes or fabricated proximity links are added by the renderer. */
window.KnowledgeGraph = (() => {
  let canvas, ctx, nodes=[], edges=[], observer, frame, step=0, selected='', choose;
  let width=360,height=340, scale=1, pan={x:0,y:0}, drag, hit=null;
  const positions=new Map();
  const colors={note:'#75abc1',topic:'#c4a270',project:'#8fae96',curriculum:'#b09ac4'};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function destroy(){cancelAnimationFrame(frame);observer?.disconnect();canvas=null;}
  function layout(){
    nodes.forEach(n=>{n.vx*=.77;n.vy*=.77;});
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j];let dx=a.x-b.x,dy=a.y-b.y;const d2=dx*dx+dy*dy+5;const f=95/d2;
      a.vx+=dx*f;a.vy+=dy*f;b.vx-=dx*f;b.vy-=dy*f;
    }
    edges.forEach(e=>{const dx=e.b.x-e.a.x,dy=e.b.y-e.a.y,d=Math.sqrt(dx*dx+dy*dy)||1;const f=(d-35)*.009;e.a.vx+=dx/d*f;e.a.vy+=dy/d*f;e.b.vx-=dx/d*f;e.b.vy-=dy/d*f;});
    nodes.forEach(n=>{n.vx-=n.x*.0009;n.vy-=n.y*.0009;n.x+=n.vx;n.y+=n.vy;positions.set(n.id,{x:n.x,y:n.y});});
  }
  function point(n){return {x:width/2+pan.x+n.x*scale,y:height/2+pan.y+n.y*scale};}
  function draw(){if(!canvas)return;const dpr=devicePixelRatio||1;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);const dark=document.documentElement.dataset.theme==='dark';
    edges.forEach(e=>{const a=point(e.a),b=point(e.b),active=e.a.id===selected||e.b.id===selected;ctx.strokeStyle=active?(dark?'#7b9dad':'#7d97a1'):(dark?'#45464c':'#d9dddf');ctx.globalAlpha=active?.85:.45;ctx.lineWidth=active?1.2:.65;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();});ctx.globalAlpha=1;
    nodes.forEach(n=>{const p=point(n),active=n.id===selected||n===hit;ctx.fillStyle=colors[n.type];ctx.beginPath();ctx.arc(p.x,p.y,active?5.5:n.type==='topic'?2.5:4,0,Math.PI*2);ctx.fill();if(active){ctx.strokeStyle=dark?'#eee':'#282828';ctx.lineWidth=1.2;ctx.stroke();ctx.fillStyle=dark?'#e8e7e4':'#292825';ctx.font='12px Inter,sans-serif';ctx.fillText(n.title,Math.min(width-160,Math.max(8,p.x+10)),Math.min(height-10,Math.max(18,p.y-8)));}});
  }
  function fit(){if(!nodes.length)return;const extent=Math.max(...nodes.map(n=>Math.abs(n.x)),...nodes.map(n=>Math.abs(n.y)),100);scale=Math.min(width,height)/(extent*2.5);pan={x:0,y:0};draw();}
  function tick(){if(!canvas)return;layout();draw();if(++step<240)frame=requestAnimationFrame(tick);else fit();}
  function mount(element,data,onChoose){destroy();canvas=element;choose=onChoose;ctx=canvas.getContext('2d');nodes=data.records.map((r,i)=>{const prior=positions.get(r.id);const angle=i*2.399963;const radius=16*Math.sqrt(i+1);return {...r,x:prior?.x??Math.cos(angle)*radius,y:prior?.y??Math.sin(angle)*radius,vx:0,vy:0};});const byId=new Map(nodes.map(n=>[n.id,n]));edges=data.edges.map(e=>({...e,a:byId.get(e.source),b:byId.get(e.target)}));step=0;selected='';
    const resize=()=>{const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;canvas.width=Math.round(width*(devicePixelRatio||1));canvas.height=Math.round(height*(devicePixelRatio||1));fit();};observer=new ResizeObserver(resize);observer.observe(canvas);resize();
    canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,pan:{...pan},moved:false};canvas.setPointerCapture(e.pointerId);};
    canvas.onpointermove=e=>{const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved ||= Math.abs(dx)+Math.abs(dy)>5;pan={x:drag.pan.x+dx,y:drag.pan.y+dy};}else{hit=nodes.find(n=>{const p=point(n);return Math.hypot(x-p.x,y-p.y)<9;})||null;canvas.style.cursor=hit?'pointer':'grab';}draw();};
    canvas.onpointerup=e=>{if(drag&&!drag.moved){const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;const n=nodes.find(n=>{const p=point(n);return Math.hypot(x-p.x,y-p.y)<10;});if(n)choose(n.id);}drag=null;canvas.releasePointerCapture(e.pointerId);};
    canvas.onpointercancel=()=>drag=null;canvas.onwheel=e=>{e.preventDefault();scale=Math.min(4,Math.max(.1,scale*Math.exp(-e.deltaY*.0015)));draw();};canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','0'].includes(e.key)){e.preventDefault();if(e.key==='0')fit();else if(e.key==='+'||e.key==='-')scale*=e.key==='+'?1.15:.85;else {pan.x+=e.key==='ArrowLeft'?20:e.key==='ArrowRight'?-20:0;pan.y+=e.key==='ArrowUp'?20:e.key==='ArrowDown'?-20:0;}draw();}};
    if(reduced){for(let i=0;i<240;i++)layout();fit();}else tick();
  }
  return {mount,destroy,select:id=>{selected=id;draw();},zoom:factor=>{scale=Math.min(4,Math.max(.1,scale*factor));draw();},fit};
})();
