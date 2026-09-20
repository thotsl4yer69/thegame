import Phaser from 'phaser';
import '@fontsource/black-ops-one/latin-400.css';
import '@fontsource/oswald/latin-400.css';
import '@fontsource/oswald/latin-600.css';
import '@fontsource/oswald/latin-700.css';
import './style.css';
import './polish.css';
import {GameScene} from './game/GameScene';
import {FilthyAudio} from './game/audio';
import {UPGRADES} from './game/data';
import {achievementCount,bestScore,formatTime,rankRun,readGallery,readStats,recordRun} from './game/progression';
import {CutsceneDirector,CutsceneId} from './cinematics/CutsceneDirector';
import {CampaignDirector,type CampaignReward} from './game/campaign';

const q=<T extends HTMLElement>(selector:string)=>document.querySelector(selector) as T;
const audio=new FilthyAudio();
const scene=new GameScene(audio);
const game=new Phaser.Game({
  type:Phaser.AUTO,
  width:1280,
  height:720,
  parent:'game',
  backgroundColor:'#090509',
  pixelArt:false,
  antialias:true,
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  physics:{default:'arcade',arcade:{gravity:{x:0,y:1050},debug:false}},
  scene:[scene]
});
if(location.search.includes('qa'))(window as any).__ts69={game,scene};

const overlay=q('#overlay');
const modal=q('#modal');
const hud=q('#hud');
const touch=q('#touch');
const toast=q('#toast');
const shell=q('#shell');
const cutsceneRoot=q('#cutscene');
const worldmap=q('#worldmap');
const cutscenes=new CutsceneDirector(cutsceneRoot);
const campaign=new CampaignDirector(worldmap);
const RELEASE_CACHE='ts69-v4';
let toastTimer=0;
let bossTimer=0;
let achievementTimer=0;
let debaucheryTimer=0;
let venueTimer=0;
let previousHp=100;
let previousHigh=0;

const DIFFICULTY_COPY:Record<string,string>={
  messy:'TRAINING WHEELS FOR BAD DECISIONS. SOFTER HITS, SLOWER HAZARDS, 0.8× SCORE.',
  cooked:'THE INTENDED BAD DECISION. NORMAL DAMAGE, NORMAL HAZARDS, NORMAL REGRET.',
  unhinged:'30% TOUGHER ENEMIES, 28% HARDER HITS, FASTER HAZARDS, 1.5× SCORE.',
  feral:'NO ALIBI MODE. 55% TOUGHER ENEMIES, 48% HARDER HITS, RELENTLESS HAZARDS, 2.25× SCORE.'
};

function renderTitleStats(){
  const stats=readStats();
  q('#best').textContent=`PERSONAL WORST: ${bestScore().toLocaleString()} POINTS • ${achievementCount()}/8 DEGENERACIES UNLOCKED`;
  q('#rap-sheet').textContent=stats.runs
    ?`RAP SHEET: ${stats.runs} RUN${stats.runs===1?'':'S'} • ${stats.clears} DAWN CLEAR${stats.clears===1?'':'S'} • ${stats.totalKills} PROBLEMS DROPPED${stats.fastestClear?` • FASTEST ${formatTime(stats.fastestClear)}`:''}`
    :'RAP SHEET: CLEAN. TEMPORARILY.';
}
function pulseClass(el:HTMLElement,name:string,duration:number){
  el.classList.remove(name);
  void el.offsetWidth;
  el.classList.add(name);
  window.setTimeout(()=>el.classList.remove(name),duration);
}
function vibrate(pattern:number|number[]){try{navigator.vibrate?.(pattern)}catch{}}

