// Minimal QR Code generator — byte mode, error-correction level M, versions 1-10.
//
// Written from ISO/IEC 18004 rather than pulled in as a dependency, because the
// Receive screen has to show a *real* scannable code. A decorative grid that
// looks like a QR but doesn't decode would be a fake affordance, and the flow
// diagram's Receive state is "address + QR to share".
//
// Exports `qrMatrix(text)` -> { size, modules: boolean[][] } where true = dark.

// ---------------------------------------------------------------- GF(256) math

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // QR's primitive polynomial
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gmul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

// Generator polynomial for `degree` error-correction codewords, descending order.
function rsGenerator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gmul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsRemainder(data, degree) {
  const gen = rsGenerator(degree);
  const res = new Array(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.shift();
    res.push(0);
    for (let j = 0; j < degree; j++) res[j] ^= gmul(gen[j + 1], factor);
  }
  return res;
}

// ------------------------------------------------------------- version tables
// Level M only. `blocks` is [[blockCount, dataCodewordsPerBlock], ...].

const VERSIONS = {
  1: { total: 26, ec: 10, blocks: [[1, 16]] },
  2: { total: 44, ec: 16, blocks: [[1, 28]] },
  3: { total: 70, ec: 26, blocks: [[1, 44]] },
  4: { total: 100, ec: 18, blocks: [[2, 32]] },
  5: { total: 134, ec: 24, blocks: [[2, 43]] },
  6: { total: 172, ec: 16, blocks: [[4, 27]] },
  7: { total: 196, ec: 18, blocks: [[4, 31]] },
  8: { total: 242, ec: 22, blocks: [[2, 38], [2, 39]] },
  9: { total: 292, ec: 22, blocks: [[3, 36], [2, 37]] },
  10: { total: 346, ec: 26, blocks: [[4, 43], [1, 44]] },
};

const ALIGNMENT = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

function dataCodewords(version) {
  const v = VERSIONS[version];
  return v.blocks.reduce((sum, [count, per]) => sum + count * per, 0);
}

function pickVersion(byteLength) {
  for (let v = 1; v <= 10; v++) {
    const lengthBits = v < 10 ? 8 : 16;
    const needed = 4 + lengthBits + byteLength * 8;
    if (needed <= dataCodewords(v) * 8) return v;
  }
  throw new Error("Payload too long for a version-10 QR code.");
}

// ------------------------------------------------------------------ bitstream

function encodeData(bytes, version) {
  const bits = [];
  const push = (value, length) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };

  push(0b0100, 4); // byte mode
  push(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) push(b, 8);

  const capacityBits = dataCodewords(version) * 8;
  // Terminator, then pad to a byte boundary.
  for (let i = 0; i < 4 && bits.length < capacityBits; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    codewords.push(byte);
  }
  // Pad codewords alternate 0xEC / 0x11.
  const pads = [0xec, 0x11];
  let p = 0;
  while (codewords.length < dataCodewords(version)) codewords.push(pads[p++ % 2]);
  return codewords;
}

function interleave(codewords, version) {
  const { ec, blocks } = VERSIONS[version];
  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (const [count, per] of blocks) {
    for (let i = 0; i < count; i++) {
      const chunk = codewords.slice(offset, offset + per);
      offset += per;
      dataBlocks.push(chunk);
      ecBlocks.push(rsRemainder(chunk, ec));
    }
  }
  const maxData = Math.max(...dataBlocks.map((b) => b.length));
  const out = [];
  for (let i = 0; i < maxData; i++) {
    for (const block of dataBlocks) if (i < block.length) out.push(block[i]);
  }
  for (let i = 0; i < ec; i++) {
    for (const block of ecBlocks) out.push(block[i]);
  }
  return out;
}

// -------------------------------------------------------------------- matrix

function bch(value, generator, generatorBits) {
  let rest = value;
  for (let i = generatorBits - 1; i >= 0; i--) {
    if (rest >>> (i + generatorBits) & 1 || rest >= 1 << (i + generatorBits)) {
      // handled below — kept simple by the loop form used in formatBits
    }
    void i;
  }
  void generator;
  return rest;
}
void bch; // the two BCH cases below are simpler written out directly

function formatBits(mask) {
  const data = (EC_LEVEL_BITS << 3) | mask; // 5 bits
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

function versionBits(version) {
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  return (version << 12) | rem;
}

function maskAt(pattern, x, y) {
  switch (pattern) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

function buildFunctionModules(version) {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

  const set = (x, y, dark) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    modules[y][x] = dark;
    reserved[y][x] = true;
  };

  // Finder patterns + separators.
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(cx + dx, cy + dy, d !== 2 && d <= 3);
      }
    }
  }

  // Timing patterns.
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }

  // Alignment patterns.
  const centers = ALIGNMENT[version];
  for (const cy of centers) {
    for (const cx of centers) {
      const corner = (cx === 6 && cy === 6) || (cx === 6 && cy === size - 7) || (cx === size - 7 && cy === 6);
      if (corner) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const d = Math.max(Math.abs(dx), Math.abs(dy));
          set(cx + dx, cy + dy, d !== 1);
        }
      }
    }
  }

  // Reserve the format-information areas (values written after masking).
  for (let i = 0; i < 9; i++) {
    set(i, 8, false);
    set(8, i, false);
  }
  for (let i = 0; i < 8; i++) {
    set(size - 1 - i, 8, false);
    set(8, size - 1 - i, false);
  }
  set(8, size - 8, true); // dark module

  // Reserve version information (versions 7+).
  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      set(size - 11 + (i % 3), Math.floor(i / 3), false);
      set(Math.floor(i / 3), size - 11 + (i % 3), false);
    }
  }

  return { size, modules, reserved };
}

