export type EnemyKey='roxi'|'lexi'|'nyx'|'candy'|'viper'|'lola'|'suki'|'bianca'|'damo'|'chad'|'coin'|'goblin';
export type EnemySpec={name:string;sprite:string;hp:number;speed:number;damage:number;worth:number;scale:number;style:'rush'|'ranged'|'heavy'|'tease';lines:string[]};
export const ENEMIES:Record<EnemyKey,EnemySpec>={
 roxi:{name:'ROXI REDLINE',sprite:'woman0',hp:4,speed:105,damage:8,worth:180,scale:.78,style:'tease',lines:['EYES UP HERE, FUCKBOY','THAT YOUR BEST SHOT?','YOU COULD NEVER AFFORD ME']},
 lexi:{name:'LEXI PLATINUM',sprite:'woman1',hp:4,speed:125,damage:7,worth:200,scale:.78,style:'rush',lines:['VIP MEANS NOT YOU','CHAMPAGNE PROBLEMS, CUNT','TRY AND KEEP UP']},
 nyx:{name:'NYX DAMAGE',sprite:'woman2',hp:6,speed:90,damage:10,worth:240,scale:.8,style:'tease',lines:['COME CLOSER. WORSE IDEA.','I BITE BACK','YOUR SAFE WORD IS PATHETIC']},
 candy:{name:'CANDY GOLD',sprite:'woman3',hp:5,speed:115,damage:9,worth:260,scale:.8,style:'rush',lines:['TIP OR GET TIPPED','YOU LOOK BROKE','DANCE, DICKHEAD']},
 viper:{name:'VIPER VICE',sprite:'woman4',hp:6,speed:110,damage:10,worth:280,scale:.8,style:'tease',lines:['LOOK AT ME WHEN I RUIN YOU','POISON COSTS EXTRA','COME HERE, BAD DECISION']},
 lola:{name:'LOLA LEOPARD',sprite:'woman5',hp:8,speed:82,damage:13,worth:320,scale:.82,style:'heavy',lines:['BIG HAIR. BIGGER PROBLEM.','I BREAK CHEAP MEN','ROAR, DICKHEAD']},
 suki:{name:'SUKI STATIC',sprite:'woman6',hp:5,speed:130,damage:9,worth:300,scale:.78,style:'ranged',lines:['TOUCH GRASS? TOUCH VOLTAGE.','YOU CANNOT HANDLE THE BPM','STATIC IN YOUR UNDERPANTS']},
 bianca:{name:'BIANCA BLACKOUT',sprite:'woman7',hp:10,speed:92,damage:14,worth:420,scale:.84,style:'heavy',lines:['THE WHITE SUIT STAYS CLEAN','YOU OWE ME INTEREST','KNEEL OR PAY CASH']},
 damo:{name:'DAMO THE DOOR',sprite:'man0',hp:13,speed:68,damage:16,worth:600,scale:.95,style:'heavy',lines:['NOT TONIGHT, CHAMP','OUT. FUCKING. SIDE.','I AM THE GUEST LIST']},
 chad:{name:'CHAD CHAIN',sprite:'man1',hp:7,speed:95,damage:11,worth:340,scale:.83,style:'rush',lines:['I OWN THIS NIGHT','KNOW WHO I AM?','TABLE MINIMUM, PEASANT']},
 coin:{name:'COINDADDY',sprite:'man2',hp:5,speed:78,damage:9,worth:300,scale:.76,style:'ranged',lines:['JUST READ THE WHITEPAPER','FIAT IS FOR CUCKS','THIS DIP IS GENERATIONAL']},
 goblin:{name:'THE BAG GOBLIN',sprite:'man3',hp:8,speed:135,damage:12,worth:400,scale:.84,style:'rush',lines:['GOT ANY TICK?','ONE MORE AND I AM NORMAL','WHO STOLE MY FUCKING BAG?']}
};
export type Stage={act:string;name:string;background:string;roster:EnemyKey[];waves:number[][];boss:EnemyKey;intro:string;clear:string};
export const STAGES:Stage[]=[
 {act:'ACT I',name:'THE PINK PIGEON',background:'bg-club',roster:['roxi','lexi','lola','chad'],waves:[[0,0,1,1],[0,1,2,0,2],[3]],boss:'chad',intro:'THE PINK PIGEON — WHERE DIGNITY GOES TO DIE',clear:'CHAD LOST THE CLUB, HIS SHIRT AND THE ARGUMENT.'},
 {act:'ACT II',name:'BACK-ALLEY SERMON',background:'bg-alley',roster:['nyx','viper','goblin','coin'],waves:[[0,1,2],[0,3,2,1,0],[2]],boss:'goblin',intro:'2:17AM — EVERY BIN HAS A PHILOSOPHER',clear:'THE GOBLIN HAS RETURNED TO THE SHADOW REALM.'},
 {act:'ACT III',name:'CASINO PURGATORY',background:'bg-casino',roster:['candy','bianca','suki','coin'],waves:[[0,2,3,0],[1,2,0,1,3],[0]],boss:'candy',intro:'THE HOUSE ALWAYS WINS. TONIGHT IT GETS PUNCHED.',clear:'CANDY CASHED OUT. THE CARPET STILL OWES YOU MONEY.'},
 {act:'FINAL ACT',name:'KEBAB JUDGMENT',background:'bg-kebab',roster:['roxi','viper','lola','suki','bianca','damo'],waves:[[0,1,2,3],[1,2,3,4,0,4],[5]],boss:'damo',intro:'5:41AM — GARLIC SAUCE AND CONSEQUENCES',clear:'DAWN. AGAINST ALL MEDICAL ADVICE, YOU SURVIVED.'}
];
export const DIFFICULTIES={
 messy:{id:'messy',name:'MESSY',hp:.82,damage:.78,score:.8,hazard:1.2},
 cooked:{id:'cooked',name:'COOKED',hp:1,damage:1,score:1,hazard:1},
 unhinged:{id:'unhinged',name:'UNHINGED',hp:1.3,damage:1.28,score:1.5,hazard:.72}
} as const;
export const UPGRADES=[
 {id:'double',name:'DOUBLE BAGGER',desc:'+1 punch damage. Max meat −10. Because moderation is cowardice.'},
 {id:'pigeon',name:'PIGEON PACT',desc:'Pigeon costs 30 HIGH instead of 50. The bird now owns part of your soul.'},
 {id:'shameless',name:'ABSOLUTELY SHAMELESS',desc:'Every takedown repairs 3 meat. Narcissism as medicine.'},
 {id:'filthy',name:'FILTHY RICH',desc:'Cash drops double and heavy attacks spray bonus notes.'},
 {id:'rat',name:'FUNCTIONAL RAT',desc:'Packets last longer and restore 10 meat. Teeth may vibrate.'},
 {id:'tradie',name:'TRADIE STRENGTH',desc:'Heavy attack hits twice as hard. Knees continue to deteriorate.'}
];