let difficulty=localStorage.getItem('ts69-difficulty')||'cooked';
if(!(difficulty in DIFFICULTY_COPY))difficulty='cooked';
scene.setDifficulty(difficulty);
function selectDifficulty(key:string){
  if(!(key in DIFFICULTY_COPY))return;
  difficulty=key;
  localStorage.setItem('ts69-difficulty',difficulty);
  scene.setDifficulty(difficulty);
  document.querySelectorAll<HTMLButtonElement>('[data-diff]').forEach(button=>button.classList.toggle('active',button.dataset.diff===difficulty));
  q('#difficulty-copy').textContent=DIFFICULTY_COPY[difficulty];
}
document.querySelectorAll<HTMLButtonElement>('[data-diff]').forEach(button=>button.onclick=()=>selectDifficulty(button.dataset.diff!));
selectDifficulty(difficulty);
renderTitleStats();

function closeModal(){modal.classList.add('gone');modal.innerHTML=''}
function mergeRewards(...rewards:CampaignReward[]):CampaignReward{return rewards.reduce((out,reward)=>({hp:(out.hp??0)+(reward.hp??0),high:(out.high??0)+(reward.high??0),cash:(out.cash??0)+(reward.cash??0),packets:(out.packets??0)+(reward.packets??0)}),{} as CampaignReward)}
async function beginRun(){
  audio.start();
  overlay.classList.add('gone');
  scene.setCampaignRoute('QUALITY SLICE',0,{});
  document.body.classList.add('game-active');
  hud.classList.remove('gone');
  touch.classList.remove('gone');
  scene.startRun();
}
function showHowTo(){
  modal.innerHTML=`<div class="age">PLAYABILITY REBUILD • THREE THINGS ONLY</div><h2>HOW TO FIGHT</h2><div class="how-grid"><article><b>MOVE ON THE FLOOR</b><p>Use four directions. This is a belt-scroller now: line yourself up with enemies before swinging.</p></article><article><b>SMACK ×3</b><p>Tap SMACK three times with rhythm. Hits 1–2 set up the heavier third-hit finisher.</p></article><article><b>HARD</b><p>Slower, wider heavy attack. At full HIGH it becomes the high-damage MONEY SHOT automatically.</p></article><article><b>DASH</b><p>Short invulnerable dodge in any held direction. Use it on the yellow enemy telegraph, then punish.</p></article></div><p class="keys"><b>MOVE</b> WASD / ARROWS　<b>SMACK</b> J　<b>HARD</b> H　<b>DASH</b> SHIFT</p><button id="back">GOT IT</button>`;
  modal.classList.remove('gone');
  q('#back').onclick=closeModal;
}
function showCast(){
  let unlocked:string[]=[];
  unlocked=readGallery();
  const cast=[
    ['roxi','Roxi Redline','woman-row0','A five-alarm redhead with expensive taste and thighs that could cancel your insurance.'],
    ['lexi','Lexi Platinum','woman-row1','VIP hostility poured into silver. Bottle service, zero emotional service.'],
    ['nyx','Nyx Damage','woman-row2','Tattooed goth gravity well. You know she is a red flag; that is apparently the attraction.'],
    ['candy','Candy Gold','woman-row3','Glitter, muscle and financial consequences. Tips accepted. Excuses rejected.'],
    ['viper','Viper Vice','woman-row4','Emerald poison in thigh-high boots. Makes eye contact like a legally binding threat.'],
    ['lola','Lola Leopard','woman-row5','Big hair, bigger curves, catastrophic decision-making radius.'],
    ['suki','Suki Static','woman-row6','Rave voltage with enough bass to rearrange your organs and browsing history.'],
    ['bianca','Bianca Blackout','woman-row7','White suit, black ledger. She owns the room and half your future income.']
  ];
  modal.innerHTML=`<div class="age">AFTER-DARK BADDIE DOSSIERS • ${unlocked.length}/8 DROPPED</div><h2>THE PROBLEMS</h2><div class="cards after-dark">${cast.map(([key,name,row,desc])=>`<article class="card ${unlocked.includes(key)?'unlocked':'locked'}"><img src="assets/characters/${row}/01.png" alt="${name}"><h3>${name}</h3><p>${unlocked.includes(key)?desc:'DROP HER IN-GAME TO UNLOCK THE FILTHY DOSSIER.'}</p></article>`).join('')}</div><button id="back">BACK TO THE BAD IDEA</button>`;
  modal.classList.remove('gone');
  q('#back').onclick=closeModal;
}

