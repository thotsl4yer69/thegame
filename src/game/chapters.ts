import type {EnemyKey} from './data';

export type ChapterTheme='club'|'goth'|'chapel'|'casino'|'warehouse'|'dawn';
export type ChapterZone={start:number;end:number;name:string;subtitle:string;tint:number;floor:number};
export type ChapterEncounter={x:number;title:string;enemies:EnemyKey[];boss?:EnemyKey};
export type ChapterDef={
  id:string;act:string;name:string;district:string;subtitle:string;
  backgroundKey:string;backgroundAsset:string;theme:ChapterTheme;cutsceneId:number;
  intro:string;clear:string;bossLine:string;zones:ChapterZone[];encounters:ChapterEncounter[];
};

const W=6200;
const zones=(a:string,b:string,c:string,d:string,tints:[number,number,number,number],floors:[number,number,number,number]):ChapterZone[]=>[
 {start:0,end:1500,name:a,subtitle:'MELBOURNE AFTER DARK',tint:tints[0],floor:floors[0]},
 {start:1500,end:3000,name:b,subtitle:'KEEP MOVING • KEEP LYING',tint:tints[1],floor:floors[1]},
 {start:3000,end:4550,name:c,subtitle:'PRIVATE ACCESS • BAD TERMS',tint:tints[2],floor:floors[2]},
 {start:4550,end:W,name:d,subtitle:'BOSS TERRITORY • NO REFUNDS',tint:tints[3],floor:floors[3]}
];

