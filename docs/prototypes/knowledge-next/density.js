/* Scale choice only. Fictional browser preview; never touches Tempo preferences. */
const scales = [['A',100,'Current'],['B',95,'Subtle'],['C',90,'Compact'],['D',85,'Spacious desk'],['E',80,'Maximum room']];
let densityChoice = 'C';
state.option='A';state.route='Notes';state.library=false;state.note='pipelines';state.theme='dark';
studio = function() {
  document.querySelector('#studio').innerHTML=`<div class="studio-info"><strong>Tempo · Interface scale</strong><small>Same content · fictional preview</small></div><div class="options" role="group" aria-label="Choose interface scale">${scales.map(([key,scale,name])=>`<button data-density="${key}" aria-pressed="${densityChoice===key}">${key} · ${scale}% · ${name}</button>`).join('')}</div><div class="row choice"><button data-action="theme" aria-label="Toggle light and dark">${icon(state.theme==='light'?'Moon':'Sun')}</button><button class="primary" id="choose-density">Choose ${densityChoice}</button></div>`;
  const scale=scales.find(s=>s[0]===densityChoice)[1]/100;
  document.documentElement.style.setProperty('--interface-scale',String(scale));
  requestAnimationFrame(()=>document.documentElement.style.setProperty('--studio-height',document.querySelector('#studio').getBoundingClientRect().height+'px'));
};
document.addEventListener('click',e=>{
  const button=e.target.closest('[data-density]');
  if(button){densityChoice=button.dataset.density;studio();}
  if(e.target.closest('#choose-density')){localStorage.setItem('tempo-interface-scale-choice',densityChoice);e.target.closest('#choose-density').textContent=densityChoice+' selected · reply in chat';}
});
window.addEventListener('resize',()=>document.documentElement.style.setProperty('--studio-height',document.querySelector('#studio').getBoundingClientRect().height+'px'));
render();
