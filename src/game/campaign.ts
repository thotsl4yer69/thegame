export type CampaignCharacter='roxi'|'viper'|'bianca';
export type CampaignReward={hp?:number;high?:number;cash?:number;packets?:number};
export type CampaignEffects={rizz?:number;heat?:number;debt?:number;thot?:number;chemistry?:Partial<Record<CampaignCharacter,number>>};
export type RouteOption={
  id:string;
  label:string;
  subtitle:string;
  flavour:string;
  threat:0|1|2;
  reward:CampaignReward;
  effects:CampaignEffects;
  requires?:{stat:'rizz'|'heat'|'debt'|'roxi'|'viper'|'bianca';min?:number;max?:number;label:string};
};
export type CampaignState={
  night:number;
  rizz:number;
  heat:number;
  debt:number;
  thot:number;
  chemistry:Record<CampaignCharacter,number>;
  routes:Record<string,string>;
  choices:string[];
  sideStories:string[];
};

const KEY='ts69-campaign-v3';
const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));
const mergeReward=(a:CampaignReward={},b:CampaignReward={}):CampaignReward=>({hp:(a.hp??0)+(b.hp??0),high:(a.high??0)+(b.high??0),cash:(a.cash??0)+(b.cash??0),packets:(a.packets??0)+(b.packets??0)});

const fresh=():CampaignState=>({
  night:1,rizz:24,heat:4,debt:0,thot:18,
  chemistry:{roxi:0,viper:0,bianca:0},
  routes:{},choices:[],sideStories:[]
});

const VENUES=[
  {name:'THE PINK PIGEON',tag:'VELVET • TIPS • TROUBLE',image:'assets/backgrounds/pink-pigeon.webp'},
  {name:'BACK ALLEY',tag:'STEAM • SECRETS • BAD SIGNAL',image:'assets/backgrounds/alley.webp'},
  {name:'CASINO PURGATORY',tag:'GOLD • DEBT • POWER',image:'assets/backgrounds/casino.webp'},
  {name:'KEBAB JUDGMENT',tag:'GARLIC • DAWN • CONSEQUENCES',image:'assets/backgrounds/kebab.webp'}
] as const;

const ROUTES:Record<number,RouteOption[]> = {
  0:[
    {id:'front-door',label:'FRONT DOOR',subtitle:'QUEUE LIKE A CIVILIAN',flavour:'Lower heat. Less loot. Dignity temporarily intact.',threat:0,reward:{cash:20},effects:{heat:-3,thot:2}},
    {id:'side-door',label:'SIDE DOOR',subtitle:'FOLLOW THE BASS',flavour:'Skip the queue. Start messy. Security remembers faces.',threat:1,reward:{high:20,cash:35},effects:{heat:8,thot:8}},
    {id:'guest-list',label:'VIP GUEST LIST',subtitle:'ACT LIKE YOU BELONG',flavour:'More cash, harder company, better gossip.',threat:2,reward:{cash:80,packets:1},effects:{rizz:6,heat:10,thot:10},requires:{stat:'rizz',min:20,label:'RIZZ 20'}}
  ],
  1:[
    {id:'main-alley',label:'MAIN ALLEY',subtitle:'THE HONEST BAD IDEA',flavour:'Balanced route through the bins, smokers and consequences.',threat:1,reward:{cash:35},effects:{heat:3,thot:4}},
    {id:'smoking-area',label:'SMOKING AREA',subtitle:'EVERYONE KNOWS SOMETHING',flavour:'More chemistry, more trouble, a little chemical confidence.',threat:1,reward:{high:28},effects:{rizz:5,heat:6,thot:8}},
    {id:'service-entrance',label:'SERVICE ENTRANCE',subtitle:'NOT TECHNICALLY INVITED',flavour:'Cash and contraband. Security response upgraded.',threat:2,reward:{cash:90,packets:1},effects:{heat:14,debt:20,thot:12}}
  ],
  2:[
    {id:'casino-floor',label:'CASINO FLOOR',subtitle:'LOSE MONEY BEAUTIFULLY',flavour:'Bright lights, open violence, very expensive carpet.',threat:1,reward:{cash:80},effects:{heat:5,debt:20,thot:6}},
    {id:'high-limit',label:'HIGH-LIMIT LOUNGE',subtitle:'BIANCA IS EXPECTING YOU',flavour:'The rich route. The dangerous route. Same thing, apparently.',threat:2,reward:{cash:140,hp:12},effects:{rizz:8,debt:80,heat:10,thot:10},requires:{stat:'bianca',min:8,label:'BIANCA 8'}},
    {id:'staff-lift',label:'STAFF LIFT',subtitle:'VIPER KNOWS A DOOR',flavour:'Quiet entrance, ugly exit. Fewer cameras. Better leverage.',threat:0,reward:{high:18,packets:1},effects:{heat:-8,rizz:5,thot:5},requires:{stat:'viper',min:10,label:'VIPER 10'}}
  ],
  3:[
    {id:'taxi-rank',label:'TAXI RANK',subtitle:'ONE LAST BAD IDEA',flavour:'Recover some meat before dawn starts asking questions.',threat:1,reward:{hp:24},effects:{heat:-4,thot:3}},
    {id:'kebab-queue',label:'KEBAB QUEUE',subtitle:'GARLIC ARMOUR ONLINE',flavour:'Best healing. Worst witnesses. Someone will post this.',threat:1,reward:{hp:34,cash:25},effects:{heat:5,thot:7}},
    {id:'roxi-ride',label:"ROXI'S RIDE",subtitle:'DO NOT ASK WHOSE CAR',flavour:'Fast entrance, high chemistry, absolutely no alibi.',threat:2,reward:{high:22,cash:70},effects:{heat:-5,rizz:8,thot:12,chemistry:{roxi:8}},requires:{stat:'roxi',min:18,label:'ROXI 18'}}
  ]
};

