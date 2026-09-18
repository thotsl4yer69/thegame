export type CutsceneId=0|1|2|3;
type Shot='wide'|'jack'|'lead'|'intimate';
type Beat={speaker:string;line:string;shot:Shot;jackPose:1|2|3|4;leadPose:1|2|3|4};
type Cutscene={
  id:CutsceneId;
  kicker:string;
  title:string;
  location:string;
  background:string;
  leadName:string;
  leadRow:number;
  jackRow:number;
  accent:string;
  beats:Beat[];
};

export const CUTSCENES:readonly Cutscene[]=[
  {
    id:0,
    kicker:'ACT I AFTER HOURS',
    title:'VELVET WARNING',
    location:'THE PINK PIGEON • PRIVATE BOOTH',
    background:'assets/backgrounds/pink-pigeon.webp',
    leadName:'ROXI REDLINE',
    leadRow:0,
    jackRow:0,
    accent:'#ff269c',
    beats:[
      {speaker:'ROXI REDLINE',shot:'lead',jackPose:1,leadPose:2,line:'You bought the VIP booth, ordered tap water, and have not looked at my face once. Babe, at least lie to me professionally.'},
      {speaker:'JACK',shot:'jack',jackPose:2,leadPose:2,line:'I am investigating. Your outfit is obstructing justice.'},
      {speaker:'ROXI REDLINE',shot:'intimate',jackPose:3,leadPose:3,line:'Eyes up, hero. Viper has the name you want. Ask nicely and maybe I stop sitting this close.'},
      {speaker:'PINK PIGEON',shot:'wide',jackPose:4,leadPose:4,line:'Roxi crosses one lacquered thigh over his escape route, steals his collar and twenty bucks. Jack files absolutely no complaint.'}
    ]
  },
  {
    id:1,
    kicker:'ACT II AFTER HOURS',
    title:'NEON SAFE WORD',
    location:'BACK ALLEY • 2:43AM',
    background:'assets/backgrounds/alley.webp',
    leadName:'VIPER VICE',
    leadRow:4,
    jackRow:1,
    accent:'#19ead8',
    beats:[
      {speaker:'VIPER VICE',shot:'lead',jackPose:1,leadPose:2,line:'Roxi says you survived the booth without proposing marriage. Barely. That is almost attractive.'},
      {speaker:'JACK',shot:'jack',jackPose:2,leadPose:2,line:'Operational discipline. Mostly above the belt.'},
      {speaker:'VIPER VICE',shot:'intimate',jackPose:3,leadPose:3,line:'Keep talking like that and I will make you earn the key the embarrassing way. Bianca owns the casino, the debt and your next bad idea.'},
      {speaker:'CITY CCTV',shot:'wide',jackPose:4,leadPose:4,line:'She slides the key inside his jacket, lets one finger linger at the lapel, then leaves him arguing with his own pulse.'}
    ]
  },
  {
    id:2,
    kicker:'ACT III AFTER HOURS',
    title:'THE HOUSE EDGE',
    location:'CASINO PURGATORY • HIGH-LIMIT LOUNGE',
    background:'assets/backgrounds/casino.webp',
    leadName:'BIANCA BLACKOUT',
    leadRow:7,
    jackRow:2,
    accent:'#ffd229',
    beats:[
      {speaker:'BIANCA BLACKOUT',shot:'lead',jackPose:1,leadPose:2,line:'That key gets you into my lounge. The stare costs extra.'},
      {speaker:'JACK',shot:'jack',jackPose:2,leadPose:2,line:'Put it on my tab. Apparently financial ruin is my love language.'},
      {speaker:'BIANCA BLACKOUT',shot:'intimate',jackPose:3,leadPose:3,line:'Beat Damo and your tab vanishes. Keep looking at me like that and I may open a second one.'},
      {speaker:'HOUSE SECURITY',shot:'wide',jackPose:4,leadPose:4,line:'The doors lock. Bianca leans closer. Jack decides this counts as due diligence. Security strongly disagrees.'}
    ]
  },
  {
    id:3,
    kicker:'FINAL CUT • 5:58AM',
    title:'DAWN HAS A WALK OF SHAME',
    location:'KEBAB JUDGMENT • FIRST LIGHT',
    background:'assets/backgrounds/kebab.webp',
    leadName:'ROXI REDLINE',
    leadRow:0,
    jackRow:3,
    accent:'#ff7849',
    beats:[
      {speaker:'ROXI REDLINE',shot:'lead',jackPose:1,leadPose:2,line:'Four venues, three catastrophically bad decisions, two women who could ruin you, one kebab. You are consistent.'},
      {speaker:'JACK',shot:'jack',jackPose:2,leadPose:2,line:'I prefer committed.'},
      {speaker:'ROXI REDLINE',shot:'intimate',jackPose:3,leadPose:3,line:'Come here, menace. If sunrise wants to judge us, it can buy a ticket.'},
      {speaker:'DAWN',shot:'wide',jackPose:4,leadPose:4,line:'She hooks two fingers in his collar and drags him into the last patch of neon. The pigeon respectfully turns around.'}
    ]
  }
] as const;

