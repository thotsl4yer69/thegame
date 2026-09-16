import type {Group,Object3D,PerspectiveCamera,PointLight,Scene,WebGLRenderer} from 'three';

export type CutsceneId=0|1|2|3;
type ThreeModule=typeof import('three');
type Shot='wide'|'jack'|'lead'|'intimate';
type Beat={speaker:string;line:string;shot:Shot};
type Cutscene={id:CutsceneId;kicker:string;title:string;location:string;palette:[number,number,number];beats:Beat[]};

export const CUTSCENES:readonly Cutscene[]=[
  {id:0,kicker:'ACT I AFTER HOURS',title:'VELVET WARNING',location:'THE PINK PIGEON • PRIVATE BOOTH',palette:[0xff269c,0x19ead8,0x160513],beats:[
    {speaker:'ROXI REDLINE',shot:'lead',line:'You bought the VIP booth and ordered tap water. That is either discipline or a cry for help.'},
    {speaker:'JACK',shot:'jack',line:'Financial ruin later. Right now I am investigating. The view is an aggressively distracting workplace hazard.'},
    {speaker:'ROXI REDLINE',shot:'intimate',line:'Cute. Viper knows who rigged tonight. She also likes confidence, clean questions and men who can follow one instruction.'},
    {speaker:'PINK PIGEON',shot:'wide',line:'Roxi steals his collar, his last coherent thought and twenty dollars in exactly that order. The curtains decide they have seen enough.'}
  ]},
  {id:1,kicker:'ACT II AFTER HOURS',title:'NEON SAFE WORD',location:'BACK ALLEY • 2:43AM',palette:[0x19ead8,0xff375f,0x03131a],beats:[
    {speaker:'VIPER VICE',shot:'lead',line:'You survived Roxi and still came down this alley. Your threat assessment is adorable.'},
    {speaker:'JACK',shot:'jack',line:'I prefer “commitment to the bit.” It sounds better on the incident report.'},
    {speaker:'VIPER VICE',shot:'intimate',line:'Bianca owns the casino, the debt and probably this puddle. Take the key. Try not to make that face.'},
    {speaker:'CITY CCTV',shot:'wide',line:'She clips the key to his vest, gives him one professionally irresponsible wink and disappears into steam before the camera can invoice her.'}
  ]},
  {id:2,kicker:'ACT III AFTER HOURS',title:'THE HOUSE EDGE',location:'CASINO PURGATORY • HIGH-LIMIT LOUNGE',palette:[0xffc229,0xff269c,0x190c04],beats:[
    {speaker:'BIANCA BLACKOUT',shot:'lead',line:'That key gets you into the lounge. Your cheekbones bought the extra ten seconds.'},
    {speaker:'JACK',shot:'jack',line:'Finally, an economy I understand.'},
    {speaker:'BIANCA BLACKOUT',shot:'intimate',line:'Damo is waiting at dawn. Beat him and the tab disappears. Impress me and I may misplace a few more records.'},
    {speaker:'HOUSE SECURITY',shot:'wide',line:'The doors lock. Jack mistakes this for chemistry. Security updates the incident log.'}
  ]},
  {id:3,kicker:'FINAL CUT • 5:58AM',title:'DAWN HAS A WALK OF SHAME',location:'KEBAB JUDGMENT • FIRST LIGHT',palette:[0xff7849,0xffd229,0x18080d],beats:[
    {speaker:'ROXI REDLINE',shot:'lead',line:'Four venues, three terrible plans and one kebab. You really committed to the evening.'},
    {speaker:'JACK',shot:'jack',line:'I would like the record to show the kebab was strategic.'},
    {speaker:'ROXI REDLINE',shot:'intimate',line:'Ask nicely, menace. Sunrise has been waiting all night to judge you.'},
    {speaker:'DAWN',shot:'wide',line:'He does. She catches him by the collar. Somewhere, a pigeon clocks off with full entitlements.'}
  ]}
] as const;