type StoryChoice={id:string;label:string;line:string;effects:CampaignEffects;reward:CampaignReward;response:string};
type StoryBeat={character:CampaignCharacter;name:string;portrait:string;kicker:string;question:string;choices:StoryChoice[]};

const STORIES:Record<number,StoryBeat>={
  0:{
    character:'roxi',name:'ROXI REDLINE',portrait:'assets/characters/woman-row0/01.png',
    kicker:'PRIVATE BOOTH • AFTER THE FIGHT',
    question:'Roxi blocks the booth exit with one boot and smiles like she already knows the answer. “So. Was all that punching for me, or are you naturally this desperate for attention?”',
    choices:[
      {id:'roxi-flirt',label:'FLIRT BACK',line:'“Depends. Is attention still comped for repeat customers?”',effects:{rizz:10,thot:8,chemistry:{roxi:14}},reward:{high:15},response:'Roxi laughs, steals your drink and writes VIPER on the napkin. “Cute. Try not to die before she gets bored.”'},
      {id:'roxi-tip',label:'TIP + ASK ABOUT VIPER',line:'Put cash on the table and ask the useful question.',effects:{debt:20,rizz:4,chemistry:{roxi:10}},reward:{cash:-20,packets:1},response:'She pockets the note without looking. “Transactional. Efficient. Slightly disappointing.” Then she gives you Viper’s alley.'},
      {id:'roxi-cool',label:'PLAY IT COOL',line:'“I came for information.”',effects:{heat:-5,rizz:-3,chemistry:{roxi:-4}},reward:{hp:8},response:'“Sure you did.” Roxi moves aside. The eye-roll follows you all the way to the door.'}
    ]
  },
  1:{
    character:'viper',name:'VIPER VICE',portrait:'assets/characters/woman-row4/01.png',
    kicker:'BACK ALLEY • NO CAMERAS WORTH TRUSTING',
    question:'Viper presses a key into your palm and doesn’t let go immediately. “Casino. Bianca. High-limit floor. You can walk in the front… or you can owe me.”',
    choices:[
      {id:'viper-owe',label:'OWE VIPER',line:'Take the back-door route and accept that this will become a problem later.',effects:{rizz:5,heat:5,debt:35,thot:10,chemistry:{viper:18}},reward:{high:22,packets:1},response:'“Good.” She closes your fingers around the key. “Debt looks better on you than caution.”'},
      {id:'viper-push',label:'MAKE HER EARN IT',line:'“What else comes with the key?”',effects:{rizz:12,heat:8,thot:8,chemistry:{viper:10}},reward:{cash:45},response:'Viper grins. “Greedy. I approve.” She adds a staff-lift code and a warning you immediately ignore.'},
      {id:'viper-roxi',label:'TEXT ROXI INSTEAD',line:'Keep one hand clean by making the other situation worse.',effects:{rizz:4,heat:-2,chemistry:{viper:-8,roxi:8}},reward:{hp:10},response:'Viper watches the message send. “Oh, that is messy.” She looks genuinely delighted.'}
    ]
  },
  2:{
    character:'bianca',name:'BIANCA BLACKOUT',portrait:'assets/characters/woman-row7/01.png',
    kicker:'HIGH-LIMIT LOUNGE • THE HOUSE IS LISTENING',
    question:'Bianca slides a black room card across the table. “I can erase your tab, your security problem, or your dignity. Pick two.”',
    choices:[
      {id:'bianca-deal',label:'TAKE THE VIP DEAL',line:'Sign nothing. Agree to everything.',effects:{rizz:8,debt:100,heat:-5,thot:12,chemistry:{bianca:20}},reward:{cash:150,hp:15},response:'Bianca pockets the card again. “You misunderstood. The room was never the reward.” Security suddenly stops looking at you.'},
      {id:'bianca-bluff',label:'CALL HER BLUFF',line:'“If you wanted me gone, I would already be outside.”',effects:{rizz:16,heat:15,thot:10,chemistry:{bianca:12}},reward:{high:28},response:'For half a second, Bianca looks impressed. “Dangerous sentence.” Then every security radio in the room wakes up.'},
      {id:'bianca-walk',label:'WALK AWAY',line:'Leave the card untouched.',effects:{heat:-12,debt:-25,chemistry:{bianca:-10}},reward:{hp:18},response:'“Discipline?” Bianca asks. “How disappointing.” The elevator doors close before you can ruin the moment.'}
    ]
  }
};

