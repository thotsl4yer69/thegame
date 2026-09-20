import Phaser from 'phaser';
import {DIFFICULTIES,ENEMIES,EnemyKey,STAGES} from './data';
import type {FilthyAudio} from './audio';
import {recordClear,unlockAchievement,unlockGalleryEntry} from './progression';
import type {CampaignReward} from './campaign';

type DifficultyKey=keyof typeof DIFFICULTIES;
type EnemyState='approach'|'telegraph'|'recover'|'stunned';
type Foe=Phaser.Physics.Arcade.Sprite&{
  kind:EnemyKey;hp:number;maxHp:number;damage:number;worth:number;speed:number;boss:boolean;dead:boolean;
  ai:EnemyState;nextAttack:number;attackAt:number;recoverUntil:number;stunnedUntil:number;
  slotX:number;slotY:number;shadow?:Phaser.GameObjects.Ellipse;barBg?:Phaser.GameObjects.Rectangle;bar?:Phaser.GameObjects.Rectangle;telegraph?:Phaser.GameObjects.Ellipse;
};
type Breakable=Phaser.GameObjects.Image&{hp:number;cash:number;label:string;broken:boolean};
type RunState={stage:number;wave:number;hp:number;maxHp:number;high:number;packets:number;cash:number;score:number;combo:number;kills:number;damageTaken:number;startedAt:number;upgrades:Set<string>;weapon:string;weaponHits:number};
type Encounter={x:number;title:string;enemies:EnemyKey[];boss?:EnemyKey};
type AttackDef={duration:number;hitAt:number;rangeX:number;rangeY:number;damage:number;knock:number;lunge:number;frame:number};

const WORLD_W=6200;
const FLOOR_TOP=405;
const FLOOR_BOTTOM=625;
const PLAYER_SPEED=285;
const ZONES=[
  {start:0,end:1500,name:'QUEUE & ENTRY',subtitle:'VELVET ROPE • FLASH PHOTOGRAPHY',tint:0xff4aa8,floor:0x25091f},
  {start:1500,end:3000,name:'MAIN FLOOR',subtitle:'BASS • GLITTER • BAD SPACING',tint:0xb64aff,floor:0x170b2a},
  {start:3000,end:4550,name:'VIP CORRIDOR',subtitle:'MIRRORS • GOLD • NO REFUNDS',tint:0xffc247,floor:0x24150a},
  {start:4550,end:WORLD_W,name:"OWNER'S BOOTH",subtitle:'PRIVATE • EXPENSIVE • HOSTILE',tint:0xff315e,floor:0x26080e}
] as const;
const ENCOUNTERS:Encounter[]=[
  {x:980,title:'FRONT DOOR SHAKEDOWN',enemies:['lexi','roxi']},
  {x:2280,title:'MAIN FLOOR',enemies:['lexi','lola','roxi']},
  {x:3680,title:'VIP CORRIDOR',enemies:['lola','lexi','roxi']},
  {x:5060,title:"OWNER'S BOOTH",enemies:['lexi'],boss:'chad'}
];

export class GameScene extends Phaser.Scene{
  audio:FilthyAudio;
  auto=false;
  difficultyKey:DifficultyKey='cooked';
  player!:Phaser.Physics.Arcade.Sprite;
  playerShadow!:Phaser.GameObjects.Ellipse;
  highAura!:Phaser.GameObjects.Ellipse;
  foes!:Phaser.Physics.Arcade.Group;
  background!:Phaser.GameObjects.TileSprite;
  midground!:Phaser.GameObjects.TileSprite;
  floorGlow!:Phaser.GameObjects.Rectangle;
  breakables:Breakable[]=[];
  currentZone=-1;

  cursors!:Phaser.Types.Input.Keyboard.CursorKeys;
  keys!:Record<string,Phaser.Input.Keyboard.Key>;
  touch:Record<string,boolean>={};

  state!:RunState;
  ready=false;
  running=false;
  paused=false;
  transition=false;
  invulnerableUntil=0;
  stunnedUntil=0;
  nextHudAt=0;
  nextPlayerHit=0;
  activeBoss?:Foe;

  encounterIndex=0;
  encounterActive=false;
  encounterSpawning=false;
  leftGate?:Phaser.GameObjects.Rectangle;
  rightGate?:Phaser.GameObjects.Rectangle;
  levelObjects:Phaser.GameObjects.GameObject[]=[];

