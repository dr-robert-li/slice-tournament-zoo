const implPath = process.argv[2];
console.log('implPath:', implPath);

let nextRun;
try {
  const mod = await import(implPath);
  console.log('module imported:', mod);
  nextRun = mod.nextRun;
  console.log('nextRun:', typeof nextRun);
} catch (e) {
  console.error('import error:', e.message);
  process.exit(1);
}

if (typeof nextRun !== "function") {
  console.error('nextRun is not a function');
  process.exit(1);
}

const U = (y, mo, d, h, mi) => Date.UTC(y, mo - 1, d, h, mi, 0);
const AFTER = new Date(U(2024, 1, 1, 0, 0));

const [expr, wantMs] = ["* * * * *", U(2024, 1, 1, 0, 1)];
console.log('testing:', expr, 'after:', AFTER, 'want:', wantMs);

try {
  const got = nextRun(expr, new Date(AFTER.getTime()));
  console.log('got:', got, 'got.getTime():', got.getTime());
  console.log('match:', got.getTime() === wantMs);
} catch (e) {
  console.error('execution error:', e.message);
}
