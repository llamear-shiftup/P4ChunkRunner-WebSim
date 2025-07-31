// main.js (Sharding + AnchorCDC 모두 정리된 버전)

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

function runSharding(keys, digit = 1) {
  const buckets = {};
  for (const key of keys) {
    const h = computeHash("LocalizedStringsSystem", key);
    const hex = h.toString(16).padStart(16, "0");
    const prefix = hex.substring(0, digit);
    if (!buckets[prefix]) buckets[prefix] = [];
    buckets[prefix].push(key);
  }
  const labels = Object.keys(buckets).map(p => `Shard ${p}`);
  renderChunks(Object.values(buckets), labels);
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

function renderChunks(chunks, labels = []) {
  const result = document.getElementById("resultArea");
  result.innerHTML = "";

  chunks.forEach((chunk, idx) => {
    const label = labels[idx] || `Chunk ${idx}`;
    const shardClass = label.match(/Shard (\w+)/)?.[1]?.toLowerCase() || "x";

    const div = document.createElement("div");
    div.innerHTML = `<strong>${label}:</strong> `;
    chunk.forEach(key => {
      div.innerHTML += `<span class="chunk shard shard-${shardClass}">${key}</span>`;
    });
    result.appendChild(div);
  });
}


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
    renderChunks(chunks); // label: Chunk 1, Chunk 2, ...
  } else {
    runSharding(keys, 1); // label: Shard a, Shard b, ...
  }
}

function generateRandomKeys(count) {
  const keys = [];
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 1; i <= count; i++) {
    const suffix = Array.from({ length: 4 }, () => charset[Math.floor(Math.random() * charset.length)]).join("");
    keys.push(`Key${suffix}`);
  }
  document.getElementById("inputKeys").value = keys.join("\n");
}