  attack?:AttackDef;
  attackStarted=0;
  attackHit=false;
  comboStep=0;
  lastComboAttack=0;
  queuedAttack='';
  queuedUntil=0;
  nextDashAt=0;
  facing=1;

  campaignRouteLabel='QUALITY SLICE';
  campaignThreat=0;
  pendingCampaignReward:CampaignReward={};
  stageStartKills=0;
  stageStartDamage=0;
  stageStartScore=0;

  constructor(audio:FilthyAudio){super('Game');this.audio=audio}
  init(data:{auto?:boolean}){this.auto=!!data?.auto;this.running=false}

  preload(){
    for(let r=0;r<4;r++)for(let i=1;i<=4;i++)this.load.image(`jack${r}-${i}`,`assets/characters/jack-row${r}/0${i}.png`);
    for(let r=0;r<8;r++)for(let i=1;i<=4;i++)this.load.image(`woman${r}-${i}`,`assets/characters/woman-row${r}/0${i}.png`);
    for(let r=0;r<4;r++)for(let i=1;i<=4;i++)this.load.image(`man${r}-${i}`,`assets/enemies/man-row${r}/0${i}.png`);
    for(let r=0;r<4;r++)for(let i=1;i<=4;i++)this.load.image(`prop${r}-${i}`,`assets/props/row${r}/0${i}.png`);
    this.load.image('bg-club','assets/backgrounds/pink-pigeon.webp');
  }

  create(){
    this.physics.world.gravity.y=0;
    this.physics.world.setBounds(0,FLOOR_TOP,WORLD_W,FLOOR_BOTTOM-FLOOR_TOP);
    this.cameras.main.setBounds(0,0,WORLD_W,720).setBackgroundColor('#090509');

    this.background=this.add.tileSprite(0,0,WORLD_W,720,'bg-club').setOrigin(0).setScrollFactor(.08,1).setDepth(-30).setAlpha(.78);
    this.midground=this.add.tileSprite(0,0,WORLD_W,720,'bg-club').setOrigin(0).setScrollFactor(.36,1).setDepth(-24).setAlpha(.2).setTint(0xff44aa);
    this.floorGlow=this.add.rectangle(WORLD_W/2,615,WORLD_W,220,0x120713,.72).setDepth(-8);
    this.add.rectangle(WORLD_W/2,FLOOR_TOP-4,WORLD_W,3,0xff269c,.35).setDepth(-7);
    this.add.rectangle(WORLD_W/2,FLOOR_BOTTOM+8,WORLD_W,5,0x19ead8,.25).setDepth(-7);

    this.foes=this.physics.add.group({allowGravity:false});
    this.player=this.physics.add.sprite(220,540,'jack0-1').setScale(.78).setDepth(540).setCollideWorldBounds(true).setActive(false).setVisible(false);
    this.configureBody(this.player,62,92);
    this.playerShadow=this.add.ellipse(220,600,92,22,0x000000,.46).setDepth(1).setVisible(false);
    this.highAura=this.add.ellipse(220,540,116,184,0x19ead8,0).setBlendMode(Phaser.BlendModes.ADD).setDepth(2).setVisible(false);

    this.physics.add.collider(this.foes,this.foes);
    this.physics.add.overlap(this.player,this.foes,(_,foe)=>this.contact(foe as Foe));

    this.cameras.main.startFollow(this.player,true,.12,.18);
    this.cameras.main.setDeadzone(170,90);
    this.cameras.main.setFollowOffset(-125,0);

    this.cursors=this.input.keyboard!.createCursorKeys();
    this.keys=this.input.keyboard!.addKeys('W,A,S,D,J,H,SHIFT,ESC') as Record<string,Phaser.Input.Keyboard.Key>;
    const touch=(action:string,down:boolean)=>{this.touch[action]=down;if(down)this.action(action)};
    const autopause=()=>{if(!this.paused&&this.player.active)this.togglePause()};
    this.game.events.on('touch',touch);this.game.events.on('autopause',autopause);
    this.events.once('shutdown',()=>{this.game.events.off('touch',touch);this.game.events.off('autopause',autopause)});

    this.buildLevelArt();
    this.resetState();
    this.ready=true;
    if(this.auto)this.time.delayedCall(100,()=>this.startRun());
  }

