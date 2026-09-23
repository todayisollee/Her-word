// Demo app implementing SVG scrolling text with clickable tspans
let words = [];
let LINES = 18; // number of text lines inside clip
let LINE_HEIGHT = 44; // px between lines
const SPEED_PX_PER_SEC = 3; // slow scroll
const MIN_TOUCH = 32; // minimum touch target in px
let scrollY = 0;
let lastTime = null;
let running = true;

async function loadData(){
  try{
    const res = await fetch('data/words.json');
    words = await res.json();
  }catch(e){
    console.warn('Failed to load data/words.json',e);
    // fallback small set
    words = [{word:'bitch',lang:'en',freq:100,acts:{origin:'...'}}];
  }
}

function pickWordWeighted(){
  // pick from words by freq weight
  const total = words.reduce((s,w)=>s+(w.freq||1),0);
  let r = Math.random()*total;
  for(const w of words){
    r -= (w.freq||1);
    if(r<=0) return w;
  }# from the project folder
python -m http.server 8000
# open http://localhost:8000
  return words[words.length-1];
}

function randomFont(){
  const fonts = ["serif","'Segoe UI'","'Microsoft Yahei'","cursive"];
  return fonts[Math.floor(Math.random()*fonts.length)];
}

function fontSizeForFreq(freq){
  // map freq into 12-44 (log scale)
  const f = Math.min(Math.max(freq||1,1),1000);
  const min = 12, max = 44;
  const size = min + (Math.log10(f)/Math.log10(1000))*(max-min);
  return Math.round(size);
}

function makeLine(){
  const line = document.createElementNS('http://www.w3.org/2000/svg','text');
  line.setAttribute('x', '40');
  line.setAttribute('y', '0');
  line.setAttribute('class','line');
  // Determine visual density: choose a representative freq sample and invert to get count
  const sample = pickWordWeighted();
  const repSize = fontSizeForFreq(sample.freq);
  // larger font -> fewer words, smaller font -> more words
  const maxCount = 8, minCount = 2;
  // map repSize (12..44) to count
  const count = Math.max(minCount, Math.min(maxCount, Math.round((44 - repSize)/(44-12)*(maxCount-minCount) + minCount)));

  for(let i=0;i<count;i++){
    const w = pickWordWeighted();
    const tspan = document.createElementNS('http://www.w3.org/2000/svg','tspan');
    tspan.setAttribute('class','tspan-word');
    tspan.setAttribute('data-word',w.word);
    const size = fontSizeForFreq(w.freq);
    tspan.setAttribute('font-size', size);
    tspan.setAttribute('font-family', randomFont());
    tspan.textContent = w.word;
    // spacing after word
    const gap = document.createElementNS('http://www.w3.org/2000/svg','tspan');
    gap.setAttribute('class','tspan-gap');
    gap.setAttribute('font-size', Math.max(10, Math.floor(size*0.6)));
    gap.textContent = '  •  ';
    line.appendChild(tspan);
    if(i<count-1) line.appendChild(gap);
  }
  return line;
}

function populateInitial(){
  const container = document.getElementById('scroll-container');
  container.innerHTML = '';
  for(let i=0;i<LINES;i++){
    const t = makeLine();
    t.setAttribute('transform', `translate(0, ${i*LINE_HEIGHT})`);
    container.appendChild(t);
  }
  // Give browser a frame to layout so we can compute bbox for hit areas
  requestAnimationFrame(()=> enhanceHitAreas());
}

function setupInteractions(){
  const svg = document.getElementById('face-svg');
  svg.addEventListener('mouseenter', ()=> running=false);
  svg.addEventListener('mouseleave', ()=> running=true);
  svg.addEventListener('touchstart', ()=> running=false, {passive:true});
  svg.addEventListener('touchend', ()=> running=true);

  document.addEventListener('click', (e)=>{
    // delegation: tspan or expanded rect may be clicked
    let el = e.target;
    while(el && el !== document){
      if(el.classList && (el.classList.contains('tspan-word') || el.classList.contains('hit-rect'))){
        const w = el.getAttribute('data-word');
        if(w) openModalForWord(w);
        break;
      }
      el = el.parentNode;
    }
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', closeModal);
  // panel controls
  const panelBtn = document.getElementById('all-words-btn');
  const panelClose = document.getElementById('panel-close');
  const panelBackdrop = document.getElementById('panel-backdrop');
  panelBtn.addEventListener('click', openWordPanel);
  panelClose.addEventListener('click', closeWordPanel);
  panelBackdrop.addEventListener('click', closeWordPanel);
  document.getElementById('panel-search').addEventListener('input', onPanelSearch);
  // keyboard: Esc closes modal or panel
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      const panel = document.getElementById('word-panel');
      const modal = document.getElementById('modal');
      if(panel.getAttribute('aria-hidden') === 'false'){
        closeWordPanel();
      }else if(modal.getAttribute('aria-hidden') === 'false'){
        closeModal();
      }
    }
  });
}