function showCinema(){
  modal.innerHTML=`<div class="age">AFTER-HOURS CINEMA • FICTIONAL ADULTS 21+</div><h2>AFTER-HOURS CUTS</h2><p>Replay the filthy motion-comic connective tissue between venues.</p><div class="choices cinema-choices">${cutscenes.scenes.map(scene=>`<button class="choice" data-cut="${scene.id}"><b>${scene.title}</b><small>${scene.location}</small></button>`).join('')}</div><button id="back">BACK TO THE BAD IDEA</button>`;
  modal.classList.remove('gone');
  modal.querySelectorAll<HTMLButtonElement>('[data-cut]').forEach(button=>button.onclick=async()=>{closeModal();overlay.classList.add('gone');await cutscenes.play(Number(button.dataset.cut) as CutsceneId);overlay.classList.remove('gone');showCinema()});
  q('#back').onclick=closeModal;
}

q('#start').onclick=()=>void beginRun();
q('#how').onclick=showHowTo;
q('#cast').onclick=showCast;
q('#cinema').onclick=showCinema;
q('#mute').onclick=()=>{q('#mute').textContent=audio.toggle()?'×':'♪'};

game.events.on('toast',({text,duration}:{text:string;duration:number})=>{
  toast.innerText=text;
  clearTimeout(toastTimer);
  toastTimer=window.setTimeout(()=>toast.innerText='',duration);
});
game.events.on('bossIntro',({name,line,image}:{name:string;line:string;image:string})=>{
  q<HTMLImageElement>('#boss-portrait').src=image;
  q<HTMLImageElement>('#boss-portrait').alt=name;
  q('#boss-card-name').textContent=name;
  q('#boss-card-line').textContent=line;
  const card=q('#boss-card');
  card.classList.remove('gone');
  pulseClass(shell,'boss-impact',420);
  vibrate([25,35,55]);
  clearTimeout(bossTimer);
  bossTimer=window.setTimeout(()=>card.classList.add('gone'),2300);
});
game.events.on('achievement',({name}:{name:string})=>{
  q('#achievement-name').textContent=name;
  const achievement=q('#achievement');
  achievement.classList.remove('gone');
  vibrate([15,35,15]);
  clearTimeout(achievementTimer);
  achievementTimer=window.setTimeout(()=>achievement.classList.add('gone'),2400);
});
game.events.on('debauchery',({name}:{name:string})=>{
  audio.special();
  q('#debauchery-name').textContent=name;
  const stamp=q('#debauchery-stamp');
  stamp.classList.remove('gone');
  pulseClass(stamp,'debauchery-pop',620);
  vibrate([10,22,10]);
  clearTimeout(debaucheryTimer);
  debaucheryTimer=window.setTimeout(()=>stamp.classList.add('gone'),1450);
});
game.events.on('venueIntro',({act,name,line}:{act:string;name:string;line:string})=>{
  q('#venue-card-act').textContent=act;
  q('#venue-card-name').textContent=name;
  q('#venue-card-line').textContent=line;
  const card=q('#venue-card');
  card.classList.remove('gone');
  pulseClass(card,'venue-card-pop',780);
  clearTimeout(venueTimer);
  venueTimer=window.setTimeout(()=>card.classList.add('gone'),1550);
});
game.events.on('hud',(s:any)=>{
  if(s.hp<previousHp-.1)pulseClass(shell,'hud-hit',210);
  if(previousHigh<95&&s.high>=95)pulseClass(shell,'high-popped',600);
  previousHp=s.hp;
  previousHigh=s.high;
  document.body.classList.toggle('meat-critical',s.hp/s.maxHp<=.25);
  document.body.classList.toggle('high-ready',s.high>=95);
  document.body.classList.toggle('combo-hot',s.combo>=5);

  q('#hp-text').textContent=String(Math.ceil(s.hp));
  q<HTMLElement>('#hp-bar').style.width=`${Math.max(0,s.hp/s.maxHp*100)}%`;
  q('#high').textContent=s.high>=95?'READY':String(Math.floor(s.high));
  q<HTMLElement>('#high-bar').style.width=`${Math.max(0,s.high)}%`;
  q('#packets').textContent=String(s.packets);
  q('#cash').textContent=String(s.cash);
  q('#weapon').textContent=s.weapon?s.weapon.toUpperCase():'FISTS';
  q('#score').textContent=s.score.toLocaleString();
  q('#act').textContent=s.stageData.act;
  q('#venue').textContent=s.stageData.name;
  q('#wave').textContent=s.progress?`${s.progress.label} • ${s.progress.current}/${s.progress.total}`:`ROUTE ${s.wave+1}`;
  if(s.progress)q<HTMLElement>('#route-bar').style.width=`${Math.round(s.progress.distance*100)}%`;
  const combo=q('#combo');
  combo.innerHTML=`${s.combo}× <small>${s.combo>8?'ABSOLUTE FILTH':s.combo>4?'DISGUSTING':'FILTHY'}</small>`;
  combo.classList.toggle('gone',s.combo<2);
  const bossWrap=q('#boss-wrap');
  bossWrap.classList.toggle('gone',!s.boss);
  if(s.boss){
    q('#boss-name').textContent=s.boss.name;
    q<HTMLElement>('#boss-bar').style.width=`${Math.max(0,s.boss.hp/s.boss.max*100)}%`;
  }
});
game.events.on('upgrade',async({stage,choices,choose,stageStats}:any)=>{
  hud.classList.add('gone');touch.classList.add('gone');
  campaign.recordPerformance(stageStats);
  await cutscenes.play(stage as CutsceneId);
  const storyReward=await campaign.storyBeat(stage);
  modal.innerHTML=`<div class="age">ACT SURVIVED • CHOOSE YOUR NEXT DISORDER</div><h2>DEGENERATE UPGRADE</h2><div class="choices">${choices.map((u:(typeof UPGRADES)[number])=>`<button class="choice" data-id="${u.id}"><b>${u.name}</b><small>${u.desc}</small></button>`).join('')}</div>`;
  modal.classList.remove('gone');
  modal.querySelectorAll<HTMLButtonElement>('[data-id]').forEach(button=>button.onclick=async()=>{
    const upgradeId=button.dataset.id!;
    closeModal();
    const route=await campaign.chooseRoute(stage+1);
    scene.setCampaignRoute(route.label,route.threat,mergeRewards(storyReward,route.reward));
    choose(upgradeId);
    hud.classList.remove('gone');touch.classList.remove('gone');
  });
});
game.events.on('pause',(payload?:{resume?:()=>void})=>{
  if(!payload?.resume)return;
  audio.pause(true);
  modal.innerHTML=`<div class="age">COWARD'S INTERMISSION</div><h2>PAUSED</h2><p>Hydrate. Lie to yourself. Continue.</p><button id="resume">GET BACK IN THERE</button>`;
  modal.classList.remove('gone');
  q('#resume').onclick=()=>{closeModal();payload.resume?.()};
});
game.events.on('resumed',()=>audio.pause(false));
game.events.on('closeModal',closeModal);
game.events.on('gameover',({score,stage,kills,damage,difficulty:runDifficulty,retry}:any)=>{
  audio.pause(true);
  hud.classList.add('gone');
  touch.classList.add('gone');
  const rank=rankRun(score,false);
  const stats=recordRun({score,kills,damage,cleared:false});
  modal.innerHTML=`<div class="age">RUN TERMINATED • ${runDifficulty}</div><div class="night-rating">NIGHT RATING <b>${rank}</b></div><h2>ABSOLUTELY FUCKED IT</h2><p>You reached ${stage+1}/4 venues and scraped together <b>${score.toLocaleString()}</b> points.</p><p class="stats">PROBLEMS DROPPED ${kills}　•　MEAT LOST ${Math.round(damage)}　•　CAREER RUNS ${stats.runs}</p><div class="menu-actions"><button id="retry">MAKE THE SAME MISTAKES AGAIN</button><button id="title" class="secondary">TITLE + DOSSIERS</button></div>`;
  modal.classList.remove('gone');
  q('#retry').onclick=()=>location.reload();
  q('#title').onclick=()=>location.reload();
});
game.events.on('ending',async({score,cash,best,kills,damage,seconds,difficulty:runDifficulty}:any)=>{
  audio.pause(true);
  hud.classList.add('gone');
  touch.classList.add('gone');
  await cutscenes.play(0);
  const time=formatTime(seconds);
  const rank=rankRun(score,true);
  recordRun({score,kills,damage,cleared:true,seconds});
  modal.innerHTML=`<div class="age">PINK PIGEON QUALITY SLICE • ${runDifficulty}</div><div class="night-rating">COMBAT RATING <b>${rank}</b></div><h1>SLICE<br><span>CLEARED</span></h1><h2>THIS IS THE GATE, NOT THE FINISH LINE.</h2><p>The rebuild stops here deliberately. If this combat and movement are not good enough, nothing else gets expanded.</p><p class="stats">SCORE ${score.toLocaleString()}　•　CASH $${cash}　•　BEST ${best.toLocaleString()}<br>PROBLEMS ${kills}　•　MEAT LOST ${Math.round(damage)}　•　TIME ${time}</p><div class="menu-actions"><button id="retry">RUN THE SLICE AGAIN</button><button id="title" class="secondary">BACK TO TITLE</button></div>`;
  modal.classList.remove('gone');
  q('#retry').onclick=()=>location.reload();
  q('#title').onclick=()=>location.reload();
});

