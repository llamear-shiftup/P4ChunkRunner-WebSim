// main.js (수정된 Anchor 기반 HashCDC 버전 포함 전체 코드)

function runChunking() {
  const raw = document.getElementById("inputKeys").value;
  const keys = raw.split("\n").map(k => k.trim()).filter(k => k.length > 0);

  const strategy = document.getElementById("strategy").value;
  const minEntries = parseInt(document.getElementById("minEntries").value);
  const maskBits = parseInt(document.getElementById("maskBits").value);
  const maxEntries = parseInt(document.getElementById("maxEntries").value);

  let chunks = [];
  if (strategy === "hashcdc") {
    chunks = runAnchorCDC(keys, minEntries, maskBits, maxEntries);
  } else {
    chunks = runSharding(keys, 1); // digit=1
  }

  renderChunks(chunks);
}

function runAnchorCDC(keys, minEntries, maskBits, maxEntries, fallbackSplitFactor = 3) {
  const chunks = [];
  const mask = maskBits >= 64 ? BigInt("0xffffffffffffffff") : (BigInt(1) << BigInt(maskBits)) - BigInt(1);

  let current = [];
  let sinceAnchor = 0;
  const fallbackThreshold = fallbackSplitFactor > 0 ? Math.max(minEntries * fallbackSplitFactor, maxEntries) : Infinity;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    current.push(key);
    sinceAnchor++;

    const h = computeHash("", key);
    const isAnchor = (h & mask) === BigInt(0);
    const isLongEnough = current.length >= minEntries;
    const isTooLong = current.length >= maxEntries;
    const isOverFallback = sinceAnchor >= fallbackThreshold;

    if (isTooLong || (isLongEnough && (isAnchor || isOverFallback))) {
      chunks.push(current);
      current = [];
      sinceAnchor = 0;
    }
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}

function runSharding(keys, digit) {
  const buckets = {};
  for (const key of keys) {
    const h = computeHash("LocalizedStringsSystem", key);
    const hex = h.toString(16).padStart(16, "0");
    const prefix = hex.substring(0, digit);
    if (!buckets[prefix]) buckets[prefix] = [];
    buckets[prefix].push(key);
  }
  return Object.values(buckets);
}

function computeHash(className, key) {
  const FNV_OFFSET = BigInt("14695981039346656037");
  const FNV_PRIME = BigInt("1099511628211");
  let hash = FNV_OFFSET;
  const input = new TextEncoder().encode(className + key);
  for (const byte of input) {
    hash ^= BigInt(byte);
    hash *= FNV_PRIME;
  }
  return hash;
}

function renderChunks(chunks) {
  const result = document.getElementById("resultArea");
  result.innerHTML = "";

  chunks.forEach((chunk, idx) => {
    const div = document.createElement("div");
    div.className = "chunk";
    div.innerHTML = `<strong>Chunk ${idx + 1}</strong><br>${chunk.join("<br>")}`;
    result.appendChild(div);
  });
}
