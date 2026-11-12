const fs = require('fs');
const source = fs.readFileSync(process.argv[2] || 'index.html', 'utf8');
for (const needle of process.argv.slice(3)) {
  let at = 0;
  while ((at = source.indexOf(needle, at)) >= 0) {
    console.log(`\n--- ${needle} @ ${at} ---\n${source.slice(Math.max(0, at - 600), at + 1200)}`);
    at += needle.length;
  }
}
