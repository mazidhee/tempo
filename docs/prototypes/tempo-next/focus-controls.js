const names = [
  'A · Quiet toolbar',
  'B · Bottom dock',
  'C · Session footer',
  'D · Preset rail',
  'E · Minimal tabs',
];
let choice = 0,
  minutes = 25,
  phase = 'Focus',
  tracking = false,
  running = false,
  task = 'Check pipeline data quality',
  left = 1500;
const options = document.querySelector('#options'),
  timer = document.querySelector('#timer');
const mode = () =>
  `<div class="mode" aria-label="Timer mode"><button data-mode="pomodoro" aria-pressed="${!tracking}">Pomodoro</button><button data-mode="tracking" aria-pressed="${tracking}">Time tracking</button></div>`;
const phases = () =>
  `<select class="timerselect" aria-label="Timer phase" ${tracking ? 'disabled' : ''}>${['Focus', 'Short break', 'Long break'].map((p) => `<option ${p === phase ? 'selected' : ''}>${p}</option>`).join('')}</select>`;
const presets = () =>
  `<div class="presets" aria-label="Focus presets">${[15, 25, 50].map((n) => `<button data-min="${n}" aria-pressed="${minutes === n}" ${running || tracking ? 'disabled' : ''}>${n} min</button>`).join('')}</div>`;
const clock = () =>
  `<div class="clock"><time>${format()}</time><small>${running ? 'In progress' : tracking ? 'Time tracked' : phase}</small></div>`;
const start = () =>
  `<div class="startrow"><button data-start class="start">${running ? 'Pause' : '▷ Start'}</button><button data-reset class="quiet" aria-label="Reset timer">↺</button></div>`;
function format() {
  return `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
}
function render() {
  options.innerHTML = names
    .map((n, i) => `<button data-choice="${i}" aria-pressed="${choice === i}">${n}</button>`)
    .join('');
  timer.className = choice === 4 ? 'underline' : '';
  const link = `<button class="link" aria-label="Current focus task">${task}</button>`;
  const layouts = [
    `<div class="topline">${mode()}${phases()}</div>${link}${clock()}${start()}<div class="footer">${presets()}<button class="quiet" data-settings aria-label="Manage presets">Edit</button></div>`,
    `${link}${clock()}${start()}<div class="below">${presets()}</div><div class="dock">${mode()}${phases()}<button class="quiet" data-settings>Edit presets</button></div>`,
    `${link}${clock()}${start()}<div class="inspector"><div><label>Duration</label>${presets()}</div><div><label>Mode</label>${mode()}</div><div><label>Phase</label>${phases()}<button class="quiet" data-settings>Edit presets</button></div></div>`,
    `<div class="topline">${mode()}${phases()}</div>${link}<div class="vertical">${presets()}${clock()}</div>${start()}<div class="footer"><button class="quiet" data-settings>Edit presets</button></div>`,
    `${mode()}${link}${clock()}${start()}<div class="footer">${presets()}${phases()}</div><div class="footer"><button class="quiet" data-settings>Edit presets</button></div>`,
  ];
  timer.innerHTML = layouts[choice];
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.choice !== undefined) {
    choice = +b.dataset.choice;
    render();
  }
  if (b.dataset.min) {
    minutes = +b.dataset.min;
    phase = 'Focus';
    left = minutes * 60;
    render();
  }
  if (b.hasAttribute('data-start')) {
    running = !running;
    render();
  }
  if (b.hasAttribute('data-reset')) {
    running = false;
    left = tracking ? 0 : (phase === 'Focus' ? minutes : phase === 'Short break' ? 5 : 15) * 60;
    render();
  }
  if (b.dataset.mode) {
    tracking = b.dataset.mode === 'tracking';
    running = false;
    left = tracking ? 0 : minutes * 60;
    render();
  }
  if (b.dataset.task) {
    task = b.dataset.task;
    render();
  }
  if (b.hasAttribute('data-settings')) {
    alert(
      'The app retains its preset editor. This preview compares the placement of those controls.',
    );
  }
  if (b.id === 'theme') {
    document.body.classList.toggle('light');
    b.textContent = document.body.classList.contains('light') ? 'Dark' : 'Light';
  }
  if (b.id === 'fullscreen') {
    document.body.classList.toggle('zen');
    b.textContent = document.body.classList.contains('zen') ? 'Exit focus mode ↙' : 'Focus mode ↗';
  }
});
document.addEventListener('change', (e) => {
  if (e.target.matches('.timerselect')) {
    phase = e.target.value;
    running = false;
    left = (phase === 'Focus' ? minutes : phase === 'Short break' ? 5 : 15) * 60;
    render();
  }
});
setInterval(() => {
  if (!running) return;
  left = tracking ? left + 1 : Math.max(0, left - 1);
  if (!tracking && left === 0) running = false;
  const t = timer.querySelector('time');
  if (t) t.textContent = format();
}, 1000);
render();