function openModalForWord(word){
  const modal = document.getElementById('modal');
  const body = document.getElementById('modal-body');
  const title = document.getElementById('modal-title');
  const found = words.find(w=>w.word===word);
  title.textContent = word;
  if(found){
    body.innerHTML = `
      <p><strong>语言</strong>: ${found.lang||'—'} &nbsp; <strong>freq</strong>: ${found.freq||'—'}</p>
      <h3>Ⅰ 本义</h3>
      <p>${found.acts?.origin||'—'}</p>
      <h3>Ⅱ 贬义化</h3>
      <p>${found.acts?.pejoration||'—'}</p>
      <h3>Ⅲ 污名顶点</h3>
      <p>${found.acts?.peakStigma||'—'}</p>
      <h3>Ⅳ 收复与再定义</h3>
      <p>${found.acts?.reclamation?.summary||'—'}</p>
    `;
    if(found.acts?.reclamation?.timeline && found.acts.reclamation.timeline.length){
      const tl = document.createElement('div');
      tl.className = 'timeline';
      for(const it of found.acts.reclamation.timeline){
        const item = document.createElement('div'); item.className='item';
        item.innerHTML = `<div class="year">${it.year}</div><div class="event">${it.event}</div>`;
        if(it.media){
          const m = document.createElement('div'); m.className='media';
          m.innerHTML = `<div><em>${it.media.type}</em> — ${it.media.title || ''} ${it.media.artist?(' / '+it.media.artist):''}</div>`;
          item.appendChild(m);
        }
        tl.appendChild(item);
      }
      body.appendChild(tl);
    }
    body.innerHTML += `<h3>Ⅴ 今天</h3><p>${found.acts?.now||'—'}</p>`;
  }else{
    body.textContent = '未找到该词的详细数据。';
  }
  modal.setAttribute('aria-hidden','false');
  // focus close button for keyboard users
  document.getElementById('modal-close').focus();
}
function closeModal(){
  const modal = document.getElementById('modal');
  modal.setAttribute('aria-hidden','true');
}

function openWordPanel(){
  const panel = document.getElementById('word-panel');
  panel.setAttribute('aria-hidden','false');
  document.getElementById('panel-search').value = '';
  populateWordPanel('');
  // focus input
  setTimeout(()=>document.getElementById('panel-search').focus(),50);
}

function closeWordPanel(){
  const panel = document.getElementById('word-panel');
  panel.setAttribute('aria-hidden','true');
  document.getElementById('all-words-btn').focus();
}

function populateWordPanel(filter){
  const list = document.getElementById('word-list');
  list.innerHTML = '';
  const q = (filter||'').trim().toLowerCase();
  const sorted = words.slice().sort((a,b)=> (b.freq||0)-(a.freq||0));
  for(const w of sorted){
    if(q && !w.word.toLowerCase().includes(q)) continue;
    const item = document.createElement('button');
    item.className = 'word-item';
    item.type = 'button';
    item.textContent = `${w.word} ${w.lang?('• '+w.lang):''}`;
    item.setAttribute('data-word', w.word);
    item.addEventListener('click', ()=>{
      openModalForWord(w.word);
      closeWordPanel();
    });
    list.appendChild(item);
  }
  if(list.children.length===0){
    const empty = document.createElement('div'); empty.className='word-item'; empty.textContent='无匹配结果';
    list.appendChild(empty);
  }
}

function onPanelSearch(e){
  populateWordPanel(e.target.value);
}

function step(timestamp){
  if(lastTime===null) lastTime = timestamp;
  const dt = (timestamp - lastTime)/1000; lastTime = timestamp;
  if(!running || window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    requestAnimationFrame(step); return;
  }
  scrollY -= SPEED_PX_PER_SEC * dt;
  const container = document.getElementById('scroll-container');
  container.setAttribute('transform', `translate(0, ${Math.round(scrollY)})`);
  // when scrolled up by more than LINE_HEIGHT, move top line to bottom
  if(scrollY <= -LINE_HEIGHT){
    // remove the first line and append a newly generated line at the bottom
    const first = container.firstElementChild;
    if(first){
      const last = container.lastElementChild;
      let lastY = 0;
      if(last){
        const t = last.getAttribute('transform') || 'translate(0,0)';
        const m = t.match(/translate\(0,\s*([\-0-9\.]+)\)/);
        lastY = m?parseFloat(m[1]):0;
      }
      const newY = lastY + LINE_HEIGHT;
      // drop first
      container.removeChild(first);
      // create new line and append
      const newLine = makeLine();
      newLine.setAttribute('transform', `translate(0, ${newY})`);
      container.appendChild(newLine);
      // reset scroll offset by +LINE_HEIGHT
      scrollY += LINE_HEIGHT;
      // re-calc hit areas on next frame
      requestAnimationFrame(()=> enhanceHitAreas());
    }
  }
  requestAnimationFrame(step);
}

function enhanceHitAreas(){
  const container = document.getElementById('scroll-container');
  // remove existing hit-rects
  container.querySelectorAll('.hit-rect').forEach(r=>r.remove());
  const wordsEls = container.querySelectorAll('.tspan-word');
  wordsEls.forEach(tspan=>{
    try{
      const bbox = tspan.getBBox();
      const minW = Math.max(MIN_TOUCH, bbox.width + 8);
      const minH = Math.max(MIN_TOUCH, bbox.height + 8);
      const cx = bbox.x + bbox.width/2;
      const cy = bbox.y + bbox.height/2;
      const rx = minW/2;
      const ry = minH/2;
      const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
      rect.setAttribute('x', cx - rx);
      rect.setAttribute('y', cy - ry);
      rect.setAttribute('width', minW);
      rect.setAttribute('height', minH);
      rect.setAttribute('fill', 'transparent');
      rect.setAttribute('class', 'hit-rect');
      rect.setAttribute('data-word', tspan.getAttribute('data-word'));
      rect.style.cursor = 'pointer';
      rect.style.pointerEvents = 'all';
      // insert rect before the tspan so it sits behind text
      const parentText = tspan.parentNode;
      parentText.insertBefore(rect, tspan);
    }catch(e){
      // ignore measurement errors on some frames
    }
  });
}

async function init(){
  await loadData();
  populateInitial();
  setupInteractions();
  requestAnimationFrame(step);
}

window.addEventListener('DOMContentLoaded', init);
