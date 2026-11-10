/* Read the first XLSX worksheet through its workbook relationship. */
async function readFinancialCptSheet(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const zip = new DataView(bytes.buffer);
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && zip.getUint32(end, true) !== 0x06054b50) end--;
  if (end < Math.max(0, bytes.length - 65557)) throw Error('Choose a valid .xlsx workbook.');
  const entries = new Map();
  let offset = zip.getUint32(end + 16, true);
  const decode = new TextDecoder();
  for (let i = 0; i < zip.getUint16(end + 10, true); i++) {
    if (zip.getUint32(offset, true) !== 0x02014b50) throw Error('Invalid workbook directory.');
    const length = zip.getUint16(offset + 28, true);
    const name = decode.decode(bytes.subarray(offset + 46, offset + 46 + length));
    entries.set(name, { method: zip.getUint16(offset + 10, true), size: zip.getUint32(offset + 20, true), start: zip.getUint32(offset + 42, true) });
    offset += 46 + length + zip.getUint16(offset + 30, true) + zip.getUint16(offset + 32, true);
  }
  async function xml(name) {
    const entry = entries.get(name);
    if (!entry) throw Error('Workbook entry is missing: ' + name);
    const start = entry.start + 30 + zip.getUint16(entry.start + 26, true) + zip.getUint16(entry.start + 28, true);
    const content = bytes.slice(start, start + entry.size);
    if (![0, 8].includes(entry.method)) throw Error('Unsupported workbook compression.');
    const buffer = entry.method === 0 ? content : await new Response(new Blob([content]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
    const doc = new DOMParser().parseFromString(decode.decode(buffer), 'application/xml');
    if (doc.querySelector('parsererror')) throw Error('Invalid worksheet XML.');
    return doc;
  }
  const workbook = await xml('xl/workbook.xml');
  const sheet = workbook.querySelector('sheet');
  if (!sheet) throw Error('The workbook has no worksheets.');
  const relations = await xml('xl/_rels/workbook.xml.rels');
  const relationship = [...relations.querySelectorAll('Relationship')].find(row => row.getAttribute('Id') === sheet.getAttribute('r:id'));
  const target = relationship?.getAttribute('Target');
  if (!target) throw Error('The worksheet could not be located.');
  const sheetPath = new URL(target, 'https://workbook.invalid/xl/workbook.xml').pathname.slice(1);
  const shared = entries.has('xl/sharedStrings.xml') ? [...(await xml('xl/sharedStrings.xml')).querySelectorAll('si')].map(row => row.textContent) : [];
  return [...(await xml(sheetPath)).querySelectorAll('sheetData row')].map(row => {
    const cells = [];
    for (const cell of row.querySelectorAll('c')) {
      const column = cell.getAttribute('r').match(/^[A-Z]+/)[0];
      const index = [...column].reduce((n, letter) => n * 26 + letter.charCodeAt(0) - 64, 0) - 1;
      const value = cell.querySelector('v')?.textContent || '';
      cells[index] = cell.getAttribute('t') === 's' ? shared[Number(value)] : cell.getAttribute('t') === 'inlineStr' ? cell.querySelector('is')?.textContent : value;
    }
    return cells;
  });
}
