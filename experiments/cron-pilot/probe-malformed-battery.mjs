const R="/home/robert_li/Desktop/projects/slice-tournament-zoo/experiments/cron-pilot/runs";
const sp={
 "orig-b(REJ)":`${R}/seed-1-haiku-vague/A/prototypes/specimen-b/index.mjs`,
 "orig-a(REJ)":`${R}/seed-2/A/prototypes/specimen-a/index.mjs`,
 "orig-c":`${R}/seed-1-haiku-vague/A/prototypes/specimen-c/index.mjs`,
 "orig-d":`${R}/seed-2/A/prototypes/specimen-d/index.mjs`,
 "new-e":`${R}/control-seed-1/bestN/specimen-e/index.mjs`,
 "new-g":`${R}/control-seed-1/bestN/specimen-g/index.mjs`,
 "new-h":`${R}/control-3seed/fresh/seed-2/specimen-h/index.mjs`,
};
const after=new Date(Date.UTC(2024,0,1,0,0,0));
// malformed forms; all SHOULD throw per "throw on malformed expression"
const mal=["5abc * * * *","abc * * * *","99 * * * *","0 0 * *","* * * * * *","*/0 * * * *","1-40 * * * *","5- * * * *",". * * * *"];
async function t(n,p){let f;try{({nextRun:f}=await import(p))}catch{console.log(n,"IMPORTFAIL");return}
 const r=mal.map(e=>{try{const x=f(e,new Date(after));return (x instanceof Date)?"accept":"accept?"}catch{return "THROW"}});
 console.log(n.padEnd(11)+" "+r.map((x,i)=>x==="THROW"?"·":"A").join(" "));}
console.log("           "+mal.map((_,i)=>i).join(" ")+"   (A=accepted=BUG, ·=threw=ok)");
for(const[n,p]of Object.entries(sp))await t(n,p);
console.log("\nforms: "+mal.map((m,i)=>i+"='"+m+"'").join("  "));