  setDifficulty(key:string){if(key in DIFFICULTIES)this.difficultyKey=key as DifficultyKey}
  setCampaignRoute(label:string,threat:number,reward:CampaignReward={}){this.campaignRouteLabel=label;this.campaignThreat=Math.max(0,Math.min(2,Math.round(threat)));this.pendingCampaignReward={...reward}}

  resetState(){
    this.state={stage:0,wave:0,hp:100,maxHp:100,high:0,packets:0,cash:0,score:0,combo:0,kills:0,damageTaken:0,startedAt:Date.now(),upgrades:new Set(),weapon:'FISTS',weaponHits:0};
  }

  startRun(){
    if(!this.ready){this.auto=true;return}
    if(this.running)return;
    this.running=true;this.paused=false;this.transition=false;
    this.encounterIndex=0;this.encounterActive=false;this.encounterSpawning=false;
    this.player.setActive(true).setVisible(true).setPosition(220,535).setVelocity(0).setAlpha(1).clearTint();
    this.playerShadow.setVisible(true);this.highAura.setVisible(true);
    this.applyCampaignReward();
    this.stageStartKills=this.state.kills;this.stageStartDamage=this.state.damageTaken;this.stageStartScore=this.state.score;
    this.physics.resume();this.cameras.main.setScroll(0,0);
    this.game.events.emit('venueIntro',{act:'QUALITY SLICE',name:'THE PINK PIGEON',line:'BELT-SCROLL COMBAT REBUILD • READABLE, FAIR, RESPONSIVE'});
    this.audio.stage(0);this.emitHud();
  }

  applyCampaignReward(){
    const r=this.pendingCampaignReward;
    this.state.hp=Math.max(1,Math.min(this.state.maxHp,this.state.hp+(r.hp??0)));
    this.state.high=Math.max(0,Math.min(100,this.state.high+(r.high??0)));
    this.state.cash=Math.max(0,this.state.cash+(r.cash??0));
    this.pendingCampaignReward={};
  }

  update(time:number,delta:number){
    if(!this.ready||!this.running)return;
    if(Phaser.Input.Keyboard.JustDown(this.keys.ESC)){this.togglePause();return}
    if(this.paused||this.transition||!this.player.active)return;

    this.updatePlayer(time,delta);
    this.updateAttack(time);
    this.updateEnemies(time,delta);
    this.updateEncounter();
    this.updatePresentation(time);

    if(this.state.combo>0&&time>this.lastComboAttack+1250){this.state.combo=0}
    if(time>=this.nextHudAt){this.nextHudAt=time+90;this.emitHud()}
  }

  updatePlayer(time:number,delta:number){
    const stunned=time<this.stunnedUntil;
    const left=!stunned&&(this.cursors.left.isDown||this.keys.A.isDown||this.touch.left);
    const right=!stunned&&(this.cursors.right.isDown||this.keys.D.isDown||this.touch.right);
    const up=!stunned&&(this.cursors.up.isDown||this.keys.W.isDown||this.touch.up);
    const down=!stunned&&(this.cursors.down.isDown||this.keys.S.isDown||this.touch.down);
    let x=(right?1:0)-(left?1:0),y=(down?1:0)-(up?1:0);
    if(x||y){const len=Math.hypot(x,y)||1;x/=len;y/=len}
    const dt=Math.min(.05,delta/1000),body=this.player.body as Phaser.Physics.Arcade.Body;
    const attacking=!!this.attack;
    const speed=PLAYER_SPEED*(attacking?.38:1);
    const approach=(value:number,target:number,step:number)=>value<target?Math.min(value+step,target):Math.max(value-step,target);
    if(time>=this.invulnerableUntil){
      body.setVelocityX(approach(body.velocity.x,x*speed,(x?2200:3000)*dt));
      body.setVelocityY(approach(body.velocity.y,y*speed*.72,(y?1800:2600)*dt));
    }
    if(x!==0){this.facing=x>0?1:-1;this.player.setFlipX(this.facing<0)}
    if(!attacking&&time>=this.stunnedUntil){
      if(Math.abs(body.velocity.x)>20||Math.abs(body.velocity.y)>18)this.player.play('jack-run',true);
      else this.player.play('jack-idle',true);
    }
    this.player.y=Phaser.Math.Clamp(this.player.y,FLOOR_TOP+42,FLOOR_BOTTOM-12);
    this.player.setDepth(Math.round(this.player.y));
    if(Phaser.Input.Keyboard.JustDown(this.keys.J))this.action('hit');
    if(Phaser.Input.Keyboard.JustDown(this.keys.H))this.action('heavy');
    if(Phaser.Input.Keyboard.JustDown(this.keys.SHIFT))this.action('dash');
  }

