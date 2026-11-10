const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const bytes = fs.readFileSync('C:/Users/VEERAIAH/Downloads/Notes.pdf');
const source = bytes.toString('latin1');
const output = path.join(__dirname, 'notes-reference');
fs.mkdirSync(output, {recursive: true});
function object(id) {
  const match = new RegExp('(?:^|[\\r\\n])' + id + ' 0 obj\\s*<<([\\s\\S]*?)>>stream').exec(source);
  if (!match) throw new Error('Missing stream ' + id);
  let start = match.index + match[0].length;
  if (source[start] === '\r') start++;
  if (source[start] === '\n') start++;
  const length = Number(match[1].match(/\/Length\s+(\d+)/)[1]);
  return {dictionary: match[1], data: zlib.inflateSync(bytes.subarray(start, start + length))};
}
function crc32(buffer) {
  let crc = -1;
  for (const value of buffer) {
    crc ^= value;
    for (let bit=0; bit<8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}
function chunk(type, data) {
  const tag = Buffer.from(type);
  const header = Buffer.alloc(4), crc = Buffer.alloc(4);
  header.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([tag, data])));
  return Buffer.concat([header, tag, data, crc]);
}
for (let page=0; page<10; page++) {
  const image = object(17 + page * 4);
  const width = Number(image.dictionary.match(/\/Width\s+(\d+)/)[1]);
  const height = Number(image.dictionary.match(/\/Height\s+(\d+)/)[1]);
  const maskId = image.dictionary.match(/\/SMask\s+(\d+)/);
  const mask = maskId ? object(Number(maskId[1])).data : null;
  if (image.data.length !== width * height * 3) throw new Error('Unsupported image layout');
  const scanlines = Buffer.alloc((width * 3 + 1) * height);
  for (let y=0; y<height; y++) for (let x=0; x<width; x++) {
    const pixel = y * width + x;
    const alpha = mask ? mask[pixel] / 255 : 1;
    for (let channel=0; channel<3; channel++) scanlines[y*(width*3+1)+1+x*3+channel] = Math.round(image.data[pixel*3+channel]*alpha+255*(1-alpha));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width,0); ihdr.writeUInt32BE(height,4); ihdr[8]=8; ihdr[9]=2;
  const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(scanlines)),chunk('IEND',Buffer.alloc(0))]);
  const file = path.join(output, 'page-' + String(page+1).padStart(2,'0') + '.png');
  fs.writeFileSync(file,png);
  console.log(file);
}