const SIDE_STORIES=[
  {
    id:'pleasure-pier',afterStage:1,title:'PLEASURE PIER',subtitle:'SIDE STORY • PRIZES, LIGHTS, TERRIBLE JUDGMENT',
    requires:(s:CampaignState)=>s.rizz>=32,
    copy:'A neon ferris wheel is still running for reasons nobody can explain. Roxi texts one word: “come.”',
    choices:[
      {label:'WIN HER SOMETHING STUPID',effects:{rizz:8,thot:5,chemistry:{roxi:8}},reward:{cash:-20,hp:12},response:'The stuffed pigeon costs forty dollars and one public argument. Roxi names it Evidence.'},
      {label:'RIG THE GAME',effects:{heat:10,rizz:5,thot:12},reward:{cash:90},response:'You win. The attendant notices. Everybody learns something about consequences.'}
    ]
  },
  {
    id:'penthouse',afterStage:2,title:'PENTHOUSE DETOUR',subtitle:'SIDE STORY • GOLD GLASS, BLACK LEDGER',
    requires:(s:CampaignState)=>s.chemistry.bianca>=16,
    copy:'Bianca’s elevator stops one floor above the casino. The doors open. No security. Worse.',
    choices:[
      {label:'STEP OUT',effects:{debt:60,thot:12,chemistry:{bianca:10}},reward:{high:25,cash:100},response:'You leave twenty minutes later with better information and significantly worse financial boundaries.'},
      {label:'STAY IN THE LIFT',effects:{rizz:4,heat:-8,chemistry:{bianca:-3}},reward:{hp:15},response:'Bianca watches the doors close and smiles like refusing her was somehow another form of consent to future trouble.'}
    ]
  }
] as const;

function applyEffects(state:CampaignState,effects:CampaignEffects){
  state.rizz=clamp(state.rizz+(effects.rizz??0));
  state.heat=clamp(state.heat+(effects.heat??0));
  state.debt=Math.max(0,state.debt+(effects.debt??0));
  state.thot=clamp(state.thot+(effects.thot??0));
  if(effects.chemistry){
    for(const key of Object.keys(effects.chemistry) as CampaignCharacter[]){
      state.chemistry[key]=clamp(state.chemistry[key]+(effects.chemistry[key]??0),-50,100);
    }
  }
}

function requirementValue(state:CampaignState,stat:RouteOption['requires'] extends infer _ ? any : never){
  return stat;
}