  action(action:string){
    if(action==='pause'){this.togglePause();return}
    if(!this.running||this.paused||this.transition||this.time.now<this.stunnedUntil)return;
    if(action==='jump'||action==='up'||action==='down'||action==='left'||action==='right')return;
    if(this.attack&&(action==='hit'||action==='heavy')){this.queuedAttack=action;this.queuedUntil=this.time.now+210;return}
    if(action==='hit')this.lightAttack();
    if(action==='heavy')this.heavyAttack();
    if(action==='dash')this.dash();
  }

  lightAttack(){
    if(this.attack)return;
    const now=this.time.now;
    this.comboStep=now-this.lastComboAttack<430?(this.comboStep%3)+1:1;
    this.lastComboAttack=now;
    const defs:AttackDef[]=[
      {duration:165,hitAt:55,rangeX:112,rangeY:66,damage:1,knock:135,lunge:72,frame:1},
      {duration:180,hitAt:62,rangeX:124,rangeY:70,damage:1.25,knock:170,lunge:82,frame:2},
      {duration:250,hitAt:88,rangeX:154,rangeY:78,damage:2.2,knock:330,lunge:120,frame:4}
    ];
    this.startAttack(defs[this.comboStep-1]);
  }

  heavyAttack(){
    if(this.attack)return;
    const money=this.state.high>=100;
    if(money){this.state.high=45;this.game.events.emit('debauchery',{name:'MONEY SHOT'});this.audio.special()}
    this.startAttack({duration:money?410:360,hitAt:money?190:165,rangeX:money?220:172,rangeY:money?100:86,damage:money?6.5:3.4,knock:money?620:430,lunge:money?130:95,frame:3});
  }

  startAttack(def:AttackDef){
    this.attack=def;this.attackStarted=this.time.now;this.attackHit=false;
    this.player.setTexture(`jack2-${def.frame}`);
    this.player.setVelocityX(this.facing*def.lunge);
    this.player.setVelocityY(0);
  }

  updateAttack(time:number){
    if(!this.attack)return;
    const elapsed=time-this.attackStarted;
    if(!this.attackHit&&elapsed>=this.attack.hitAt){
      this.attackHit=true;
      const hits=this.strike(this.attack);
      if(hits&&this.attack.damage>=2){this.cameras.main.shake(70,.0045);this.hitStop(34)}
    }
    if(elapsed>=this.attack.duration){
      this.attack=undefined;this.player.play('jack-idle',true);
      const queued=this.queuedUntil>=time?this.queuedAttack:'';
      this.queuedAttack='';this.queuedUntil=0;
      if(queued)this.time.delayedCall(0,()=>this.action(queued));
    }
  }

  strike(def:AttackDef){
    let hits=0;
    this.foes.children.each(obj=>{
      const foe=obj as Foe;
      if(!foe.active||foe.dead)return true;
      const dx=foe.x-this.player.x,dy=Math.abs(foe.y-this.player.y);
      if(Math.sign(dx||this.facing)===this.facing&&Math.abs(dx)<=def.rangeX&&dy<=def.rangeY){
        this.hitFoe(foe,def.damage,this.facing*def.knock);hits++;
      }
      return true;
    });
    if(hits){
      this.state.combo=Math.min(99,this.state.combo+hits);
      this.state.high=Math.min(100,this.state.high+5*hits);
      this.lastComboAttack=this.time.now;
      if(this.comboStep===3)this.game.events.emit('debauchery',{name:'THREE-PIECE FINISHER'});
    }
    return hits;
  }