export const CHAPTERS:ChapterDef[]=[
 {
  id:'pink-pigeon',act:'CHAPTER 01',name:'THE PINK PIGEON',district:'KING STREET, CBD',subtitle:'VELVET • TIPS • TROUBLE',
  backgroundKey:'bg-club',backgroundAsset:'assets/backgrounds/pink-pigeon.webp',theme:'club',cutsceneId:0,
  intro:'KING STREET • THE NIGHT STARTS WITH A BAD WRISTBAND AND WORSE INTENTIONS.',
  clear:'CHAD LOST THE BOOTH, THE ARGUMENT AND MOST OF HIS DIGNITY.',
  bossLine:'OWNER\'S BOOTH. BAD NEWS: CHAD IS STILL TALKING.',
  zones:zones('QUEUE & ENTRY','MAIN FLOOR','VIP CORRIDOR',"OWNER'S BOOTH",[0xff4aa8,0xb64aff,0xffc247,0xff315e],[0x25091f,0x170b2a,0x24150a,0x26080e]),
  encounters:[
   {x:980,title:'FRONT DOOR SHAKEDOWN',enemies:['lexi','roxi']},
   {x:2280,title:'MAIN FLOOR MELTDOWN',enemies:['lexi','lola','roxi']},
   {x:3680,title:'VIP CORRIDOR',enemies:['lola','lexi','roxi']},
   {x:5060,title:"OWNER'S BOOTH",enemies:['lexi'],boss:'chad'}
  ]
 },
 {
  id:'black-lantern',act:'CHAPTER 02',name:'THE BLACK LANTERN',district:'FITZROY',subtitle:'GOTH • SMOKE • LEVERAGE',
  backgroundKey:'bg-alley',backgroundAsset:'assets/backgrounds/alley.webp',theme:'goth',cutsceneId:1,
  intro:'FITZROY • BACK DOORS, BLACK LIPSTICK AND SOMEBODY ELSE\'S CIGARETTES.',
  clear:'THE LANTERN IS STILL OPEN. THE PEOPLE RUNNING IT ARE LESS UPRIGHT.',
  bossLine:'THE SERVICE LANE BELONGS TO THE BAG GOBLIN. APPARENTLY.',
  zones:zones('BRUNSWICK ST ENTRY','BLACK BAR','BACK ROOMS','SERVICE LANE',[0x8a35ff,0x2d1845,0x19ead8,0xff315e],[0x120b20,0x0b1019,0x071d1f,0x22080e]),
  encounters:[
   {x:920,title:'DOOR POLICY',enemies:['nyx','goblin']},
   {x:2180,title:'BLACK BAR',enemies:['nyx','viper','coin']},
   {x:3660,title:'BACK ROOM DEBT',enemies:['viper','goblin','nyx']},
   {x:5120,title:'SERVICE LANE SERMON',enemies:['viper'],boss:'goblin'}
  ]
 },
 {
  id:'glasshouse',act:'CHAPTER 03',name:'GLASSHOUSE',district:'CHAPEL STREET',subtitle:'FASHION • EGO • FLASH',
  backgroundKey:'bg-club',backgroundAsset:'assets/backgrounds/pink-pigeon.webp',theme:'chapel',cutsceneId:1,
  intro:'CHAPEL STREET • EVERYBODY LOOKS EXPENSIVE UNTIL THE FIRST PUNCH.',
  clear:'THE ROOFTOP PARTY HAS BECOME A LIABILITY WAIVER.',
  bossLine:'LOLA OWNS THE FLOOR. SHE HAS DECIDED YOU ARE DECOR.',
  zones:zones('VALET & QUEUE','MIRROR BAR','ROOFTOP ACCESS','PENTHOUSE FLOOR',[0x22d9ff,0xff4ab5,0xffffff,0xff7849],[0x071923,0x210817,0x111111,0x241009]),
  encounters:[
   {x:940,title:'INFLUENCER QUEUE',enemies:['suki','lexi']},
   {x:2260,title:'MIRROR BAR',enemies:['lexi','candy','suki']},
   {x:3700,title:'ROOFTOP ACCESS',enemies:['suki','lola','lexi']},
   {x:5100,title:'PENTHOUSE FLOOR',enemies:['suki'],boss:'lola'}
  ]
 },
 {
  id:'casino-purgatory',act:'CHAPTER 04',name:'CASINO PURGATORY',district:'SOUTHBANK',subtitle:'GOLD • DEBT • SURVEILLANCE',
  backgroundKey:'bg-casino',backgroundAsset:'assets/backgrounds/casino.webp',theme:'casino',cutsceneId:2,
  intro:'SOUTHBANK • THE CARPET COSTS MORE THAN YOUR CAR. DO NOT BLEED ON IT.',
  clear:'THE HOUSE STILL WINS. IT JUST HAS A MEDICAL BILL NOW.',
  bossLine:'HIGH-LIMIT LOUNGE. CANDY THINKS YOU ARE UNDERDRESSED.',
  zones:zones('RIVER ENTRY','CASINO FLOOR','HIGH LIMIT','PRIVATE LOUNGE',[0xffd229,0x19ead8,0xff7849,0xffffff],[0x201406,0x071b1a,0x251007,0x161116]),
  encounters:[
   {x:960,title:'SECURITY DESK',enemies:['coin','candy']},
   {x:2240,title:'CASINO FLOOR',enemies:['suki','coin','candy']},
   {x:3690,title:'HIGH LIMIT',enemies:['bianca','suki','coin']},
   {x:5090,title:'PRIVATE LOUNGE',enemies:['bianca'],boss:'candy'}
  ]
 },
 {
  id:'warehouse-44',act:'CHAPTER 05',name:'WAREHOUSE 44',district:'FOOTSCRAY',subtitle:'BASS • CONCRETE • CONSEQUENCES',
  backgroundKey:'bg-alley',backgroundAsset:'assets/backgrounds/alley.webp',theme:'warehouse',cutsceneId:1,
  intro:'FOOTSCRAY • INDUSTRIAL BASS, BAD POWDER AND A DOOR WITH NO SIGN.',
  clear:'WAREHOUSE 44 IS NOW MOSTLY A FIRE CODE VIOLATION.',
  bossLine:'DAMO THE DOOR HAS BEEN WAITING ALL NIGHT TO SAY NO.',
  zones:zones('LOADING BAY','RAVE FLOOR','CATWALK','ROLLER DOOR',[0x19ead8,0x8a35ff,0xff315e,0xffd229],[0x06191b,0x130923,0x21070d,0x1d1606]),
  encounters:[
   {x:920,title:'LOADING BAY',enemies:['goblin','suki']},
   {x:2200,title:'RAVE FLOOR',enemies:['suki','nyx','goblin']},
   {x:3680,title:'CATWALK',enemies:['coin','goblin','suki']},
   {x:5120,title:'ROLLER DOOR',enemies:['goblin'],boss:'damo'}
  ]
 },
 {
  id:'kebab-judgment',act:'FINAL CHAPTER',name:'KEBAB JUDGMENT',district:'ST KILDA / DAWN',subtitle:'GARLIC • REGRET • SUNRISE',
  backgroundKey:'bg-kebab',backgroundAsset:'assets/backgrounds/kebab.webp',theme:'dawn',cutsceneId:3,
  intro:'ST KILDA • SUNRISE HAS ARRIVED TO COLLECT STATEMENTS.',
  clear:'DAWN. AGAINST ALL MEDICAL ADVICE, YOU SURVIVED MELBOURNE.',
  bossLine:'LAST ROUND. EVERY BAD DECISION FROM TONIGHT HAS FOUND THE SAME FOOTPATH.',
  zones:zones('TRAM STOP','KEBAB QUEUE','MOTEL STRIP','SUNRISE',[0xff7849,0xffd229,0xff4aa8,0xf6b77a],[0x21100a,0x201706,0x260915,0x24160e]),
  encounters:[
   {x:920,title:'TRAM STOP AFTERMATH',enemies:['roxi','viper']},
   {x:2220,title:'KEBAB QUEUE',enemies:['lola','suki','roxi']},
   {x:3680,title:'MOTEL STRIP',enemies:['viper','bianca','lola']},
   {x:5120,title:'SUNRISE JUDGMENT',enemies:['bianca','viper'],boss:'damo'}
  ]
 }
];