const pose=(folder:string,index:number)=>`assets/characters/${folder}/0${index}.png`;

export class CutsceneDirector{
  private root:HTMLElement;
  private stage:HTMLElement;
  private current?:Cutscene;
  private beat=0;
  private resolve?:()=>void;
  private tipTotal=0;
  private bg?:HTMLImageElement;
  private jack?:HTMLImageElement;
  private lead?:HTMLImageElement;
  private fx?:HTMLElement;
  private reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(root:HTMLElement){
    this.root=root;
    this.stage=this.query('#cutscene-stage');
    this.query<HTMLButtonElement>('#cutscene-next').onclick=()=>this.advance();
    this.query<HTMLButtonElement>('#cutscene-tip').onclick=()=>this.tipStage();
    this.query<HTMLButtonElement>('#cutscene-skip').onclick=()=>this.finish();
    window.addEventListener('keydown',event=>{
      if(this.root.classList.contains('gone'))return;
      if(event.key==='Escape'){event.preventDefault();this.finish()}
      if(event.key==='Enter'||event.key===' '){event.preventDefault();this.advance()}
    });
  }

  get scenes(){return CUTSCENES}

  preload(){
    const urls=new Set<string>();
    for(const scene of CUTSCENES){
      urls.add(scene.background);
      for(let i=1;i<=4;i++){
        urls.add(pose(`jack-row${scene.jackRow}`,i));
        urls.add(pose(`woman-row${scene.leadRow}`,i));
      }
    }
    return Promise.all([...urls].map(url=>new Promise<void>(resolve=>{
      const image=new Image();
      image.onload=image.onerror=()=>resolve();
      image.src=url;
    })));
  }

  async play(id:CutsceneId){
    if(this.resolve)this.finish();
    this.current=CUTSCENES[id];
    this.beat=0;
    this.tipTotal=0;
    this.root.style.setProperty('--cut-accent',this.current.accent);
    this.root.classList.remove('gone');
    document.body.classList.add('cutscene-active');
    this.query('#cutscene-kicker').textContent=this.current.kicker;
    this.query('#cutscene-title').textContent=this.current.title;
    this.query('#cutscene-location').textContent=this.current.location;
    const tip=this.query<HTMLButtonElement>('#cutscene-tip');
    tip.classList.toggle('gone',id!==0);
    tip.textContent='TIP THE STAGE $20';
    this.buildStage();
    this.renderBeat(false);
    const completion=new Promise<void>(resolve=>{this.resolve=resolve});
    this.query<HTMLButtonElement>('#cutscene-next').focus({preventScroll:true});
    return completion;
  }

  private query<T extends HTMLElement=HTMLElement>(selector:string){return this.root.querySelector(selector) as T}

  private buildStage(){
    if(!this.current)return;
    this.stage.replaceChildren();

    const frame=document.createElement('div');
    frame.className='cutscene-frame';

    const bg=document.createElement('img');
    bg.className='cutscene-bg';
    bg.src=this.current.background;
    bg.alt='';
    bg.draggable=false;

    const wash=document.createElement('div');
    wash.className='cutscene-wash';

    const jack=document.createElement('img');
    jack.className='cutscene-character cutscene-jack';
    jack.alt='Jack';
    jack.draggable=false;

    const lead=document.createElement('img');
    lead.className='cutscene-character cutscene-lead';
    lead.alt=this.current.leadName;
    lead.draggable=false;

    const fx=document.createElement('div');
    fx.className='cutscene-fx';
    fx.setAttribute('aria-hidden','true');
    for(let i=0;i<14;i++){
      const spark=document.createElement('i');
      spark.style.setProperty('--x',`${(i*37)%100}%`);
      spark.style.setProperty('--delay',`${(i%7)*-0.17}s`);
      spark.style.setProperty('--drift',`${((i%5)-2)*18}px`);
      fx.append(spark);
    }

    frame.append(bg,wash,jack,lead,fx);
    this.stage.append(frame);
    this.bg=bg;
    this.jack=jack;
    this.lead=lead;
    this.fx=fx;
  }