  dash(){
    const now=this.time.now;if(now<this.nextDashAt)return;
    this.nextDashAt=now+520;this.invulnerableUntil=now+210;
    const left=this.cursors.left.isDown||this.keys.A.isDown||this.touch.left;
    const right=this.cursors.right.isDown||this.keys.D.isDown||this.touch.right;
    const up=this.cursors.up.isDown||this.keys.W.isDown||this.touch.up;
    const down=this.cursors.down.isDown||this.keys.S.isDown||this.touch.down;
    let x=(right?1:0)-(left?1:0),y=(down?1:0)-(up?1:0);
    if(!x&&!y)x=this.facing;
    const len=Math.hypot(x,y)||1;x/=len;y/=len;
    this.facing=x===0?this.facing:(x>0?1:-1);this.player.setFlipX(this.facing<0);
    this.player.setAlpha(.48).setVelocity(x*560,y*370).setTexture('jack3-1');
    this.audio.dash();
    this.time.delayedCall(210,()=>{if(!this.player.active)return;this.player.setAlpha(1);this.player.setVelocity(this.player.body!.velocity.x*.35,this.player.body!.velocity.y*.35)});
  }

  updateEnemies(time:number,delta:number){
    const dt=Math.min(.05,delta/1000);
    this.foes.children.each(obj=>{
      const foe=obj as Foe;if(!foe.active||foe.dead)return true;
      foe.setDepth(Math.round(foe.y));foe.shadow?.setPosition(foe.x,foe.y+62);
      foe.barBg?.setPosition(foe.x,foe.y-94);foe.bar?.setPosition(foe.x-25,foe.y-94);

      if(time<foe.stunnedUntil){foe.ai='stunned';foe.setVelocity(foe.body!.velocity.x*.78,foe.body!.velocity.y*.78);return true}
      if(foe.ai==='stunned')foe.ai='approach';

      const dx=this.player.x-foe.x,dy=this.player.y-foe.y,adX=Math.abs(dx),adY=Math.abs(dy);
      foe.setFlipX(dx<0);

      if(foe.ai==='telegraph'){
        foe.setVelocity(0);
        if(time>=foe.attackAt){
          foe.clearTint();
          if(adX<112&&adY<70)this.hurt(foe.damage,foe.x);
          foe.setVelocityX(Math.sign(dx||1)*140);
          foe.ai='recover';foe.recoverUntil=time+(foe.boss?480:620);
        }
        return true;
      }
      if(foe.ai==='recover'){
        foe.setVelocity(foe.body!.velocity.x*.84,foe.body!.velocity.y*.84);
        if(time>=foe.recoverUntil){foe.ai='approach';foe.nextAttack=time+(foe.boss?550:900)}
        return true;
      }

      const desiredX=this.player.x+foe.slotX,desiredY=Phaser.Math.Clamp(this.player.y+foe.slotY,FLOOR_TOP+50,FLOOR_BOTTOM-20);
      const sx=desiredX-foe.x,sy=desiredY-foe.y;
      const close=adX<105&&adY<62;
      if(close&&time>=foe.nextAttack){
        foe.ai='telegraph';foe.attackAt=time+(foe.boss?300:390);
        foe.setTint(foe.boss?0xff4d87:0xffcf4d);
        foe.setTexture(`${ENEMIES[foe.kind].sprite}-3`);
        return true;
      }
      const len=Math.hypot(sx,sy)||1;
      const speed=foe.speed*(foe.boss?1.05:1);
      foe.setVelocity(sx/len*speed,sy/len*speed*.74);
      foe.play(`${ENEMIES[foe.kind].sprite}-walk`,true);
      foe.x+=Math.sign(sx)*Math.min(0.35,Math.abs(sx)*dt*.03);
      return true;
    });
  }

  hitFoe(foe:Foe,damage:number,knock:number){
    if(foe.dead)return;
    foe.hp-=damage;foe.ai='stunned';foe.stunnedUntil=this.time.now+(foe.boss?110:Math.min(330,160+damage*34));foe.nextAttack=foe.stunnedUntil+350;
    foe.setVelocity(knock,Phaser.Math.Between(-35,35)).setTintFill(0xffffff);
    this.time.delayedCall(60,()=>foe.active&&foe.clearTint());
    if(foe.bar)foe.bar.setScale(Math.max(0,foe.hp/foe.maxHp),1);
    this.impact(foe.x,foe.y-35);this.audio.hit(damage>=2);
    if(foe.boss)this.emitHud();
    if(foe.hp<=0)this.defeat(foe);
  }

