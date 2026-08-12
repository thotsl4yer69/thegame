export class FilthyAudio{
 ctx?:AudioContext;master?:GainNode;muted=localStorage.getItem('ts69-muted')==='1';beat?:number;step=0;venue=0;
 start(){if(this.ctx){this.startBeat();void this.ctx.resume();return}this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:.18;this.master.connect(this.ctx.destination);this.startBeat();void this.ctx.resume()}
 startBeat(){if(!this.beat)this.beat=window.setInterval(()=>this.tick(),240)}
 stopBeat(){if(this.beat){clearInterval(this.beat);this.beat=undefined}}
 toggle(){this.muted=!this.muted;localStorage.setItem('ts69-muted',this.muted?'1':'0');if(this.master)this.master.gain.value=this.muted?0:.18;return this.muted}
 tone(freq:number,dur=.08,type:OscillatorType='square',gain=.25,slide=0){if(!this.ctx||!this.master)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),n=this.ctx.currentTime;o.type=type;o.frequency.setValueAtTime(freq,n);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide),n+dur);g.gain.setValueAtTime(gain,n);g.gain.exponentialRampToValueAtTime(.001,n+dur);o.connect(g).connect(this.master);o.start(n);o.stop(n+dur)}
 tick(){if(this.ctx?.state!=='running')return;const roots=[44,55,41,49],root=roots[this.venue]??44;this.step=(this.step+1)%16;if(this.step%4===0)this.tone(this.step%8?root*1.25:root,.16,'sine',.34,-12);if(this.step%2===0)this.tone(this.venue===1?1900:1500,.025,'square',.035);if(this.step===7||this.step===15)this.tone(root*2.1,.07,'sawtooth',.08,-40);if(this.venue===2&&this.step%4===2)this.tone(660,.035,'triangle',.04,80)}
 hit(heavy=false){this.tone(heavy?85:125,heavy?.18:.09,'sawtooth',heavy?.6:.35,-65);this.tone(heavy?310:450,.04,'square',.15,-150)}
 hurt(){this.tone(70,.25,'sawtooth',.45,-45)} pickup(){this.tone(520,.08,'square',.2,300);setTimeout(()=>this.tone(820,.1,'square',.16,200),55)}
 special(){for(let i=0;i<5;i++)setTimeout(()=>this.tone(180+i*100,.12,'sawtooth',.25,220),i*45)}
 dash(){this.tone(260,.08,'sawtooth',.2,-190)}
 stage(venue=0){this.venue=venue;const root=[110,137,103,123][venue]??110;[root,root*1.5,root*2,root*3].forEach((f,i)=>setTimeout(()=>this.tone(f,.3,'square',.3,30),i*80))}
 pause(paused:boolean){if(!this.ctx)return;if(paused){this.stopBeat();void this.ctx.suspend()}else{this.startBeat();void this.ctx.resume()}}
 stop(){this.stopBeat()}
}