async function cacheReleaseAssets(){
  if(!scene.ready){window.setTimeout(()=>void cacheReleaseAssets(),100);return}
  const urls=[location.href,...performance.getEntriesByType('resource').map(entry=>entry.name)]
    .filter(url=>new URL(url).origin===location.origin);
  const cache=await caches.open(RELEASE_CACHE);
  await Promise.all([...new Set(urls)].map(async url=>{try{await cache.add(url)}catch{}}));
}
if('serviceWorker' in navigator&&import.meta.env.PROD)navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(cacheReleaseAssets).catch(()=>{});
const idle=window.requestIdleCallback??((callback:IdleRequestCallback)=>window.setTimeout(()=>callback({didTimeout:false,timeRemaining:()=>0} as IdleDeadline),800));
idle(()=>void cutscenes.preload().then(cacheReleaseAssets).catch(()=>{}));
document.querySelectorAll<HTMLButtonElement>('#touch [data-action]').forEach(button=>{
  const action=button.dataset.action!;
  button.addEventListener('pointerdown',event=>{
    event.preventDefault();
    try{button.setPointerCapture?.(event.pointerId)}catch{}
    vibrate(action==='hit'||action==='heavy'?14:8);
    game.events.emit('touch',action,true);
  });
  for(const eventName of ['pointerup','pointercancel'] as const)button.addEventListener(eventName,(event:PointerEvent)=>{
    if(button.hasPointerCapture?.(event.pointerId))button.releasePointerCapture(event.pointerId);
    game.events.emit('touch',action,false);
  });
});
window.addEventListener('blur',()=>{if(modal.classList.contains('gone')&&cutsceneRoot.classList.contains('gone')&&worldmap.classList.contains('gone'))game.events.emit('autopause')});