  contact(foe:Foe){
    if(foe.dead||this.time.now<this.nextPlayerHit||this.time.now<this.invulnerableUntil)return;
    if(foe.ai==='recover'&&Math.abs(foe.body!.velocity.x)>100)this.hurt(foe.damage*.6,foe.x);
  }

  hurt(amount:number,sourceX:number){
    const now=this.time.now;
    if(now<this.nextPlayerHit||now<this.invulnerableUntil)return;
    this.nextPlayerHit=now+760;this.invulnerableUntil=now+620;this.stunnedUntil=now+260;
    this.state.hp=Math.max(0,this.state.hp-amount);this.state.damageTaken+=amount;this.state.high=Math.max(0,this.state.high-12);this.state.combo=0;
    this.player.setTintFill(0xff355c).setVelocity((this.player.x<sourceX?-1:1)*250,0);
    this.cameras.main.shake(95,.007);this.audio.hurt();
    this.time.delayedCall(95,()=>this.player.active&&this.player.clearTint());
    if(this.state.hp<=0)this.die();
  }

  spawnFoe(kind:EnemyKey,boss=false,x?:number,y?:number,slot=0){
    const spec=ENEMIES[kind],diff=DIFFICULTIES[this.difficultyKey];
    const row=Number(spec.sprite.replace(/\D/g,'')),prefix=spec.sprite.startsWith('woman')?'woman':'man';
    const hp=Math.ceil(spec.hp*(boss?3.2:1)*diff.hp),scale=spec.scale*(boss?1.12:1);
    const foe=this.foes.create(x??this.player.x+500,y??520,`${prefix}${row}-1`) as Foe;
    Object.assign(foe,{kind,hp,maxHp:hp,damage:spec.damage*(boss?1.12:1)*diff.damage,worth:spec.worth*(boss?4:1),speed:Phaser.Math.Clamp(spec.speed+25,105,155),boss,dead:false,ai:'approach' as EnemyState,nextAttack:this.time.now+900+slot*220,attackAt:0,recoverUntil:0,stunnedUntil:0,slotX:(slot%2===0?1:-1)*(80+Math.floor(slot/2)*42),slotY:(slot%3-1)*42});
    foe.setScale(scale).setCollideWorldBounds(true).setDepth(Math.round(foe.y));
    this.configureBody(foe,58,88);
    foe.shadow=this.add.ellipse(foe.x,foe.y+62,82*scale,18,0x000000,.42).setDepth(1);
    foe.barBg=this.add.rectangle(foe.x,foe.y-94,54,7,0x130914,.92).setStrokeStyle(1,0xffffff,.65).setDepth(900);
    foe.bar=this.add.rectangle(foe.x-25,foe.y-94,50,3,boss?0xffd229:0xff269c).setOrigin(0,.5).setDepth(901);
    foe.play(`${prefix}${row}-walk`);
    if(boss){
      this.activeBoss=foe;
      this.game.events.emit('bossIntro',{name:spec.name,line:'YOU MADE IT TO THE BOOTH. BAD NEWS: SO DID I.',image:`assets/enemies/man-row${row}/01.png`});
    }
    return foe;
  }

  updateEncounter(){
    if(this.encounterActive){
      if(!this.encounterSpawning&&this.foes.countActive(true)===0)this.clearEncounter();
      return;
    }
    if(this.encounterIndex>=ENCOUNTERS.length){
      if(this.player.x>WORLD_W-360)this.finish();
      return;
    }
    const next=ENCOUNTERS[this.encounterIndex];
    if(this.player.x>=next.x)this.startEncounter(next);
  }

  startEncounter(enc:Encounter){
    this.encounterActive=true;this.encounterSpawning=true;this.state.wave=this.encounterIndex;
    this.game.events.emit('debauchery',{name:enc.title});this.toast(`${enc.title} • READ THE TELEGRAPHS`,900);
    this.makeGates(Math.max(120,enc.x-300),Math.min(WORLD_W-120,enc.x+720));
    let slot=0;
    const roster=[...enc.enemies];
    const maxEnemies=this.difficultyKey==='feral'?Math.min(4,roster.length):Math.min(3,roster.length);
    for(const kind of roster.slice(0,maxEnemies)){
      const s=slot++;this.time.delayedCall(s*220,()=>this.spawnFoe(kind,false,enc.x+260+s*95,495+(s%3)*45,s));
    }
    if(enc.boss){const s=slot++;this.time.delayedCall(s*250,()=>this.spawnFoe(enc.boss!,true,enc.x+440,520,s))}
    this.time.delayedCall(slot*250+100,()=>{this.encounterSpawning=false});
    this.emitHud();
  }

