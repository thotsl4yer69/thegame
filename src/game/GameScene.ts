import Phaser from 'phaser';
import {DIFFICULTIES,ENEMIES,EnemyKey} from './data';
import {CHAPTERS,type ChapterDef,type ChapterEncounter} from './chapters';
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
type AttackDef={duration:number;hitAt:number;rangeX:number;rangeY:number;damage:number;knock:number;lunge:number;frame:number};

const WORLD_W=6200;
const FLOOR_TOP=405;
const FLOOR_BOTTOM=625;
const PLAYER_SPEED=285;
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
  chapterIndex=0;
  chapter:ChapterDef=CHAPTERS[0];
  powerMult=1;
  speedMult=1;

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
    for(const chapter of CHAPTERS)if(!this.textures.exists(chapter.backgroundKey))this.load.image(chapter.backgroundKey,chapter.backgroundAsset);
  }

  create(){
    this.createAnimations();
    this.physics.world.gravity.y=0;
    this.physics.world.setBounds(0,FLOOR_TOP,WORLD_W,FLOOR_BOTTOM-FLOOR_TOP);
    this.cameras.main.setBounds(0,0,WORLD_W,720).setBackgroundColor('#090509');

    this.background=this.add.tileSprite(0,0,WORLD_W,720,this.chapter.backgroundKey).setOrigin(0).setScrollFactor(.08,1).setDepth(-30).setAlpha(.78);
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

    this.resetState();
    this.ready=true;
    if(this.auto)this.time.delayedCall(100,()=>this.startRun());
  }

  setDifficulty(key:string){if(key in DIFFICULTIES)this.difficultyKey=key as DifficultyKey}
  setChapter(index:number){this.chapterIndex=Phaser.Math.Clamp(index,0,CHAPTERS.length-1);this.chapter=CHAPTERS[this.chapterIndex];this.state.stage=this.chapterIndex}
  applyUpgrade(id:string){if(id==='power')this.powerMult*=1.16;else if(id==='speed')this.speedMult*=1.08;else if(id==='meat'){this.state.maxHp+=18;this.state.hp=Math.min(this.state.maxHp,this.state.hp+28)}else if(id==='high')this.state.high=Math.min(100,this.state.high+35)}
  setCampaignRoute(label:string,threat:number,reward:CampaignReward={}){this.campaignRouteLabel=label;this.campaignThreat=Math.max(0,Math.min(2,Math.round(threat)));this.pendingCampaignReward={...reward}}

  resetState(){
    this.state={stage:0,wave:0,hp:100,maxHp:100,high:0,packets:0,cash:0,score:0,combo:0,kills:0,damageTaken:0,startedAt:Date.now(),upgrades:new Set(),weapon:'FISTS',weaponHits:0};
  }

  startRun(){
    if(!this.ready){this.auto=true;return}
    if(this.running)return;
    this.startChapter(this.chapterIndex);
  }

  startChapter(index:number,reward:CampaignReward=this.pendingCampaignReward){
    this.clearChapter();
    this.setChapter(index);
    this.pendingCampaignReward={...reward};
    this.running=true;this.paused=false;this.transition=false;
    this.encounterIndex=0;this.encounterActive=false;this.encounterSpawning=false;this.currentZone=-1;this.activeBoss=undefined;
    this.background.setTexture(this.chapter.backgroundKey).clearTint();
    this.midground.setTexture(this.chapter.backgroundKey).clearTint();
    this.player.setActive(true).setVisible(true).setPosition(220,535).setVelocity(0).setAlpha(1).clearTint();
    this.playerShadow.setVisible(true);this.highAura.setVisible(true);
    this.applyCampaignReward();
    this.stageStartKills=this.state.kills;this.stageStartDamage=this.state.damageTaken;this.stageStartScore=this.state.score;
    this.physics.resume();this.cameras.main.setScroll(0,0);
    this.buildLevelArt();
    this.game.events.emit('venueIntro',{act:this.chapter.act,name:this.chapter.name,line:`${this.chapter.district} • ${this.chapter.intro}`});
    this.audio.stage(this.chapterIndex%4);this.emitHud();
  }

  clearChapter(){
    this.leftGate?.destroy();this.rightGate?.destroy();this.leftGate=this.rightGate=undefined;
    this.foes?.children.each(obj=>{const foe=obj as Foe;foe.shadow?.destroy();foe.telegraph?.destroy();foe.bar?.destroy();foe.barBg?.destroy();obj.destroy();return true});
    this.levelObjects.forEach(obj=>obj.destroy());this.levelObjects=[];this.breakables=[];this.encounterActive=false;this.encounterSpawning=false;
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
    const speed=PLAYER_SPEED*this.speedMult*(attacking?.38:1);
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
    this.attackArc(def);
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
        this.hitFoe(foe,def.damage*this.powerMult,this.facing*def.knock);hits++;
      }
      return true;
    });
    for(const prop of this.breakables){
      if(prop.broken||!prop.active)continue;
      const dx=prop.x-this.player.x,dy=Math.abs(prop.y-this.player.y);
      if(Math.sign(dx||this.facing)===this.facing&&Math.abs(dx)<=def.rangeX+38&&dy<=def.rangeY+30){
        this.hitBreakable(prop,def.damage);hits++;
      }
    }
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
        if(foe.telegraph){
          const remain=Math.max(0,foe.attackAt-time),p=1-remain/(foe.boss?300:390);
          foe.telegraph.setPosition(foe.x,foe.y+56).setScale(.9+p*.45).setAlpha(.2+p*.62);
        }
        if(time>=foe.attackAt){
          foe.clearTint();foe.telegraph?.setVisible(false);
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
        foe.telegraph?.setVisible(true).setPosition(foe.x,foe.y+56).setScale(.9).setAlpha(.2);
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
    foe.telegraph=this.add.ellipse(foe.x,foe.y+56,112*scale,44,0xffd229,.08).setStrokeStyle(4,boss?0xff315e:0xffd229,.95).setDepth(2).setVisible(false);
    foe.barBg=this.add.rectangle(foe.x,foe.y-94,54,7,0x130914,.92).setStrokeStyle(1,0xffffff,.65).setDepth(900);
    foe.bar=this.add.rectangle(foe.x-25,foe.y-94,50,3,boss?0xffd229:0xff269c).setOrigin(0,.5).setDepth(901);
    foe.play(`${prefix}${row}-walk`);
    if(boss){
      this.activeBoss=foe;
      const image=prefix==='woman'?`assets/characters/woman-row${row}/01.png`:`assets/enemies/man-row${row}/01.png`;
      this.game.events.emit('bossIntro',{name:spec.name,line:this.chapter.bossLine,image});
    }
    return foe;
  }

  updateEncounter(){
    if(this.encounterActive){
      if(!this.encounterSpawning&&this.foes.countActive(true)===0)this.clearEncounter();
      return;
    }
    if(this.encounterIndex>=this.chapter.encounters.length){
      if(this.player.x>WORLD_W-360)this.finish();
      return;
    }
    const next=this.chapter.encounters[this.encounterIndex];
    if(this.player.x>=next.x)this.startEncounter(next);
  }

  startEncounter(enc:ChapterEncounter){
    this.encounterActive=true;this.encounterSpawning=true;this.state.wave=this.encounterIndex;
    this.game.events.emit('debauchery',{name:enc.title});this.toast(`${enc.title} • READ THE TELEGRAPHS`,900);
    this.makeGates(Math.max(120,enc.x-300),Math.min(WORLD_W-120,enc.x+720));
    let slot=0;
    const roster=[...enc.enemies];
    const baseCap=this.difficultyKey==='feral'?4:3,maxEnemies=Math.min(baseCap+this.campaignThreat,roster.length);
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
    const enc=this.chapter.encounters[this.encounterIndex];
    this.encounterActive=false;this.leftGate?.destroy();this.rightGate?.destroy();this.leftGate=this.rightGate=undefined;
    this.encounterIndex++;this.state.wave=this.encounterIndex;this.activeBoss=undefined;
    this.state.hp=Math.min(this.state.maxHp,this.state.hp+6);
    this.toast(`${enc.title} CLEARED • MOVE RIGHT →`,1000);this.cameras.main.flash(100,255,210,40);
    if(this.encounterIndex>=this.chapter.encounters.length){
      const exit=this.add.text(WORLD_W-440,520,'EXIT →',{fontFamily:'Black Ops One',fontSize:'42px',color:'#ffd229',stroke:'#ff269c',strokeThickness:6}).setDepth(900);
      this.levelObjects.push(exit);this.tweens.add({targets:exit,alpha:{from:.35,to:1},duration:430,yoyo:true,repeat:-1});
    }
    this.emitHud();
  }

  defeat(foe:Foe){
    if(foe.dead)return;foe.dead=true;
    const spec=ENEMIES[foe.kind];this.state.kills++;this.state.score+=Math.round(foe.worth*(1+this.state.combo*.05));this.state.cash+=10;this.state.high=Math.min(100,this.state.high+8);
    if(spec.sprite.startsWith('woman')&&unlockGalleryEntry(foe.kind))this.game.events.emit('achievement',{name:`${spec.name} — DOSSIER`});
    foe.bar?.destroy();foe.barBg?.destroy();foe.shadow?.destroy();foe.telegraph?.destroy();
    foe.setVelocity((foe.x<this.player.x?-1:1)*260,Phaser.Math.Between(-80,80)).setAngularVelocity(Phaser.Math.Between(-120,120)).setTexture(`${spec.sprite}-4`);
    this.time.delayedCall(380,()=>foe.destroy());
  }

  updatePresentation(time:number){
    this.playerShadow.setPosition(this.player.x,this.player.y+62).setDepth(Math.max(1,Math.round(this.player.y)-2));
    this.highAura.setPosition(this.player.x,this.player.y).setDepth(Math.max(2,Math.round(this.player.y)-1)).setAlpha(this.state.high>=60?.05+this.state.high/600:0).setScale(.92+Math.sin(time/150)*.035);
    const zoneIndex=this.chapter.zones.findIndex(zone=>this.player.x>=zone.start&&this.player.x<zone.end);
    if(zoneIndex!==this.currentZone&&zoneIndex>=0){
      this.currentZone=zoneIndex;
      const zone=this.chapter.zones[zoneIndex];
      this.background.setTint(zone.tint);
      this.midground.setTint(zone.tint);
      this.floorGlow.setFillStyle(zone.floor,.78);
      this.zoneBanner(zone.name,zone.subtitle);
    }
  }

  buildLevelArt(){
    if(this.chapter.theme!=='club'){this.buildDistrictArt();return}
    const zoneColors=this.chapter.zones.map(zone=>zone.tint);
    this.chapter.zones.forEach((zone,index)=>{
      const width=zone.end-zone.start,mid=(zone.start+zone.end)/2;
      const wash=this.add.rectangle(mid,170,width,340,zoneColors[index],.055).setDepth(-18);
      this.levelObjects.push(wash);

      const title=this.add.text(zone.start+68,104,zone.name,{
        fontFamily:'Black Ops One',fontSize:'34px',color:'#ffffff',stroke:'#090509',strokeThickness:8
      }).setDepth(-9).setAlpha(.42);
      const sub=this.add.text(zone.start+72,148,zone.subtitle,{
        fontFamily:'Oswald',fontSize:'14px',color:index===2?'#ffd229':'#ff8bc8'
      }).setDepth(-9).setAlpha(.6);
      this.levelObjects.push(title,sub);

      for(let x=zone.start+280;x<zone.end-100;x+=520){
        const column=this.add.rectangle(x,280,18,300,0x090509,.82).setStrokeStyle(3,zoneColors[index],.34).setDepth(-5);
        const lamp=this.add.circle(x,122,13,zoneColors[index],.62).setDepth(-4);
        const glow=this.add.circle(x,122,58,zoneColors[index],.08).setBlendMode(Phaser.BlendModes.ADD).setDepth(-6);
        this.levelObjects.push(column,lamp,glow);
      }

      if(index===0){
        this.decorSign(zone.start+460,238,'NO PHOTOS',0xff4aa8);
        this.decorSign(zone.start+1030,210,'TIPS FIRST',0xffd229);
        this.velvetRope(zone.start+620,545,260);
        this.addBreakable(zone.start+820,570,'prop2-2','BOTTLE TOWER',2,18);
        this.addBreakable(zone.start+1210,585,'prop1-4','TIP JAR',1,28);
      }else if(index===1){
        this.decorSign(zone.start+440,192,'MAIN STAGE',0xb64aff);
        this.decorSign(zone.start+1050,245,'CASH • GLITTER • REGRET',0xff4aa8);
        this.stagePole(zone.start+720);
        this.stagePole(zone.start+1110);
        this.dancerSilhouette(zone.start+720,390,0xff7bc7);
        this.dancerSilhouette(zone.start+1110,390,0xb98cff);
        this.ambientPerformer(zone.start+520,455,'woman0-1',false);
        this.ambientPerformer(zone.start+1320,470,'woman4-2',true);
        this.addBreakable(zone.start+560,585,'prop2-2','CHAMPAGNE BUCKET',2,22);
        this.addBreakable(zone.start+1270,575,'prop3-4','LIGHT RIG',3,34);
      }else if(index===2){
        this.decorSign(zone.start+400,190,'VIP ONLY',0xffd229);
        this.decorSign(zone.start+1100,240,'PRIVATE BOOTHS',0xff8bc8);
        this.vipBooth(zone.start+620,575,0x7a173f);
        this.vipBooth(zone.start+1110,575,0x7b5b16);
        this.ambientPerformer(zone.start+620,465,'woman5-1',false);
        this.ambientPerformer(zone.start+1110,455,'woman7-2',true);
        this.mirrorPanel(zone.start+1420,300);
        this.addBreakable(zone.start+840,585,'prop1-4','TABLE CASH',1,42);
        this.addBreakable(zone.start+1320,585,'prop2-2','BOTTLE SERVICE',2,30);
      }else{
        this.decorSign(zone.start+390,188,"OWNER'S BOOTH",0xff315e);
        this.decorSign(zone.start+1040,235,'STAFF • DRESSING ROOMS',0xff8bc8);
        this.vipBooth(zone.start+690,575,0x5d1026);
        this.ambientPerformer(zone.start+690,455,'woman1-3',true);
        this.ambientPerformer(zone.start+1060,465,'woman3-2',false);
        this.mirrorPanel(zone.start+1160,290);
        this.dressingDoor(zone.start+1450,300,'DRESSING ROOM');
        this.addBreakable(zone.start+820,580,'prop2-2','TOP-SHELF BOTTLES',3,45);
        this.addBreakable(zone.start+1360,585,'prop1-4','CHAD\'S CASH',2,69);
      }
    });

    for(const enc of this.chapter.encounters){
      const mark=this.add.text(enc.x,342,enc.title,{
        fontFamily:'Black Ops One',fontSize:'15px',color:'#ffd229',stroke:'#000',strokeThickness:6
      }).setOrigin(.5).setAlpha(.28).setDepth(-3);
      this.levelObjects.push(mark);
    }

    const foregroundXs=[1450,2980,4530,5980];
    foregroundXs.forEach((x,i)=>{
      const curtain=this.add.rectangle(x,510,110,430,i%2?0x23092b:0x290812,.78).setDepth(760);
      const trim=this.add.rectangle(x,510,8,430,i%2?0xb64aff:0xff315e,.62).setDepth(761);
      this.levelObjects.push(curtain,trim);
    });
  }

  buildDistrictArt(){
    const signsByTheme:Record<string,string[]>={
      goth:['BLACK LANTERN','NO PHOTOS','BACK ROOM','SMOKING AREA','SALEM KNOWS'],
      chapel:['GUEST LIST','MIRROR BAR','ROOFTOP','NO STORIES','FLASH ON'],
      casino:['HIGH LIMIT','HOUSE CREDIT','CAMERAS','PRIVATE','NO REFUNDS'],
      warehouse:['LOADING BAY','NO SIGNAL','RAVE FLOOR','STAFF ONLY','ROLLER DOOR'],
      dawn:['LAST TRAM','OPEN LATE','GARLIC SAUCE','MOTEL','SUNRISE']
    };
    const signs=signsByTheme[this.chapter.theme]??['MELBOURNE','AFTER DARK','KEEP MOVING'];
    this.chapter.zones.forEach((zone,index)=>{
      const width=zone.end-zone.start,mid=(zone.start+zone.end)/2,color=zone.tint;
      this.levelObjects.push(this.add.rectangle(mid,170,width,340,color,.06).setDepth(-18));
      this.levelObjects.push(this.add.text(zone.start+68,104,zone.name,{fontFamily:'Black Ops One',fontSize:'32px',color:'#fff',stroke:'#090509',strokeThickness:8}).setDepth(-9).setAlpha(.42));
      this.levelObjects.push(this.add.text(zone.start+72,146,zone.subtitle,{fontFamily:'Oswald',fontSize:'13px',color:'#ffd8ef'}).setDepth(-9).setAlpha(.55));
      for(let x=zone.start+280;x<zone.end-80;x+=500){
        this.levelObjects.push(this.add.rectangle(x,292,15,290,0x070307,.72).setStrokeStyle(3,color,.3).setDepth(-5));
        this.levelObjects.push(this.add.circle(x,138,12,color,.58).setDepth(-4));
      }
      this.decorSign(zone.start+420,200,signs[index%signs.length],color);
      this.decorSign(zone.start+1060,245,signs[(index+1)%signs.length],index===2?0xffd229:color);
      if(this.chapter.theme==='goth'){
        this.mirrorPanel(zone.start+620,300);this.dressingDoor(zone.start+1180,300,index===3?'SALEM':'BACK ROOM');
        this.ambientPerformer(zone.start+820,460,index%2?'woman2-2':'woman4-1',index%2===0);
      }else if(this.chapter.theme==='chapel'){
        this.vipBooth(zone.start+660,575,index%2?0xff4aa8:0x1b6a86);this.mirrorPanel(zone.start+1180,300);
        this.ambientPerformer(zone.start+1000,465,index%2?'woman1-2':'woman6-1',false);
      }else if(this.chapter.theme==='casino'){
        this.vipBooth(zone.start+620,575,0x7b5b16);this.vipBooth(zone.start+1110,575,0x2b2010);this.mirrorPanel(zone.start+1400,300);
        this.addBreakable(zone.start+860,580,'prop1-4','CHIPS & CASH',2,45);
      }else if(this.chapter.theme==='warehouse'){
        this.stagePole(zone.start+640);this.stagePole(zone.start+1100);this.dancerSilhouette(zone.start+850,400,color);
        this.addBreakable(zone.start+1180,580,'prop3-4','LIGHT RIG',3,38);
      }else{
        this.vipBooth(zone.start+680,575,0x542019);this.decorSign(zone.start+1220,190,index===3?'SUNRISE':'OPEN LATE',0xff7849);
        this.addBreakable(zone.start+980,580,'prop1-3','KEBAB',1,15);
      }
    });
    for(const enc of this.chapter.encounters)this.levelObjects.push(this.add.text(enc.x,342,enc.title,{fontFamily:'Black Ops One',fontSize:'15px',color:'#ffd229',stroke:'#000',strokeThickness:6}).setOrigin(.5).setAlpha(.28).setDepth(-3));
    [1450,2980,4530,5980].forEach((x,i)=>this.levelObjects.push(this.add.rectangle(x,510,100,430,i%2?0x12051a:0x17050b,.72).setDepth(760)));
  }

  decorSign(x:number,y:number,label:string,color:number){
    const panel=this.add.rectangle(x,y,label.length*13+36,46,0x050206,.82).setStrokeStyle(3,color,.75).setDepth(-4);
    const text=this.add.text(x,y,label,{fontFamily:'Black Ops One',fontSize:'18px',color:'#ffffff'}).setOrigin(.5).setDepth(-3);
    const glow=this.add.rectangle(x,y,label.length*13+52,60,color,.055).setBlendMode(Phaser.BlendModes.ADD).setDepth(-5);
    this.levelObjects.push(panel,text,glow);
  }

  velvetRope(x:number,y:number,width:number){
    const left=this.add.rectangle(x-width/2,y-45,10,94,0xd7b04b,.9).setDepth(2);
    const right=this.add.rectangle(x+width/2,y-45,10,94,0xd7b04b,.9).setDepth(2);
    const rope=this.add.rectangle(x,y-78,width,8,0xb81449,.88).setDepth(3);
    this.levelObjects.push(left,right,rope);
  }

  stagePole(x:number){
    const base=this.add.ellipse(x,603,92,20,0xffd229,.14).setStrokeStyle(2,0xffd229,.4).setDepth(0);
    const pole=this.add.rectangle(x,385,5,438,0xe9d8e2,.72).setDepth(1);
    const top=this.add.circle(x,164,8,0xffd229,.72).setDepth(1);
    this.levelObjects.push(base,pole,top);
  }

  dancerSilhouette(x:number,y:number,color:number){
    const head=this.add.circle(x,y-78,16,color,.55).setDepth(-2);
    const body=this.add.ellipse(x,y-26,42,104,color,.45).setDepth(-2);
    const legA=this.add.rectangle(x-10,y+46,13,92,color,.36).setAngle(6).setDepth(-2);
    const legB=this.add.rectangle(x+10,y+46,13,92,color,.36).setAngle(-6).setDepth(-2);
    const glow=this.add.circle(x,y-12,96,color,.045).setBlendMode(Phaser.BlendModes.ADD).setDepth(-4);
    this.levelObjects.push(head,body,legA,legB,glow);
  }

  ambientPerformer(x:number,y:number,key:string,flip:boolean){
    const performer=this.add.image(x,y,key).setScale(.58).setFlipX(flip).setAlpha(.56).setDepth(Math.round(y)-120);
    const glow=this.add.ellipse(x,y+55,80,18,0xff269c,.06).setDepth(Math.round(y)-122);
    this.levelObjects.push(performer,glow);
    this.tweens.add({targets:performer,y:y-5,angle:flip?1.4:-1.4,duration:1100+Phaser.Math.Between(0,350),yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
  }

  vipBooth(x:number,y:number,color:number){
    const back=this.add.rectangle(x,y-60,260,122,color,.6).setStrokeStyle(3,0xffd8eb,.22).setDepth(0);
    const seat=this.add.rectangle(x,y,282,48,0x120611,.95).setStrokeStyle(3,color,.7).setDepth(2);
    const table=this.add.ellipse(x,y-6,88,34,0x090509,.94).setStrokeStyle(2,0xffd229,.46).setDepth(3);
    this.levelObjects.push(back,seat,table);
  }

  mirrorPanel(x:number,y:number){
    const panel=this.add.rectangle(x,y,150,268,0x182031,.72).setStrokeStyle(5,0xffd229,.42).setDepth(-2);
    const shine=this.add.rectangle(x-30,y,12,246,0xcff7ff,.16).setAngle(8).setDepth(-1);
    this.levelObjects.push(panel,shine);
  }

  dressingDoor(x:number,y:number,label:string){
    const door=this.add.rectangle(x,y,180,292,0x160812,.92).setStrokeStyle(4,0xff315e,.7).setDepth(-2);
    const text=this.add.text(x,y-14,label,{fontFamily:'Black Ops One',fontSize:'13px',color:'#ff8bc8'}).setOrigin(.5).setDepth(-1);
    const bulbY=[y-116,y-70,y-24,y+22,y+68,y+114];
    bulbY.forEach(by=>{const a=this.add.circle(x-76,by,5,0xffd229,.65).setDepth(-1);const b=this.add.circle(x+76,by,5,0xffd229,.65).setDepth(-1);this.levelObjects.push(a,b)});
    this.levelObjects.push(door,text);
  }

  addBreakable(x:number,y:number,key:string,label:string,hp:number,cash:number){
    const prop=this.add.image(x,y,key).setScale(.25).setDepth(Math.round(y)) as Breakable;
    Object.assign(prop,{hp,cash,label,broken:false});
    this.breakables.push(prop);this.levelObjects.push(prop);
    const tag=this.add.text(x,y-72,label,{fontFamily:'Black Ops One',fontSize:'8px',color:'#ffd229',stroke:'#000',strokeThickness:4}).setOrigin(.5).setAlpha(.55).setDepth(Math.round(y)+1);
    this.levelObjects.push(tag);
  }

  hitBreakable(prop:Breakable,damage:number){
    if(prop.broken)return;
    prop.hp-=damage;prop.setTintFill(0xffffff);
    this.time.delayedCall(55,()=>prop.active&&!prop.broken&&prop.clearTint());
    this.sparkBurst(prop.x,prop.y,0xffd229);
    if(prop.hp>0)return;
    prop.broken=true;this.state.cash+=prop.cash;this.state.score+=prop.cash*8;
    this.floatLabel(prop.x,prop.y-40,`+${prop.cash} CASH`,'#ffd229');
    this.game.events.emit('debauchery',{name:`${prop.label} DESTROYED`});
    this.cameras.main.shake(70,.004);
    this.tweens.add({targets:prop,alpha:0,scaleX:.7,scaleY:.35,angle:this.facing*18,duration:180,onComplete:()=>prop.setVisible(false)});
  }

  attackArc(def:AttackDef){
    const color=def.damage>=3?0xffd229:0xff5da8;
    const start=this.facing>0?-58:122,end=this.facing>0?58:238;
    const arc=this.add.arc(this.player.x+this.facing*70,this.player.y-8,58,start,end,false,color,.04)
      .setStrokeStyle(def.damage>=3?7:4,color,.72).setDepth(999);
    this.tweens.add({targets:arc,scaleX:1.45,scaleY:1.18,alpha:0,duration:Math.min(180,def.duration),ease:'Quad.easeOut',onComplete:()=>arc.destroy()});
  }

  sparkBurst(x:number,y:number,color:number){
    for(let i=0;i<7;i++){
      const dot=this.add.circle(x,y-30,Phaser.Math.Between(2,5),color,.85).setDepth(1000);
      this.tweens.add({targets:dot,x:x+Phaser.Math.Between(-48,48),y:y-30+Phaser.Math.Between(-52,42),alpha:0,duration:Phaser.Math.Between(160,280),onComplete:()=>dot.destroy()});
    }
  }

  floatLabel(x:number,y:number,label:string,color:string){
    const text=this.add.text(x,y,label,{fontFamily:'Black Ops One',fontSize:'16px',color,stroke:'#090509',strokeThickness:5}).setOrigin(.5).setDepth(1200);
    this.tweens.add({targets:text,y:y-55,alpha:0,duration:650,ease:'Cubic.easeOut',onComplete:()=>text.destroy()});
  }

  zoneBanner(title:string,subtitle:string){
    const bg=this.add.rectangle(640,150,560,86,0x050206,.86).setScrollFactor(0).setStrokeStyle(3,0xffd229,.44).setDepth(1800).setAlpha(0);
    const h=this.add.text(640,135,title,{fontFamily:'Black Ops One',fontSize:'25px',color:'#ffffff',stroke:'#ff269c',strokeThickness:3}).setOrigin(.5).setScrollFactor(0).setDepth(1801).setAlpha(0);
    const s=this.add.text(640,169,subtitle,{fontFamily:'Oswald',fontSize:'12px',color:'#ffd229'}).setOrigin(.5).setScrollFactor(0).setDepth(1801).setAlpha(0);
    this.tweens.add({targets:[bg,h,s],alpha:1,duration:130,yoyo:true,hold:720,ease:'Quad.easeOut',onComplete:()=>{bg.destroy();h.destroy();s.destroy()}});
  }

  finish(){
    if(!this.running)return;this.running=false;this.transition=true;this.physics.pause();
    if(unlockAchievement(this.chapter.id))this.game.events.emit('achievement',{name:`${this.chapter.name} — CLEARED`});
    const seconds=Math.round((Date.now()-this.state.startedAt)/1000),stageStats={score:this.state.score-this.stageStartScore,kills:this.state.kills-this.stageStartKills,damage:this.state.damageTaken-this.stageStartDamage,cash:this.state.cash};
    if(this.chapterIndex<CHAPTERS.length-1){
      this.game.events.emit('chapterComplete',{chapter:this.chapterIndex,chapterData:this.chapter,stageStats,score:this.state.score,cash:this.state.cash});
      return;
    }
    const best=recordClear(this.state.score);
    this.game.events.emit('ending',{score:this.state.score,cash:this.state.cash,best,kills:this.state.kills,damage:this.state.damageTaken,seconds,stageStats,difficulty:DIFFICULTIES[this.difficultyKey].name});
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
    const current=Math.min(this.encounterIndex+1,this.chapter.encounters.length),next=this.chapter.encounters[Math.min(this.encounterIndex,this.chapter.encounters.length-1)];
    this.game.events.emit('hud',{...this.state,stageData:{act:this.chapter.act,name:this.chapter.name},progress:{current,total:this.chapter.encounters.length,label:this.encounterActive?next?.title:(this.encounterIndex>=this.chapter.encounters.length?'EXIT':'ADVANCE'),distance:Math.max(0,Math.min(1,this.player.x/WORLD_W)),route:this.campaignRouteLabel},boss:this.activeBoss?{name:ENEMIES[this.activeBoss.kind].name,hp:this.activeBoss.hp,max:this.activeBoss.maxHp}:null});
  }

  createAnimations(){
    const add=(key:string,frames:string[],rate:number)=>{if(!this.anims.exists(key))this.anims.create({key,frames:frames.map(k=>({key:k})),frameRate:rate,repeat:-1})};
    add('jack-idle',[1,2,3,4].map(i=>`jack0-${i}`),3);
    add('jack-run',[1,2,3,4].map(i=>`jack1-${i}`),10);
    for(let r=0;r<8;r++)add(`woman${r}-walk`,[1,2].map(i=>`woman${r}-${i}`),6);
    for(let r=0;r<4;r++)add(`man${r}-walk`,[1,2].map(i=>`man${r}-${i}`),6);
  }
}
