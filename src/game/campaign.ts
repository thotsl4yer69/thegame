import {CHAPTERS} from './chapters';

export type CampaignReward={hp?:number;high?:number;cash?:number;packets?:number};
export type RouteOption={id:string;label:string;subtitle:string;flavour:string;threat:0|1|2;reward:CampaignReward;effects:{rizz?:number;heat?:number;debt?:number;thot?:number}};
export type CampaignState={night:number;rizz:number;heat:number;debt:number;thot:number;cleared:number;routes:Record<string,string>;choices:string[]};

const KEY='ts69-full-campaign-v4';
const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));
const fresh=():CampaignState=>({night:1,rizz:22,heat:4,debt:0,thot:18,cleared:0,routes:{},choices:[]});

const ROUTES:Record<number,RouteOption[]> = {
 0:[
  {id:'front',label:'FRONT DOOR',subtitle:'KING ST • QUEUE LIKE A CIVILIAN',flavour:'Cleaner entry. Lower heat. Less cash.',threat:0,reward:{hp:8,cash:20},effects:{heat:-2,thot:2}},
  {id:'side',label:'SIDE DOOR',subtitle:'FOLLOW THE BASS',flavour:'Faster entrance. More trouble. Better money.',threat:1,reward:{high:18,cash:45},effects:{heat:7,thot:7}},
  {id:'vip',label:'VIP LIST',subtitle:'ACT LIKE YOU BELONG',flavour:'More bodies, more cash, more witnesses.',threat:2,reward:{cash:90,high:15},effects:{rizz:7,heat:10,thot:10}}
 ],
 1:[
  {id:'brunswick',label:'BRUNSWICK ST',subtitle:'FITZROY FRONT DOOR',flavour:'Walk past the smokers and take the obvious problem.',threat:0,reward:{hp:12,cash:20},effects:{heat:-2,rizz:2}},
  {id:'laneway',label:'LANTERN LANE',subtitle:'SALEM KNOWS THE BACK WAY',flavour:'Dark route. Better loot. Nobody asks names.',threat:1,reward:{high:24,cash:55},effects:{rizz:5,heat:4,thot:8}},
  {id:'service',label:'SERVICE DOOR',subtitle:'NOT TECHNICALLY OPEN',flavour:'Maximum trouble and a suspicious amount of cash.',threat:2,reward:{cash:110,packets:1},effects:{heat:14,debt:20,thot:10}}
 ],
 2:[
  {id:'chapel',label:'CHAPEL STREET',subtitle:'PUBLIC ENTRANCE',flavour:'Fashion, flashes and only the usual amount of violence.',threat:0,reward:{hp:10,cash:35},effects:{heat:2,rizz:2}},
  {id:'rooftop',label:'ROOFTOP LIST',subtitle:'SOMEONE PUT YOUR NAME DOWN',flavour:'Better view. Worse people. Faster HIGH.',threat:1,reward:{high:28,cash:50},effects:{rizz:7,heat:7,thot:8}},
  {id:'penthouse',label:'PENTHOUSE',subtitle:'DO NOT ASK WHO INVITED YOU',flavour:'Hardest route. Richest rooms.',threat:2,reward:{cash:125,hp:10},effects:{debt:35,heat:12,thot:12}}
 ],
 3:[
  {id:'riverwalk',label:'RIVERWALK',subtitle:'SOUTHBANK • LOOK NORMAL',flavour:'Less security attention. More walking.',threat:0,reward:{hp:16},effects:{heat:-6}},
  {id:'gaming',label:'CASINO FLOOR',subtitle:'BRIGHT LIGHTS • BAD MATHS',flavour:'Balanced risk with steady cash.',threat:1,reward:{cash:85,high:16},effects:{debt:25,heat:6}},
  {id:'highlimit',label:'HIGH LIMIT',subtitle:'BIANCA IS EXPECTING YOU',flavour:'Heavy opposition. Heavy wallet.',threat:2,reward:{cash:150,high:20},effects:{rizz:9,debt:70,heat:10,thot:10}}
 ],
 4:[
  {id:'loading',label:'LOADING BAY',subtitle:'FOOTSCRAY • WAREHOUSE 44',flavour:'Industrial entrance. Minimal witnesses.',threat:0,reward:{hp:14,cash:20},effects:{heat:-3}},
  {id:'rave',label:'RAVE FLOOR',subtitle:'FOLLOW THE SUB-BASS',flavour:'More enemies. HIGH builds quickly.',threat:1,reward:{high:30,cash:65},effects:{heat:7,thot:8}},
  {id:'catwalk',label:'CATWALK',subtitle:'STAFF ONLY • OBVIOUSLY',flavour:'Maximum density and the best payday.',threat:2,reward:{cash:130,packets:1},effects:{heat:14,thot:11}}
 ],
 5:[
  {id:'tram',label:'LAST TRAM',subtitle:'ST KILDA • PRETEND TO GO HOME',flavour:'Recover before the final mess.',threat:0,reward:{hp:28},effects:{heat:-8}},
  {id:'kebab',label:'KEBAB QUEUE',subtitle:'GARLIC ARMOUR',flavour:'Healing, cash and public humiliation.',threat:1,reward:{hp:20,cash:55},effects:{heat:4,thot:8}},
  {id:'motel',label:'MOTEL STRIP',subtitle:'ONE LAST TERRIBLE IDEA',flavour:'Hardest final approach. Biggest score potential.',threat:2,reward:{high:35,cash:120},effects:{rizz:8,heat:12,thot:12}}
 ]
};