  makeGates(left:number,right:number){
    this.leftGate=this.add.rectangle(left,515,18,235,0xff269c,.16).setStrokeStyle(2,0xffd229,.9).setDepth(950);
    this.rightGate=this.add.rectangle(right,515,18,235,0xff269c,.16).setStrokeStyle(2,0xffd229,.9).setDepth(950);
    this.physics.add.existing(this.leftGate,true);this.physics.add.existing(this.rightGate,true);
    this.physics.add.collider(this.player,this.leftGate);this.physics.add.collider(this.player,this.rightGate);
    this.levelObjects.push(this.add.text(left,382,'FIGHT',{fontFamily:'Black Ops One',fontSize:'11px',color:'#ffd229',stroke:'#000',strokeThickness:4}).setOrigin(.5).setDepth(951));
    this.levelObjects.push(this.add.text(right,382,'FIGHT',{fontFamily:'Black Ops One',fontSize:'11px',color:'#ffd229',stroke:'#000',strokeThickness:4}).setOrigin(.5).setDepth(951));
  }

  clearEncounter(){
    const enc=ENCOUNTERS[this.encounterIndex];
    this.encounterActive=false;this.leftGate?.destroy();this.rightGate?.destroy();this.leftGate=this.rightGate=undefined;
    this.encounterIndex++;this.state.wave=this.encounterIndex;this.activeBoss=undefined;
    this.state.hp=Math.min(this.state.maxHp,this.state.hp+6);
    this.toast(`${enc.title} CLEARED • MOVE RIGHT →`,1000);this.cameras.main.flash(100,255,210,40);
    if(this.encounterIndex>=ENCOUNTERS.length){
      const exit=this.add.text(WORLD_W-440,520,'EXIT →',{fontFamily:'Black Ops One',fontSize:'42px',color:'#ffd229',stroke:'#ff269c',strokeThickness:6}).setDepth(900);
      this.levelObjects.push(exit);this.tweens.add({targets:exit,alpha:{from:.35,to:1},duration:430,yoyo:true,repeat:-1});
    }
    this.emitHud();
  }

  defeat(foe:Foe){
    if(foe.dead)return;foe.dead=true;
    const spec=ENEMIES[foe.kind];this.state.kills++;this.state.score+=Math.round(foe.worth*(1+this.state.combo*.05));this.state.cash+=10;this.state.high=Math.min(100,this.state.high+8);
    if(spec.sprite.startsWith('woman')&&unlockGalleryEntry(foe.kind))this.game.events.emit('achievement',{name:`${spec.name} — DOSSIER`});
    foe.bar?.destroy();foe.barBg?.destroy();foe.shadow?.destroy();
    foe.setVelocity((foe.x<this.player.x?-1:1)*260,Phaser.Math.Between(-80,80)).setAngularVelocity(Phaser.Math.Between(-120,120)).setTexture(`${spec.sprite}-4`);
    this.time.delayedCall(380,()=>foe.destroy());
  }

  updatePresentation(time:number){
    this.playerShadow.setPosition(this.player.x,this.player.y+62).setDepth(Math.max(1,Math.round(this.player.y)-2));
    this.highAura.setPosition(this.player.x,this.player.y).setDepth(Math.max(2,Math.round(this.player.y)-1)).setAlpha(this.state.high>=60?.05+this.state.high/600:0).setScale(.92+Math.sin(time/150)*.035);
  }

