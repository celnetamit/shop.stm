const fs = require('fs');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (row.length > 0 || field) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const fileContent = fs.readFileSync('/home/itb03/Desktop/shop.stm/journals_entry.csv', 'utf-8');
const parsed = parseCsv(fileContent);
const headers = parsed[0];

const jNameIdx = headers.indexOf("Journal Name");
const indexingIdx = headers.indexOf("Indexing");
const logoImgIdx = headers.indexOf("Indexing Logo Img");
const logoUrlIdx = headers.indexOf("Indexing Logo URL");
const icvIdx = headers.indexOf("ICV Value");
const icvUrlIdx = headers.indexOf("ICV URL");

console.log(`Headers Mapping: 
Journal Name: ${jNameIdx}
Indexing: ${indexingIdx}
Indexing Logo Img: ${logoImgIdx}
Indexing Logo URL: ${logoUrlIdx}
ICV Value: ${icvIdx}
ICV URL: ${icvUrlIdx}
`);

// Print the first 10 with some indexing info
let count = 0;
for (let i = 1; i < parsed.length && count < 20; i++) {
  const row = parsed[i];
  if (row[indexingIdx] || row[logoImgIdx] || row[icvIdx]) {
    console.log(`- Name: ${row[jNameIdx]}`);
    console.log(`  Indexing: ${row[indexingIdx]}`);
    console.log(`  Logo Img: ${row[logoImgIdx]}`);
    console.log(`  Logo URL: ${row[logoUrlIdx]}`);
    console.log(`  ICV Value: ${row[icvIdx]}`);
    console.log(`  ICV URL: ${row[icvUrlIdx]}`);
    console.log('-------------------');
    count++;
  }
}
