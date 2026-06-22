const R="/home/robert_li/Desktop/projects/slice-tournament-zoo/experiments/ipv4-pilot/runs/specimens";
const sp={a:`${R}/specimen-a/index.mjs`,b:`${R}/specimen-b/index.mjs`,c:`${R}/specimen-c/index.mjs`,d:`${R}/specimen-d/index.mjs`};
// malformed forms that SHOULD throw (in-contract: not a well-formed in-range dotted-quad)
const mal=["256.1.1.1","300.1.1.1","1.2.3","1.2.3.4.5","1.2.3.4x","1.2.3.","a.b.c.d","","1.-1.3.4","99999.1.1.1"];
async function t(n,p){let f;try{({parseIp:f}=await import(p))}catch{console.log(n,"IMPORTFAIL");return}
 const r=mal.map(s=>{try{const x=f(s);return (typeof x==="number"&&!Number.isNaN(x))?"A":"a?"}catch{return "·"}});
 console.log("spec-"+n+"  "+r.join("  "));}
console.log("        "+mal.map((m,i)=>i).join("  ")+"   (A=accepted=BUG, ·=threw=ok)");
for(const[n,p]of Object.entries(sp))await t(n,p);
console.log("\nforms: "+mal.map((m,i)=>i+"='"+m+"'").join("  "));