  private renderBeat(animate=true){
    if(!this.current||!this.jack||!this.lead)return;
    const beat=this.current.beats[this.beat];
    this.jack.src=pose(`jack-row${this.current.jackRow}`,beat.jackPose);
    this.lead.src=pose(`woman-row${this.current.leadRow}`,beat.leadPose);
    this.stage.dataset.shot=beat.shot;
    this.stage.dataset.speaker=beat.speaker==='JACK'?'jack':beat.speaker===this.current.leadName?'lead':'narrator';
    this.query('#cutscene-speaker').textContent=beat.speaker;
    this.query('#cutscene-line').textContent=beat.line;
    this.query<HTMLButtonElement>('#cutscene-next').textContent=this.beat===this.current.beats.length-1?'CONTINUE THE BAD IDEA':'NEXT INDISCRETION';

    if(animate&&!this.reducedMotion){
      const card=this.query('.cutscene-copy');
      card.getAnimations().forEach(animation=>animation.cancel());
      card.animate(
        [
          {opacity:.35,transform:'translate3d(24px,8px,0) rotate(.5deg)'},
          {opacity:1,transform:'translate3d(0,0,0) rotate(0deg)'}
        ],
        {duration:240,easing:'cubic-bezier(.2,.8,.2,1)'}
      );
      this.stage.classList.remove('cutscene-beat');
      void this.stage.offsetWidth;
      this.stage.classList.add('cutscene-beat');
    }
  }

  private advance(){
    if(!this.current)return;
    if(this.beat<this.current.beats.length-1){
      this.beat++;
      this.renderBeat();
      if('vibrate' in navigator)navigator.vibrate(8);
      return;
    }
    this.finish();
  }

  private tipStage(){
    if(this.current?.id!==0)return;
    this.tipTotal+=20;
    this.query<HTMLButtonElement>('#cutscene-tip').textContent=`$${this.tipTotal} TIPPED • AGAIN`;
    this.query('#cutscene-speaker').textContent='HOUSE MC';
    this.query('#cutscene-line').textContent=this.tipTotal>=100
      ?'Roxi pockets the cash, blows Jack a kiss and tells security to keep the idiot hydrated. The rail loses its collective mind.'
      :'Roxi snatches the note out of the air, turns slow enough to bankrupt common sense, and mouths “again” at Jack.';
    this.lead?.classList.remove('tip-pop');
    if(this.lead){void this.lead.offsetWidth;this.lead.classList.add('tip-pop')}
    this.cashBurst();
    if('vibrate' in navigator)navigator.vibrate([12,24,12]);
  }

  private cashBurst(){
    if(!this.fx)return;
    for(let i=0;i<18;i++){
      const note=document.createElement('b');
      note.className='cutscene-cash';
      note.textContent='$';
      note.style.left=`${18+(i*31)%70}%`;
      note.style.top=`${8+(i*47)%55}%`;
      note.style.setProperty('--cash-x',`${((i%7)-3)*22}px`);
      note.style.setProperty('--cash-r',`${(i%2?1:-1)*(25+(i%5)*17)}deg`);
      note.style.animationDelay=`${(i%6)*35}ms`;
      this.fx.append(note);
      window.setTimeout(()=>note.remove(),1250);
    }
  }

  private finish(){
    if(this.root.classList.contains('gone')&&!this.resolve)return;
    this.root.classList.add('gone');
    document.body.classList.remove('cutscene-active');
    this.current=undefined;
    this.stage.removeAttribute('data-shot');
    this.stage.removeAttribute('data-speaker');
    this.stage.replaceChildren();
    this.bg=this.jack=this.lead=undefined;
    this.fx=undefined;
    const resolve=this.resolve;
    this.resolve=undefined;
    resolve?.();
  }
}
