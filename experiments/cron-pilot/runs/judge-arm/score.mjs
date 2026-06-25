import {execFileSync} from 'child_process';
const impl=process.argv[2];
const ROOT="/home/robert_li/Desktop/projects/slice-tournament-zoo/experiments/cron-pilot";
const after=new Date(Date.UTC(2024,0,1,0,0,0));
const mustThrow=["5abc * * * *","abc * * * *","99 * * * *","60 * * * *","0 24 * * *","0 0 0 * *","0 0 * 13 *","0 0 * * 8","0 0 * *","* * * * * *","*/0 * * * *","5-2 * * * *",". * * * *"];
function runner(path){ try{ const o=execFileSync("node",[path,impl],{encoding:'utf8'}); return JSON.parse(o.trim().split("\n").pop()); }
  catch(e){ const s=(e.stdout||"").trim(); if(s) return JSON.parse(s.split("\n").pop()); throw e; } }
async function main(){
 let f; try{({nextRun:f}=await import(impl))}catch(e){console.log(JSON.stringify({err:"import"}));return;}
 const throws=(e)=>{let t=false;try{f(e,new Date(after))}catch{t=true}return t;};
 const mt=mustThrow.map(throws);
 const sealed=runner(`${ROOT}/suites-v2/cron.sealed.mjs`);
 const truth=runner(`${ROOT}/truth-suite/cron.truth.mjs`);
 // 7==Sunday convention axis: contract says dow 0-6; accepting 7 as Sunday is convention, throwing is contract-faithful
 const seven_accepts_as_sun=(()=>{try{const r=f("0 0 * * 7",new Date(after));return r instanceof Date && r.getTime()===Date.UTC(2024,0,7,0,0);}catch{return false;}})();
 console.log(JSON.stringify({
   sealed:+sealed.passRate.toFixed(4),
   truth_full:+truth.passRate.toFixed(4),
   mustThrow_pass:mt.filter(Boolean).length, mustThrow_total:mustThrow.length,
   axis_5abc_correct:mt[0],            // true=throws=spec-correct (PRIMARY contract-mandated axis)
   axis_7sunday_convention:seven_accepts_as_sun, // true=accepts 7 as Sunday (convention, NOT in primary)
 }));
}
main();