export class CutsceneDirector{
  private root:HTMLElement;
  private stage:HTMLElement;
  private three?:ThreeModule;
  private renderer?:WebGLRenderer;
  private scene?:Scene;
  private camera?:PerspectiveCamera;
  private figures:Group[]=[];
  private pulseLights:PointLight[]=[];
  private raf=0;
  private startedAt=0;
  private lastFrameAt=0;
  private current?:Cutscene;
  private beat=0;
  private resolve?:()=>void;
  private tipTotal=0;
  private resizeObserver?:ResizeObserver;
  private reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  private lookX=0;
  private lookY=2.05;
  private lookZ=-.1;

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
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){
        cancelAnimationFrame(this.raf);
        return;
      }
      if(this.scene&&this.camera&&this.renderer&&!this.root.classList.contains('gone')){
        this.lastFrameAt=performance.now();
        cancelAnimationFrame(this.raf);
        this.raf=requestAnimationFrame(this.animate);
      }
    });
  }

  get scenes(){return CUTSCENES}

  async preload(){
    this.three??=await import('three');
    return this.three;
  }

  async play(id:CutsceneId){
    if(this.resolve)this.finish();
    this.current=CUTSCENES[id];
    this.beat=0;
    this.tipTotal=0;
    this.root.classList.remove('gone','cutscene-fallback');
    document.body.classList.add('cutscene-active');
    this.query('#cutscene-kicker').textContent=this.current.kicker;
    this.query('#cutscene-title').textContent=this.current.title;
    this.query('#cutscene-location').textContent=this.current.location;
    const tip=this.query<HTMLButtonElement>('#cutscene-tip');
    tip.classList.toggle('gone',id!==0);
    tip.textContent='TIP THE STAGE $20';
    this.renderBeat(false);
    const completion=new Promise<void>(resolve=>{this.resolve=resolve});
    try{
      await this.ensureRenderer();
      this.buildScene(this.current);
    }catch{
      this.root.classList.add('cutscene-fallback');
    }
    this.query<HTMLButtonElement>('#cutscene-next').focus({preventScroll:true});
    return completion;
  }

  private query<T extends HTMLElement=HTMLElement>(selector:string){return this.root.querySelector(selector) as T}

  private async ensureRenderer(){
    const T=await this.preload();
    if(this.renderer)return;
    const canvas=document.createElement('canvas');
    canvas.setAttribute('aria-hidden','true');
    canvas.addEventListener('webglcontextlost',event=>{
      event.preventDefault();
      cancelAnimationFrame(this.raf);
      this.root.classList.add('cutscene-fallback');
    });
    canvas.addEventListener('webglcontextrestored',()=>{
      this.root.classList.remove('cutscene-fallback');
      if(this.current)this.buildScene(this.current);
    });
    this.stage.replaceChildren(canvas);
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});
    const mobile=matchMedia('(pointer: coarse)').matches||innerWidth<900;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.7));
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.12;
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(this.stage);
    this.resize();
  }

  private buildScene(spec:Cutscene){
    if(!this.three||!this.renderer)return;
    this.disposeScene();
    const T=this.three;
    const scene=new T.Scene();
    scene.background=new T.Color(spec.palette[2]);
    scene.fog=new T.FogExp2(spec.palette[2],.052);

    const camera=new T.PerspectiveCamera(38,1,.1,80);
    const initial=this.shot(spec.beats[0].shot,spec.id);
    camera.position.set(initial.x,initial.y,initial.z);
    this.lookX=initial.lx;this.lookY=initial.ly;this.lookZ=initial.lz;

    scene.add(new T.HemisphereLight(0x70415f,0x050208,1.18));
    const key=new T.PointLight(spec.palette[0],82,15,2);key.position.set(-3,4,3);scene.add(key);
    const rim=new T.PointLight(spec.palette[1],68,14,2);rim.position.set(3,3,-1);scene.add(rim);
    const warm=new T.PointLight(0xffc08a,38,10,2);warm.position.set(0,5,4);scene.add(warm);
    this.pulseLights=[key,rim];

    const floorMat=new T.MeshStandardMaterial({color:0x09070b,metalness:.72,roughness:.2});
    const floor=new T.Mesh(new T.PlaneGeometry(24,16),floorMat);
    floor.rotation.x=-Math.PI/2;
    scene.add(floor);
    const grid=new T.GridHelper(22,22,spec.palette[0],0x23121f);
    grid.position.y=.012;
    scene.add(grid);
    this.buildEnvironment(scene,spec.id);

    const left=this.makeFigure('JACK',0x121319,spec.palette[1],false);
    const right=this.makeFigure(spec.id===1?'VIPER':spec.id===2?'BIANCA':'ROXI',spec.palette[0],0xffc0d9,true);
    left.position.set(-1.25,0,.15);left.rotation.y=.24;
    right.position.set(1.25,0,-.05);right.rotation.y=-.26;
    if(spec.id===3){
      left.position.x=-.78;right.position.x=.78;
      left.rotation.y=.42;right.rotation.y=-.42;
    }
    [left,right].forEach(figure=>{
      figure.userData.baseX=figure.position.x;
      figure.userData.baseRotY=figure.rotation.y;
    });
    scene.add(left,right);
    this.figures=[left,right];

    if(spec.id===0){
      const dancerA=this.makeFigure('LEXI',0xd9e4f7,0xff269c,true);
      const dancerB=this.makeFigure('LOLA',0x21121f,0xffd229,true);
      dancerA.scale.setScalar(.7);dancerB.scale.setScalar(.72);
      dancerA.position.set(-4,0,-1.1);dancerB.position.set(4,0,-1.15);
      dancerA.rotation.y=.45;dancerB.rotation.y=-.45;
      [dancerA,dancerB].forEach(figure=>{
        figure.userData.baseX=figure.position.x;
        figure.userData.baseRotY=figure.rotation.y;
      });
      scene.add(dancerA,dancerB);
      this.figures.push(dancerA,dancerB);

      const cash=new T.Group();
      cash.name='cash-rain';
      const billGeo=new T.PlaneGeometry(.3,.13);
      const billMat=new T.MeshBasicMaterial({color:0x8dff9b,side:T.DoubleSide});
      for(let i=0;i<20;i++){
        const bill=new T.Mesh(billGeo,billMat);
        bill.position.set(((i*29)%100)/10-5,((i*47)%100)/14+.4,((i*61)%100)/22-1);
        bill.rotation.set(i*.4,i*.23,i*.7);
        bill.userData.seed=i;
        cash.add(bill);
      }
      scene.add(cash);
    }

    this.addParticles(scene,spec);
    this.scene=scene;
    this.camera=camera;
    this.startedAt=performance.now();
    this.lastFrameAt=this.startedAt;
    cancelAnimationFrame(this.raf);
    this.raf=requestAnimationFrame(this.animate);
    this.resize();
  }

  private buildEnvironment(scene:Scene,id:CutsceneId){
    const T=this.three!;
    const spec=CUTSCENES[id];
    const neon=(x:number,y:number,z:number,w:number,h:number,color:number)=>{
      const mat=new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:4,roughness:.25});
      const mesh=new T.Mesh(new T.BoxGeometry(w,h,.08),mat);
      mesh.position.set(x,y,z);
      scene.add(mesh);
      return mesh;
    };
    const wallMat=new T.MeshStandardMaterial({color:0x130d16,metalness:.35,roughness:.48});
    const back=new T.Mesh(new T.BoxGeometry(18,7,.3),wallMat);
    back.position.set(0,3.2,-3);
    scene.add(back);
    neon(0,5.35,-2.75,7,.08,spec.palette[0]);
    neon(0,4.92,-2.75,4.8,.045,spec.palette[1]);

    if(id===0){
      const dais=new T.Mesh(
        new T.CylinderGeometry(3.1,3.3,.24,48),
        new T.MeshPhysicalMaterial({color:0x3e0a2b,metalness:.65,roughness:.2,clearcoat:1})
      );
      dais.position.set(0,.12,-.7);
      scene.add(dais);
      const pole=new T.Mesh(
        new T.CylinderGeometry(.025,.025,5.2,14),
        new T.MeshStandardMaterial({color:0xe8dbe8,metalness:1,roughness:.08})
      );
      pole.position.set(0,2.6,-1.35);
      scene.add(pole);
      [-4.2,4.2].forEach(x=>neon(x,2.6,-2.72,.08,4.8,x<0?spec.palette[0]:spec.palette[1]));
    }else if(id===1){
      for(let i=-4;i<=4;i++)neon(i*1.7,1.2+(i%2)*.3,-2.72,1.1,.04,i%2?spec.palette[0]:spec.palette[1]);
      for(let i=0;i<7;i++){
        const puddle=new T.Mesh(
          new T.CircleGeometry(.35+i*.08,24),
          new T.MeshPhysicalMaterial({color:spec.palette[1],emissive:spec.palette[1],emissiveIntensity:.55,transparent:true,opacity:.28,roughness:.05})
        );
        puddle.rotation.x=-Math.PI/2;
        puddle.scale.x=2.2;
        puddle.position.set(-4+i*1.35,.02,1+(i%3)*.65);
        scene.add(puddle);
      }
    }else if(id===2){
      [-4.5,4.5].forEach(x=>{
        const column=new T.Mesh(
          new T.CylinderGeometry(.38,.5,6,20),
          new T.MeshStandardMaterial({color:0x5c3410,metalness:.72,roughness:.24})
        );
        column.position.set(x,3,-2.5);
        scene.add(column);
      });
      const table=new T.Mesh(
        new T.CylinderGeometry(2.5,2.5,.22,40),
        new T.MeshPhysicalMaterial({color:0x143f2a,clearcoat:1,roughness:.16})
      );
      table.position.set(0,.72,-1.2);
      scene.add(table);
      neon(0,5.45,-2.72,6.2,.11,spec.palette[0]);
    }else{
      const dawn=new T.Mesh(new T.PlaneGeometry(18,5),new T.MeshBasicMaterial({color:0xff5a72}));
      dawn.position.set(0,2.8,-3.2);
      scene.add(dawn);
      for(let i=0;i<12;i++){
        const h=1+((i*17)%31)/10;
        const tower=new T.Mesh(
          new T.BoxGeometry(.7+(i%3)*.28,h,.7),
          new T.MeshStandardMaterial({color:0x170b18,roughness:.8})
        );
        tower.position.set(-7.5+i*1.35,h/2,-2.3);
        scene.add(tower);
      }
      const counter=new T.Mesh(new T.BoxGeometry(6,.9,1.2),new T.MeshStandardMaterial({color:0x3a1712,roughness:.45}));
      counter.position.set(0,.45,-1.5);
      scene.add(counter);
    }
  }

  private makeFigure(name:string,outfit:number,accent:number,femme:boolean){
    const T=this.three!;
    const group=new T.Group();
    group.name=name;

    const skin=new T.MeshPhysicalMaterial({color:femme?0xd9957d:0xa96650,roughness:.62,clearcoat:.12,flatShading:true});
    const cloth=new T.MeshPhysicalMaterial({color:outfit,metalness:.3,roughness:.24,clearcoat:.82,flatShading:true});
    const trim=new T.MeshStandardMaterial({color:accent,emissive:accent,emissiveIntensity:.65,metalness:.55,roughness:.2});
    const dark=new T.MeshStandardMaterial({color:0x08080a,metalness:.5,roughness:.26});
    const white=new T.MeshStandardMaterial({color:0xfff7fa,roughness:.4});
    const iris=new T.MeshStandardMaterial({color:accent,emissive:accent,emissiveIntensity:.45});
    const lip=new T.MeshStandardMaterial({color:0xb5144d,roughness:.38});

    const add=(geometry:import('three').BufferGeometry,material:import('three').Material,x:number,y:number,z:number,scale:[number,number,number]=[1,1,1])=>{
      const mesh=new T.Mesh(geometry,material);
      mesh.position.set(x,y,z);
      mesh.scale.set(...scale);
      group.add(mesh);
      return mesh;
    };
    const limb=(radius:number,length:number,x:number,y:number,z:number,material:import('three').Material,rz=0)=>{
      const mesh=add(new T.CapsuleGeometry(radius,length,6,12),material,x,y,z);
      mesh.rotation.z=rz;
      return mesh;
    };

    add(new T.CylinderGeometry(.12,.15,.2,12),skin,0,3.1,0);
    add(new T.SphereGeometry(.29,20,14),skin,0,3.43,.01,[.86,1.08,.82]);
    add(new T.SphereGeometry(.31,18,12),dark,0,3.58,-.09,[1.04,.72,.98]);
    if(femme){
      const sideHair=add(new T.CapsuleGeometry(.07,.5,6,10),dark,-.27,3.32,-.05);
      sideHair.rotation.z=.08;
      const sideHair2=add(new T.CapsuleGeometry(.07,.56,6,10),dark,.27,3.28,-.05);
      sideHair2.rotation.z=-.1;
    }
    [-.095,.095].forEach(x=>{
      add(new T.SphereGeometry(.043,12,8),white,x,3.48,.235,[1.15,.68,.42]);
      add(new T.SphereGeometry(.018,10,7),iris,x,3.48,.262);
    });
    add(new T.SphereGeometry(.025,10,7),skin,0,3.4,.27,[.72,1.35,.9]);
    add(new T.SphereGeometry(.055,12,7),lip,0,3.32,.25,[1.4,.34,.5]);

    if(femme){
      add(new T.CylinderGeometry(.35,.25,.78,18),skin,0,2.65,0);
      add(new T.SphereGeometry(.31,18,12),cloth,-.19,2.7,.16,[1,.7,.72]);
      add(new T.SphereGeometry(.31,18,12),cloth,.19,2.7,.16,[1,.7,.72]);
      add(new T.CylinderGeometry(.24,.31,.42,18),skin,0,2.12,0);
      add(new T.SphereGeometry(.48,20,14),cloth,0,1.78,0,[1.15,.55,.78]);
      add(new T.TorusGeometry(.32,.027,8,20,Math.PI),trim,0,2.73,.34).rotation.z=Math.PI;
      add(new T.BoxGeometry(.035,.6,.035),trim,-.24,2.92,.17).rotation.z=-.17;
      add(new T.BoxGeometry(.035,.6,.035),trim,.24,2.92,.17).rotation.z=.17;
      limb(.095,.7,-.47,2.55,0,skin,.22);
      limb(.095,.7,.47,2.55,0,skin,-.36);
      add(new T.SphereGeometry(.11,12,8),skin,-.56,2.08,.02);
      add(new T.SphereGeometry(.11,12,8),skin,.61,2.13,.02);
      limb(.145,.86,-.22,.88,0,skin,.04);
      limb(.145,.86,.22,.88,0,skin,-.04);
      limb(.125,.58,-.25,.24,0,dark,.025);
      limb(.125,.58,.25,.24,0,dark,-.025);
      [-.25,.25].forEach(x=>{
        const band=add(new T.TorusGeometry(.15,.025,8,18),trim,x,.86,0);
        band.rotation.x=Math.PI/2;
        add(new T.BoxGeometry(.28,.16,.58),dark,x,-.11,.17);
        add(new T.BoxGeometry(.07,.24,.18),dark,x-.08,-.26,-.05);
      });
    }else{
      add(new T.CylinderGeometry(.42,.32,.94,18),cloth,0,2.58,0);
      add(new T.CylinderGeometry(.31,.35,.5,18),cloth,0,1.86,0);
      limb(.115,.8,-.51,2.55,0,skin,.11);
      limb(.115,.8,.51,2.55,0,skin,-.11);
      limb(.16,.95,-.21,.73,0,dark,.025);
      limb(.16,.95,.21,.73,0,dark,-.025);
      add(new T.BoxGeometry(.34,.16,.65),dark,-.21,.06,.13);
      add(new T.BoxGeometry(.34,.16,.65),dark,.21,.06,.13);
      add(new T.BoxGeometry(.6,.1,.08),trim,0,2.28,.31);
    }

    group.userData.baseY=0;
    return group;
  }

  private addParticles(scene:Scene,spec:Cutscene){
    const T=this.three!;
    const geometry=new T.OctahedronGeometry(.035,0);
    const material=new T.MeshBasicMaterial({color:spec.palette[1],transparent:true,opacity:.72});
    const particles=new T.Group();
    particles.name='particles';
    for(let i=0;i<42;i++){
      const mote=new T.Mesh(geometry,material);
      mote.position.set(((i*37)%100)/7-7,((i*53)%100)/18+.25,((i*71)%100)/15-4);
      mote.userData.seed=i;
      particles.add(mote);
    }
    scene.add(particles);
  }

  private shot(kind:Shot,id:CutsceneId){
    const close=id===3?6.7:7.3;
    if(kind==='jack')return {x:-1.05,y:2.72,z:close,lx:-.72,ly:2.2,lz:.02};
    if(kind==='lead')return {x:1.05,y:2.72,z:close,lx:.72,ly:2.2,lz:-.02};
    if(kind==='intimate')return {x:0,y:2.54,z:id===3?6.05:6.55,lx:0,ly:2.16,lz:0};
    return {x:0,y:2.82,z:id===3?8.05:9.1,lx:0,ly:2.03,lz:-.18};
  }

  private animate=(now:number)=>{
    if(!this.renderer||!this.scene||!this.camera||!this.current)return;
    if(document.hidden)return;

    const dt=Math.min(.05,Math.max(.001,(now-this.lastFrameAt)/1000));
    this.lastFrameAt=now;
    const t=(now-this.startedAt)/1000;
    const beat=this.current.beats[this.beat];
    const target=this.shot(beat.shot,this.current.id);

    if(!this.reducedMotion){
      const cameraBlend=1-Math.exp(-dt*4.8);
      const breathingX=Math.sin(t*.31)*.08;
      const breathingY=Math.sin(t*.27)*.035;
      this.camera.position.x+=(target.x+breathingX-this.camera.position.x)*cameraBlend;
      this.camera.position.y+=(target.y+breathingY-this.camera.position.y)*cameraBlend;
      this.camera.position.z+=(target.z+Math.cos(t*.23)*.07-this.camera.position.z)*cameraBlend;
      this.lookX+=(target.lx-this.lookX)*cameraBlend;
      this.lookY+=(target.ly-this.lookY)*cameraBlend;
      this.lookZ+=(target.lz-this.lookZ)*cameraBlend;

      this.figures.forEach((figure,index)=>{
        const speakerIsJack=beat.speaker==='JACK';
        const isSpeaker=(speakerIsJack&&index===0)||(!speakerIsJack&&index===1);
        const pose=isSpeaker ? .045 : 0;
        const baseX=figure.userData.baseX as number;
        const baseRotY=figure.userData.baseRotY as number;
        figure.position.x=baseX+Math.sin(t*.55+index)*.018+(index===1?pose:-pose);
        figure.position.y=Math.sin(t*1.15+index*1.7)*.022;
        figure.rotation.y=baseRotY+Math.sin(t*.38+index)*.018+(index===1?-pose:pose);
        figure.rotation.z=Math.sin(t*.7+index)*.01;
      });

      this.pulseLights.forEach((light,index)=>{
        light.intensity=70+Math.sin(t*2.1+index*Math.PI)*14;
      });

      const particles=this.scene.getObjectByName('particles');
      particles?.children.forEach((mote:Object3D)=>{
        const seed=(mote.userData.seed as number)%5;
        mote.position.y+=(.22+seed*.055)*dt;
        mote.rotation.y+=dt*.25;
        if(mote.position.y>5.8)mote.position.y=.15;
      });

      const cash=this.scene.getObjectByName('cash-rain');
      const boost=cash&&(cash.userData.boostUntil as number)>now?3:1;
      cash?.children.forEach((bill:Object3D)=>{
        const seed=(bill.userData.seed as number)%4;
        bill.position.y-=boost*(.48+seed*.12)*dt;
        bill.rotation.z+=boost*.75*dt;
        bill.rotation.y+=boost*.28*dt;
        if(bill.position.y<.15)bill.position.y=5.8;
      });
    }else{
      this.camera.position.set(target.x,target.y,target.z);
      this.lookX=target.lx;this.lookY=target.ly;this.lookZ=target.lz;
    }

    this.camera.lookAt(this.lookX,this.lookY,this.lookZ);
    this.renderer.render(this.scene,this.camera);
    this.raf=requestAnimationFrame(this.animate);
  };

  private renderBeat(animate=true){
    if(!this.current)return;
    const beat=this.current.beats[this.beat];
    this.query('#cutscene-speaker').textContent=beat.speaker;
    this.query('#cutscene-line').textContent=beat.line;
    this.query<HTMLButtonElement>('#cutscene-next').textContent=this.beat===this.current.beats.length-1?'CONTINUE THE BAD IDEA':'NEXT INDISCRETION';

    if(animate&&!this.reducedMotion){
      const card=this.query('.cutscene-copy');
      card.getAnimations().forEach(animation=>animation.cancel());
      card.animate(
        [
          {opacity:.68,transform:'translate3d(16px,8px,0) skew(-1deg)'},
          {opacity:1,transform:'translate3d(0,0,0) skew(-1deg)'}
        ],
        {duration:260,easing:'cubic-bezier(.2,.8,.2,1)'}
      );
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
    const cash=this.scene?.getObjectByName('cash-rain');
    if(cash)cash.userData.boostUntil=performance.now()+1400;
    this.query<HTMLButtonElement>('#cutscene-tip').textContent=`$${this.tipTotal} TIPPED • AGAIN`;
    this.query('#cutscene-speaker').textContent='HOUSE MC';
    this.query('#cutscene-line').textContent=this.tipTotal>=100
      ?'The stage erupts. Roxi takes the spotlight hostage. Even the pigeon looks away out of professional courtesy.'
      :'Roxi catches the note against one glittering boot and gives the rail a slow turn worth at least another irresponsible twenty.';
    if('vibrate' in navigator)navigator.vibrate([12,24,12]);
  }

  private finish(){
    if(this.root.classList.contains('gone')&&!this.resolve)return;
    cancelAnimationFrame(this.raf);
    this.root.classList.add('gone');
    document.body.classList.remove('cutscene-active');
    this.disposeScene();
    this.current=undefined;
    const resolve=this.resolve;
    this.resolve=undefined;
    resolve?.();
  }

  private resize(){
    if(!this.renderer||!this.camera)return;
    const width=Math.max(1,this.stage.clientWidth);
    const height=Math.max(1,this.stage.clientHeight);
    this.renderer.setSize(width,height,false);
    this.camera.aspect=width/height;
    this.camera.updateProjectionMatrix();
  }

  private disposeScene(){
    cancelAnimationFrame(this.raf);
    this.scene?.traverse(object=>{
      const mesh=object as import('three').Mesh;
      mesh.geometry?.dispose();
      const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
      materials.filter(Boolean).forEach(material=>material.dispose());
    });
    this.scene=undefined;
    this.camera=undefined;
    this.figures=[];
    this.pulseLights=[];
  }
}