export class CampaignDirector{
  state:CampaignState=fresh();
  constructor(private root:HTMLElement){this.read()}
  private read(){try{this.state={...fresh(),...JSON.parse(localStorage.getItem(KEY)||'{}')};this.state.chemistry={...fresh().chemistry,...this.state.chemistry}}catch{this.state=fresh()}}
  private save(){localStorage.setItem(KEY,JSON.stringify(this.state))}
  newNight(){const previous=Number(localStorage.getItem('ts69-night-count')||0)+1;localStorage.setItem('ts69-night-count',String(previous));this.state=fresh();this.state.night=previous;this.save()}
  private stat(stat:string){if(stat==='roxi'||stat==='viper'||stat==='bianca')return this.state.chemistry[stat];return (this.state as any)[stat]??0}
  private allowed(route:RouteOption){if(!route.requires)return true;const value=this.stat(route.requires.stat);return (route.requires.min==null||value>=route.requires.min)&&(route.requires.max==null||value<=route.requires.max)}
  private statsHtml(){return `<div class="campaign-stats"><span><b>RIZZ</b><i>${this.state.rizz}</i></span><span><b>HEAT</b><i>${this.state.heat}</i></span><span><b>DEBT</b><i>$${this.state.debt}</i></span><span><b>THOT-O-METER</b><i>${this.state.thot}%</i></span><span class="chem"><b>CHEMISTRY</b><i>R ${this.state.chemistry.roxi} • V ${this.state.chemistry.viper} • B ${this.state.chemistry.bianca}</i></span></div>`}
  recordPerformance({score,kills,damage}:{score:number;kills:number;damage:number}){this.state.heat=clamp(this.state.heat+Math.min(10,Math.floor(kills/2)));this.state.thot=clamp(this.state.thot+Math.min(10,Math.floor(score/2500)));if(damage<18)this.state.rizz=clamp(this.state.rizz+4);this.save()}
  async storyBeat(stage:number):Promise<CampaignReward>{
    const beat=STORIES[stage];if(!beat)return {};
    return new Promise(resolve=>{
      this.root.classList.remove('gone');document.body.classList.add('campaign-active');
      this.root.innerHTML=`<div class="story-screen"><div class="story-backdrop" style="background-image:url('${VENUES[stage].image}')"></div><div class="story-shade"></div><img class="story-portrait" src="${beat.portrait}" alt="${beat.name}"><article class="story-card"><small>${beat.kicker}</small><h2>${beat.name}</h2><p>${beat.question}</p><div class="story-choices">${beat.choices.map((choice,i)=>`<button data-choice="${i}"><b>${choice.label}</b><span>${choice.line}</span></button>`).join('')}</div>${this.statsHtml()}</article></div>`;
      this.root.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach(button=>button.onclick=()=>{
        const choice=beat.choices[Number(button.dataset.choice)];applyEffects(this.state,choice.effects);this.state.choices.push(choice.id);this.save();
        const card=this.root.querySelector('.story-card') as HTMLElement;
        card.innerHTML=`<small>${beat.kicker}</small><h2>${beat.name}</h2><p class="story-response">${choice.response}</p>${this.statsHtml()}<button id="story-continue">CONTINUE THE NIGHT →</button>`;
        (this.root.querySelector('#story-continue') as HTMLButtonElement).onclick=()=>{this.close();resolve(choice.reward)};
      });
    });
  }
  private async sideStory(stage:number):Promise<CampaignReward>{
    const side=SIDE_STORIES.find(item=>item.afterStage===stage&&!this.state.sideStories.includes(item.id)&&item.requires(this.state));if(!side)return {};
    return new Promise<CampaignReward>(resolve=>{
      this.root.innerHTML=`<div class="side-story"><div><small>OPTIONAL BAD DECISION</small><h2>${side.title}</h2><h3>${side.subtitle}</h3><p>${side.copy}</p><div class="story-choices">${side.choices.map((choice,i)=>`<button data-side="${i}"><b>${choice.label}</b></button>`).join('')}</div><button id="skip-side" class="secondary">MIRACULOUSLY SAY NO</button></div></div>`;
      this.root.querySelectorAll<HTMLButtonElement>('[data-side]').forEach(button=>button.onclick=()=>{
        const choice=side.choices[Number(button.dataset.side)];applyEffects(this.state,choice.effects);this.state.sideStories.push(side.id);this.save();
        this.root.innerHTML=`<div class="side-story"><div><small>${side.title}</small><h2>SIDE STORY COMPLETE</h2><p>${choice.response}</p>${this.statsHtml()}<button id="side-done">BACK TO THOT CITY</button></div></div>`;
        (this.root.querySelector('#side-done') as HTMLButtonElement).onclick=()=>resolve(choice.reward);
      });
      (this.root.querySelector('#skip-side') as HTMLButtonElement).onclick=()=>resolve({});
    });
  }
  async chooseRoute(stage:number):Promise<RouteOption>{
    const sideStage=stage-1;let sideReward:CampaignReward={};if(sideStage>=0){this.root.classList.remove('gone');document.body.classList.add('campaign-active');sideReward=await this.sideStory(sideStage)}
    const options=ROUTES[stage]??ROUTES[0];
    return new Promise(resolve=>{
      this.root.classList.remove('gone');document.body.classList.add('campaign-active');
      const nodes=VENUES.map((venue,i)=>`<div class="map-node n${i} ${i<stage?'complete':i===stage?'current':'locked'}"><span>${i+1}</span><img src="${venue.image}" alt=""><b>${venue.name}</b><small>${venue.tag}</small></div>`).join('');
      this.root.innerHTML=`<div class="worldmap-shell"><header><small>NIGHT ${this.state.night} • THOT CITY</small><h1>WHERE TO NEXT?</h1><p>Different door. Same terrible judgment.</p></header><div class="map-city"><div class="map-road r1"></div><div class="map-road r2"></div><div class="map-road r3"></div>${nodes}<div class="secret-node">★<b>PLEASURE PIER</b><small>side stories</small></div></div>${this.statsHtml()}<section class="route-picker"><h2>${VENUES[stage].name}</h2><div class="route-options">${options.map((route,i)=>{const allowed=this.allowed(route);return `<button data-route="${i}" class="${allowed?'':'locked'}" ${allowed?'':'disabled'}><small>THREAT ${'●'.repeat(route.threat+1)}${'○'.repeat(2-route.threat)}</small><b>${route.label}</b><em>${route.subtitle}</em><span>${route.flavour}</span>${route.requires&&!allowed?`<strong>LOCKED • ${route.requires.label}</strong>`:''}</button>`}).join('')}</div></section></div>`;
      this.root.querySelectorAll<HTMLButtonElement>('[data-route]').forEach(button=>button.onclick=()=>{
        const route=options[Number(button.dataset.route)];if(!this.allowed(route))return;applyEffects(this.state,route.effects);this.state.routes[String(stage)]=route.id;this.save();this.close();resolve({...route,reward:mergeReward(sideReward,route.reward)});
      });
    });
  }
  getEnding(){
    const chem=this.state.chemistry;const sorted=(Object.keys(chem) as CampaignCharacter[]).sort((a,b)=>chem[b]-chem[a]);const top=sorted[0];
    if(this.state.debt>=180&&chem.bianca>=18)return {id:'golden-handcuffs',title:'GOLDEN HANDCUFFS',subtitle:'BIANCA ALWAYS COLLECTS',copy:'Dawn arrives with a black car, a paid casino tab and a new problem wearing a white suit. You are not sure whether you won. Bianca is.',character:'BIANCA',score:'POWER ENDING'};
    if(top==='roxi'&&chem.roxi>=22)return {id:'pink-sunrise',title:'PINK SUNRISE',subtitle:'ROXI NEVER SAID THIS WAS A DATE',copy:'The city goes grey while Roxi steals your sunglasses, your last cigarette and the passenger seat. The night is over. The situation absolutely is not.',character:'ROXI',score:'CHAOS ENDING'};
    if(top==='viper'&&chem.viper>=20)return {id:'poison-route',title:'POISON ROUTE',subtitle:'VIPER KNOWS ANOTHER DOOR',copy:'Viper is waiting beside a car that probably is not hers. She says there is an afterparty. You ask where. She laughs. That was apparently the wrong question.',character:'VIPER',score:'VICE ENDING'};
    if(this.state.heat>=70)return {id:'city-burns',title:'THOT CITY BURNS',subtitle:'EVERY VENUE KNOWS YOUR FACE',copy:'Three security groups, one unpaid tab and several furious voice notes survive the night. So do you. Technically.',character:'THOT CITY',score:'FERAL ENDING'};
    return {id:'walk-of-shame',title:'WALK OF SHAME',subtitle:'GARLIC SAUCE SAVES ANOTHER LIFE',copy:'You reach sunrise with your wallet lighter, your knuckles worse and several conversations you will absolutely misremember.',character:'DAWN',score:'SURVIVOR ENDING'};
  }
  summary(){return {...this.state,chemistry:{...this.state.chemistry}}}
  close(){this.root.classList.add('gone');this.root.innerHTML='';document.body.classList.remove('campaign-active')}
}
