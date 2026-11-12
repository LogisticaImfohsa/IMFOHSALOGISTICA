const fs = require('fs');
const source = 'server_copia_aprobada_8946.exe';
const target = 'server_copia_aprobada_8946_fixed.exe';
const bytes = fs.readFileSync(source);
const from = Buffer.from('8945');
const to = Buffer.from('8946');
let offset = 0;
let replacements = 0;
while ((offset = bytes.indexOf(from, offset)) >= 0) {
  to.copy(bytes, offset);
  offset += from.length;
  replacements += 1;
}
if (!replacements) throw new Error('No se encontró el puerto 8945 en el ejecutable.');
fs.writeFileSync(target, bytes);
console.log(`reemplazos=${replacements}`);