function placeData(modules, reserved, size, codewords) {
  let bitIndex = 0;
  const totalBits = codewords.length * 8;
  const bitAt = (i) => (i < totalBits ? (codewords[i >> 3] >>> (7 - (i & 7))) & 1 : 0);

  for (let right = size - 1; right >= 1; right -= 2) {
    const col = right === 6 ? right - 1 : right; // skip the vertical timing column
    for (let vert = 0; vert < size; vert++) {
      const upward = ((col + 1) & 2) === 0;
      const y = upward ? size - 1 - vert : vert;
      for (let i = 0; i < 2; i++) {
        const x = col - i;
        if (x < 0) continue;
        if (reserved[y][x]) continue;
        modules[y][x] = bitAt(bitIndex) === 1;
        bitIndex++;
      }
    }
  }
  return modules;
}

function penalty(modules, size) {
  let score = 0;

  const runScore = (line) => {
    let total = 0;
    let run = 1;
    for (let i = 1; i < line.length; i++) {
      if (line[i] === line[i - 1]) {
        run++;
      } else {
        if (run >= 5) total += 3 + (run - 5);
        run = 1;
      }
    }
    if (run >= 5) total += 3 + (run - 5);
    return total;
  };

  for (let y = 0; y < size; y++) score += runScore(modules[y]);
  for (let x = 0; x < size; x++) score += runScore(modules.map((row) => row[x]));

  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const a = modules[y][x];
      if (a === modules[y][x + 1] && a === modules[y + 1][x] && a === modules[y + 1][x + 1]) score += 3;
    }
  }

  const finderish = [true, false, true, true, true, false, true, false, false, false, false];
  const matches = (line, at) => {
    for (let i = 0; i < finderish.length; i++) {
      const v = line[at + i];
      if (v === undefined || v !== finderish[i]) return false;
    }
    return true;
  };
  const scanLine = (line) => {
    let total = 0;
    for (let i = 0; i + finderish.length <= line.length; i++) {
      if (matches(line, i)) total += 40;
      const reversed = finderish.slice().reverse();
      let rev = true;
      for (let j = 0; j < reversed.length; j++) if (line[i + j] !== reversed[j]) { rev = false; break; }
      if (rev) total += 40;
    }
    return total;
  };
  for (let y = 0; y < size; y++) score += scanLine(modules[y]);
  for (let x = 0; x < size; x++) score += scanLine(modules.map((row) => row[x]));

  let dark = 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (modules[y][x]) dark++;
  const pct = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(pct - 50) / 5) * 10;

  return score;
}

function writeFormatAndVersion(modules, size, version, mask) {
  const bits = formatBits(mask);
  const bit = (i) => ((bits >>> i) & 1) === 1;

  for (let i = 0; i <= 5; i++) modules[8][i] = bit(i);
  modules[8][7] = bit(6);
  modules[8][8] = bit(7);
  modules[7][8] = bit(8);
  for (let i = 9; i < 15; i++) modules[14 - i][8] = bit(i);

  for (let i = 0; i < 8; i++) modules[size - 1 - i][8] = bit(i);
  for (let i = 8; i < 15; i++) modules[8][size - 15 + i] = bit(i);
  modules[size - 8][8] = true;

  if (version >= 7) {
    const vbits = versionBits(version);
    for (let i = 0; i < 18; i++) {
      const on = ((vbits >>> i) & 1) === 1;
      modules[Math.floor(i / 3)][size - 11 + (i % 3)] = on;
      modules[size - 11 + (i % 3)][Math.floor(i / 3)] = on;
    }
  }
}

export function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(String(text)));
  const version = pickVersion(bytes.length);
  const codewords = interleave(encodeData(bytes, version), version);

  const { size, modules, reserved } = buildFunctionModules(version);
  placeData(modules, reserved, size, codewords);

  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const candidate = modules.map((row, y) => row.map((v, x) => (reserved[y][x] ? v : v !== maskAt(mask, x, y))));
    writeFormatAndVersion(candidate, size, version, mask);
    const score = penalty(candidate, size);
    if (!best || score < best.score) best = { score, mask, modules: candidate };
  }

  return { size, version, mask: best.mask, modules: best.modules.map((row) => row.map(Boolean)) };
}

// Convenience: an <svg> path string for the dark modules, 1 unit per module.
export function qrPath(matrix) {
  const parts = [];
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (matrix.modules[y][x]) parts.push(`M${x},${y}h1v1h-1z`);
    }
  }
  return parts.join("");
}
