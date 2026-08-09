import {existsSync,readFileSync,statSync} from 'node:fs';
const expected=[];
for(let r=0;r<4;r++)for(let i=1;i<=4;i++)expected.push([`public/assets/characters/jack-row${r}/0${i}.png`,256,256]);
for(let r=0;r<8;r++)for(let i=1;i<=4;i++)expected.push([`public/assets/characters/woman-row${r}/0${i}.png`,256,256]);
for(let r=0;r<4;r++)for(let i=1;i<=4;i++)expected.push([`public/assets/enemies/man-row${r}/0${i}.png`,256,256]);
for(let r=0;r<4;r++)for(let i=1;i<=4;i++)expected.push([`public/assets/props/row${r}/0${i}.png`,192,192]);
for(const n of ['pink-pigeon','alley','casino','kebab'])expected.push([`public/assets/backgrounds/${n}.webp`,0,0]);
const failures=[];
for(const [path,w,h] of expected){if(!existsSync(path)){failures.push(`${path}: missing`);continue}if(statSync(path).size<1024){failures.push(`${path}: suspiciously small`);continue}if(path.endsWith('.png')){const b=readFileSync(path);const pw=b.readUInt32BE(16),ph=b.readUInt32BE(20);if(pw!==w||ph!==h)failures.push(`${path}: ${pw}x${ph}, expected ${w}x${h}`)}}
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`Production asset matrix: ${expected.length} files PASS`);
