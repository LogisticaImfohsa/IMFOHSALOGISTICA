const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
const errors = [];
scripts.forEach((match, index) => {
  try { new vm.Script(match[1], { filename: `inline-${index + 1}.js` }); }
  catch (error) { errors.push({ script: index + 1, message: error.message, stack: error.stack }); }
});
console.log(JSON.stringify({ scripts: scripts.length, valid: scripts.length - errors.length, errors }, null, 2));
process.exitCode = errors.length ? 1 : 0;
