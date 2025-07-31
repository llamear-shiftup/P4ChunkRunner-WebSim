function runSimulation() {
  const raw = document.getElementById("key-input").value;
  const keys = raw.split(",").map(k => k.trim()).filter(Boolean);

  // AnchorCDC: fixed size chunking 예시 (e.g., maxEntries=3)
  const anchorChunks = [];
  let current = [];
  for (let i = 0; i < keys.length; i++) {
    current.push(keys[i]);
    if (current.length >= 3) {
      anchorChunks.push([...current]);
      current = [];
    }
  }
  if (current.length > 0) anchorChunks.push(current);

  // Sharding: prefix로 그룹화 (1자리 hash simulation)
  const shardBuckets = {};
  keys.forEach(key => {
    const prefix = key.charCodeAt(0).toString(16)[0]; // 간단한 해시 대체
    if (!shardBuckets[prefix]) shardBuckets[prefix] = [];
    shardBuckets[prefix].push(key);
  });

  const shardingChunks = Object.values(shardBuckets);

  // 출력
  document.getElementById("anchorcdc-output").textContent =
    anchorChunks.map(c => `[${c.join(", ")}]`).join("\n");

  document.getElementById("sharding-output").textContent =
    shardingChunks.map(c => `[${c.join(", ")}]`).join("\n");
}
