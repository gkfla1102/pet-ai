import fs from "fs";
import path from "path";

const memoryPath = path.join(process.cwd(), "memory.json");

// 파일 초기 생성
if (!fs.existsSync(memoryPath)) {
  fs.writeFileSync(memoryPath, JSON.stringify({ short: {} }, null, 2));
}

function load() {
  const data = JSON.parse(fs.readFileSync(memoryPath, "utf-8"));

  // 안전장치: short 없으면 생성
  if (!data.short) data.short = {};

  return data;
}

function save(data) {
  fs.writeFileSync(memoryPath, JSON.stringify(data, null, 2));
}

export function saveShortTerm(userId, text) {
  const db = load();

  if (!db.short[userId]) db.short[userId] = [];

  db.short[userId].push({
    text,
    time: new Date().toISOString(),
  });

  if (db.short[userId].length > 1000)
    db.short[userId] = db.short[userId].slice(-1000);

  save(db);
}

export function getRecentShortTerm(userId, limit = 20) {
  const db = load();
  const logs = db.short[userId] || [];
  return logs.slice(-limit).map(v => v.text);
}
