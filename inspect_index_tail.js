const fs = require('fs');
const value = fs.readFileSync('index.html', 'utf8');
console.log(JSON.stringify({
  bytes: value.length,
  copyJs: value.includes('r82915-copy-approved.js'),
  copyCss: value.includes('r82915-copy-approved.css'),
  accessCss: value.includes('r82915-access-approved.css'),
  finalCss: value.includes('r82915-admin-final.css'),
  headTail: value.slice(Math.max(0, value.indexOf('</head>') - 1200), value.indexOf('</head>') + 20),
  tail: value.slice(-1000)
}, null, 2));
