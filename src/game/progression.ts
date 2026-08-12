export type RunStats={runs:number;clears:number;totalKills:number;totalDamage:number;bestScore:number;fastestClear:number};

const STATS_KEY='ts69-stats';
const BEST_KEY='ts69-best';
const FINISHED_KEY='ts69-finished';
const ACHIEVEMENTS_KEY='ts69-achievements';
const GALLERY_KEY='ts69-gallery';

const emptyStats=():RunStats=>({runs:0,clears:0,totalKills:0,totalDamage:0,bestScore:0,fastestClear:0});

function readJson<T>(key:string,fallback:T):T{
  try{return {...fallback,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return fallback}
}

function readList(key:string):string[]{
  try{
    const value=JSON.parse(localStorage.getItem(key)||'[]');
    return Array.isArray(value)?value.filter(item=>typeof item==='string'):[];
  }catch{return []}
}

function unlockListItem(key:string,id:string){
  const saved=readList(key);
  if(saved.includes(id))return false;
  saved.push(id);
  localStorage.setItem(key,JSON.stringify(saved));
  return true;
}

export function readStats():RunStats{return readJson(STATS_KEY,emptyStats())}

export function recordRun({score,kills,damage,cleared,seconds=0}:{score:number;kills:number;damage:number;cleared:boolean;seconds?:number}){
  const stats=readStats();
  stats.runs++;
  stats.clears+=cleared?1:0;
  stats.totalKills+=kills;
  stats.totalDamage+=Math.round(damage);
  stats.bestScore=Math.max(stats.bestScore,score);
  if(cleared&&seconds>0)stats.fastestClear=stats.fastestClear?Math.min(stats.fastestClear,seconds):seconds;
  localStorage.setItem(STATS_KEY,JSON.stringify(stats));
  return stats;
}

export function rankRun(score:number,cleared:boolean){
  if(cleared&&score>=40000)return 'S';
  if(score>=26000)return 'A';
  if(score>=16000)return 'B';
  if(score>=8000)return 'C';
  return 'D';
}

export function formatTime(seconds:number){return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`}
export function bestScore(){return Math.max(Number(localStorage.getItem(BEST_KEY)||0),readStats().bestScore)}
export function achievementCount(){return readList(ACHIEVEMENTS_KEY).length}
export function unlockAchievement(id:string){return unlockListItem(ACHIEVEMENTS_KEY,id)}
export function unlockGalleryEntry(id:string){return unlockListItem(GALLERY_KEY,id)}
export function readGallery(){return readList(GALLERY_KEY)}

export function recordClear(score:number){
  const best=Math.max(Number(localStorage.getItem(BEST_KEY)||0),score);
  localStorage.setItem(BEST_KEY,String(best));
  localStorage.setItem(FINISHED_KEY,'1');
  return best;
}
