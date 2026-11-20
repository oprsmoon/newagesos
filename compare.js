const fs = require('fs');

const oldHtml = fs.readFileSync('old_index_reference.html', 'utf8');
const curHtml = fs.readFileSync('index.html', 'utf8');

const oldIds = (oldHtml.match(/id="[^"]+"/g) || []).map(s => s.slice(4, -1));
const curIds = (curHtml.match(/id="[^"]+"/g) || []).map(s => s.slice(4, -1));

console.log('IDs only in Old:', oldIds.filter(x => !curIds.includes(x)));
console.log('IDs only in Current:', curIds.filter(x => !oldIds.includes(x)));
console.log('Total Old IDs:', oldIds.length);
console.log('Total Cur IDs:', curIds.length);
