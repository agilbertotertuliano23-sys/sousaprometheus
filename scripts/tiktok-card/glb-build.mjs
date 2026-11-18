// Reconstrói public/modelos-3d/tiktok-card.glb a partir do ORIGINAL (tiktok-card.orig.glb):
//  - reposiciona/redimensiona peças (nós) via ajustes;
//  - ACHATA a ponta do balão (vértices com z_local > limite viram o limite), pra sobrar
//    um retângulo arredondado limpo (na referência a ponta é do botão FOLLOW, não do card).
// Uso: node glb-build.mjs <orig.glb> <saida.glb> '<json ajustes de nós>' <zBranco> <zPreto>
import { readFileSync, writeFileSync } from 'node:fs';

const [entrada, saida, ajustesTxt, zBrancoTxt, zPretoTxt] = process.argv.slice(2);
const ajustes = JSON.parse(ajustesTxt || '{}');
const limites = { CardBranco: Number(zBrancoTxt), CardPreto: Number(zPretoTxt) };

const buf = readFileSync(entrada);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
const binHead = 20 + jsonLen; // cabeçalho do chunk BIN: 8 bytes (len, type) + dados
const binLen = buf.readUInt32LE(binHead);
const bin = Buffer.from(buf.slice(binHead + 8, binHead + 8 + binLen)); // cópia editável

// ajustes de materiais: { "__materiais": { "MatPreto": { "roughnessFactor": 0.2, "baseColorFactor": [..] } } }
for (const [nome, a] of Object.entries(ajustes.__materiais || {})) {
  const mat = json.materials.find((m) => m.name === nome);
  if (!mat) continue;
  const { emissiveStrength, emissiveFactor, ...pbr } = a;
  mat.pbrMetallicRoughness = { ...(mat.pbrMetallicRoughness || {}), ...pbr };
  if (emissiveFactor) mat.emissiveFactor = emissiveFactor;
  if (emissiveStrength !== undefined) {
    mat.extensions = { ...(mat.extensions || {}), KHR_materials_emissive_strength: { emissiveStrength } };
  }
  console.log('material', nome, JSON.stringify(a));
}

for (const no of json.nodes) {
  const a = ajustes[no.name];
  if (a) {
    Object.assign(no, a);
    console.log('nó', no.name, JSON.stringify(a));
  }
}

// achata a ponta: limite em z_local (eixo da altura do card antes da rotação de -90° em X)
json.nodes.forEach((no) => {
  const lim = limites[no.name];
  if (no.mesh === undefined || !Number.isFinite(lim)) return;
  json.meshes[no.mesh].primitives.forEach((prim, j) => {
    const acc = json.accessors[prim.attributes.POSITION];
    const bv = json.bufferViews[acc.bufferView];
    const base = (bv.byteOffset || 0) + (acc.byteOffset || 0);
    const passo = bv.byteStride || 12;
    let mexidos = 0;
    let zmax = -Infinity;
    for (let i = 0; i < acc.count; i++) {
      const o = base + i * passo + 8; // z = 3º float
      let z = bin.readFloatLE(o);
      if (z > lim) {
        bin.writeFloatLE(lim, o);
        z = lim;
        mexidos++;
      }
      if (z > zmax) zmax = z;
    }
    acc.max[2] = zmax;
    console.log(no.name, 'prim', j, '-> vértices achatados:', mexidos, '/', acc.count);
  });
});

let novo = Buffer.from(JSON.stringify(json), 'utf8');
novo = Buffer.concat([novo, Buffer.alloc((4 - (novo.length % 4)) % 4, 0x20)]);
const binChunkHead = Buffer.alloc(8);
binChunkHead.writeUInt32LE(binLen, 0);
binChunkHead.writeUInt32LE(0x004e4942, 4); // 'BIN\0'
const cab = Buffer.alloc(20);
cab.writeUInt32LE(0x46546c67, 0);
cab.writeUInt32LE(2, 4);
cab.writeUInt32LE(20 + novo.length + 8 + binLen, 8);
cab.writeUInt32LE(novo.length, 12);
cab.writeUInt32LE(0x4e4f534a, 16);
writeFileSync(saida, Buffer.concat([cab, novo, binChunkHead, bin]));
console.log('ok', saida);