  buildLevelArt(){
    const signs=['NO PHOTOS','VIP','TIPS FIRST','BAD IDEAS','PRIVATE','BOTTLE SERVICE','STAFF ONLY'];
    for(let x=360,i=0;x<WORLD_W;x+=500,i++){
      const sign=this.add.text(x,Phaser.Math.Between(120,250),signs[i%signs.length],{fontFamily:'Black Ops One',fontSize:i%2?'22px':'30px',color:i%3?'#ff70bd':'#ffd229',stroke:'#090509',strokeThickness:7}).setDepth(-10).setAlpha(.78);
      this.levelObjects.push(sign);
      if(i%2===0){
        const prop=this.add.image(x+180,590,`prop${i%4}-${(i%4)+1}`).setScale(.18).setAlpha(.7).setDepth(0);
        this.levelObjects.push(prop);
      }
    }
    for(const enc of ENCOUNTERS){
      const title=this.add.text(enc.x,340,enc.title,{fontFamily:'Black Ops One',fontSize:'15px',color:'#ffd229',stroke:'#000',strokeThickness:6}).setOrigin(.5).setAlpha(.28).setDepth(-3);
      this.levelObjects.push(title);
    }
  }

  finish(){
    if(!this.running)return;this.running=false;this.transition=true;this.physics.pause();
    if(unlockAchievement('pink-slice'))this.game.events.emit('achievement',{name:'PINK PIGEON SURVIVOR'});
    const best=recordClear(this.state.score),seconds=Math.round((Date.now()-this.state.startedAt)/1000),stageStats={score:this.state.score-this.stageStartScore,kills:this.state.kills-this.stageStartKills,damage:this.state.damageTaken-this.stageStartDamage,cash:this.state.cash};
    this.game.events.emit('ending',{score:this.state.score,cash:this.state.cash,best,kills:this.state.kills,damage:this.state.damageTaken,seconds,stageStats,difficulty:DIFFICULTIES[this.difficultyKey].name,retry:()=>this.scene.restart({auto:true})});
  }

  die(){
    if(!this.running)return;this.running=false;this.player.setActive(false);this.physics.pause();this.audio.hurt();
    this.game.events.emit('gameover',{score:this.state.score,stage:0,kills:this.state.kills,damage:this.state.damageTaken,difficulty:DIFFICULTIES[this.difficultyKey].name,retry:()=>this.scene.restart({auto:true})});
  }

  togglePause(){
    if(!this.running||!this.player.active)return;
    if(this.paused)return;
    this.paused=true;this.scene.pause();
    this.game.events.emit('pause',{resume:()=>{if(!this.paused)return;this.paused=false;this.scene.resume();this.game.events.emit('closeModal');this.game.events.emit('resumed')}});
  }

  hitStop(ms:number){const world=this.physics.world,old=world.timeScale;world.timeScale=3.3;this.time.delayedCall(ms,()=>{world.timeScale=old})}
  impact(x:number,y:number){const fx=this.add.image(x,y,'prop3-1').setScale(.18).setDepth(999);this.tweens.add({targets:fx,scale:.46,alpha:0,angle:90,duration:150,onComplete:()=>fx.destroy()})}
  configureBody(sprite:Phaser.Physics.Arcade.Sprite,w:number,h:number){sprite.setBodySize(w,h).setOffset((sprite.width-w)/2,(sprite.height-h)/2)}
  toast(text:string,duration=900){this.game.events.emit('toast',{text,duration})}

  emitHud(){
    const current=Math.min(this.encounterIndex+1,ENCOUNTERS.length),next=ENCOUNTERS[Math.min(this.encounterIndex,ENCOUNTERS.length-1)];
    this.game.events.emit('hud',{...this.state,stageData:STAGES[0],progress:{current,total:ENCOUNTERS.length,label:this.encounterActive?next?.title:(this.encounterIndex>=ENCOUNTERS.length?'EXIT':'ADVANCE'),distance:Math.max(0,Math.min(1,this.player.x/WORLD_W)),route:'QUALITY SLICE'},boss:this.activeBoss?{name:ENEMIES[this.activeBoss.kind].name,hp:this.activeBoss.hp,max:this.activeBoss.maxHp}:null});
  }

  createAnimations(){
    const add=(key:string,frames:string[],rate:number)=>{if(!this.anims.exists(key))this.anims.create({key,frames:frames.map(k=>({key:k})),frameRate:rate,repeat:-1})};
    add('jack-idle',[1,2,3,4].map(i=>`jack0-${i}`),3);
    add('jack-run',[1,2,3,4].map(i=>`jack1-${i}`),10);
    for(let r=0;r<8;r++)add(`woman${r}-walk`,[1,2].map(i=>`woman${r}-${i}`),6);
    for(let r=0;r<4;r++)add(`man${r}-walk`,[1,2].map(i=>`man${r}-${i}`),6);
  }
}