function apply(state:CampaignState,e:RouteOption['effects']){
 state.rizz=clamp(state.rizz+(e.rizz??0));state.heat=clamp(state.heat+(e.heat??0));state.debt=Math.max(0,state.debt+(e.debt??0));state.thot=clamp(state.thot+(e.thot??0));
}

export class CampaignDirector{
 state:CampaignState=fresh();
 constructor(private root:HTMLElement){this.read()}
 private read(){try{this.state={...fresh(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{this.state=fresh()}}
 private save(){localStorage.setItem(KEY,JSON.stringify(this.state))}
 newNight(){const count=Number(localStorage.getItem('ts69-night-count')||0)+1;localStorage.setItem('ts69-night-count',String(count));this.state=fresh();this.state.night=count;this.save()}
 recordPerformance(stats:{score:number;kills:number;damage:number}){this.state.heat=clamp(this.state.heat+Math.min(9,Math.floor(stats.kills/2)));this.state.thot=clamp(this.state.thot+Math.min(8,Math.floor(stats.score/1800)));if(stats.damage<18)this.state.rizz=clamp(this.state.rizz+4);this.state.cleared=Math.max(this.state.cleared+1,1);this.save()}
 recordChoice(id:string){this.state.choices.push(id);this.save()}
 summary(){return {...this.state,routes:{...this.state.routes},choices:[...this.state.choices]}}
 private stats(){return `<div class="campaign-stats"><span><b>RIZZ</b><i>${this.state.rizz}</i></span><span><b>HEAT</b><i>${this.state.heat}</i></span><span><b>DEBT</b><i>$${this.state.debt}</i></span><span><b>THOT-O-METER</b><i>${this.state.thot}%</i></span></div>`}
 async chooseRoute(chapterIndex:number):Promise<RouteOption>{
  const chapter=CHAPTERS[chapterIndex],options=ROUTES[chapterIndex]??ROUTES[0];
  this.root.classList.remove('gone');document.body.classList.add('campaign-active');
  return new Promise(resolve=>{
   const nodes=CHAPTERS.map((item,i)=>`<div class="map-node m${i} ${i<chapterIndex?'complete':i===chapterIndex?'current':'locked'}"><span>${i+1}</span><b>${item.name}</b><small>${item.district}</small></div>`).join('');
   this.root.innerHTML=`<div class="melbourne-map"><header><small>NIGHT ${this.state.night} • MELBOURNE</small><h1>WHERE TO NEXT?</h1><p>${chapter.district} • ${chapter.subtitle}</p></header><div class="melbourne-route"><div class="river"></div><div class="route-line"></div>${nodes}<div class="tram-line">96</div></div>${this.stats()}<section class="route-picker"><h2>${chapter.act} — ${chapter.name}</h2><div class="route-options">${options.map((r,i)=>`<button data-route="${i}"><small>THREAT ${'●'.repeat(r.threat+1)}${'○'.repeat(2-r.threat)}</small><b>${r.label}</b><em>${r.subtitle}</em><span>${r.flavour}</span></button>`).join('')}</div></section></div>`;
   this.root.querySelectorAll<HTMLButtonElement>('[data-route]').forEach(button=>button.onclick=()=>{const route=options[Number(button.dataset.route)];apply(this.state,route.effects);this.state.routes[String(chapterIndex)]=route.id;this.save();this.close();resolve(route)});
  });
 }
 getEnding(){
  if(this.state.heat>=75)return{title:'MELBOURNE REMEMBERS',subtitle:'EVERY VENUE KNOWS YOUR FACE',copy:'Sunrise arrives with sirens, screenshots and a remarkable number of people who want money from you.'};
  if(this.state.debt>=140)return{title:'GOLDEN HANDCUFFS',subtitle:'THE TAB NEVER REALLY CLOSES',copy:'You survived the night. Your bank account did not. Somewhere in Southbank, Bianca is smiling.'};
  if(this.state.rizz>=65)return{title:'CITY OF BAD IDEAS',subtitle:'SOMEHOW YOU GOT INVITED BACK',copy:'Six districts, several bruises and an irresponsible number of new contacts later, Melbourne still has your number.'};
  return{title:'THE LONG WAY HOME',subtitle:'GARLIC SAUCE • SUNRISE • SURVIVED',copy:'The trams start running again. You are still standing. That qualifies as character development tonight.'};
 }
 close(){this.root.classList.add('gone');this.root.innerHTML='';document.body.classList.remove('campaign-active')}
}
