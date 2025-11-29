// ltmemory.js
import lancedb from "@lancedb/lancedb";
import { client } from "./openai.js";
import crypto from "crypto";

let db, table;

export async function initLongTermMemory() {
  console.log("🚀 LanceDB 초기화 시작");

  db = await lancedb.connect("./vectordb");

  const tables = await db.tableNames();
  if (tables.includes("memory")) {
    console.log("⚠ 기존 memory 테이블 삭제");
    await db.dropTable("memory");
  }

  console.log("📦 새로운 memory 테이블 생성");
  table = await db.createTable("memory", [
    {
      id: "init",
      userId: "system",
      category: "system",
      summary: "init",
      importance: 0,
      embedding: new Array(1536).fill(0),
      original: "",
      createdAt: new Date().toISOString()
    }
  ]);

  console.log("✅ LanceDB 초기화 완료");
}

// =======================================
// 🔥 1) 임베딩 함수 (필수)
// =======================================
async function embedText(text) {
  const e = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return e.data[0].embedding;
}

// =======================================
// 🔥 2) 장기기억 저장
// =======================================
export async function saveMemory(userId, category, summary, importance, original) {
  const embedding = await embedText(summary);

  await table.add([{
    id: crypto.randomUUID(),
    userId,
    category,
    summary,
    importance,
    embedding,
    original,
    createdAt: new Date().toISOString()
  }]);

  console.log(`💾 저장됨(${category}):`, summary);
}

// ============ 3) 장기 기억 검색 ==============
export async function searchLongTermMemory(userId, text, topK = 5) {
  try {
    const queryEmbedding = await embedText(text);

    const results = await table
      .search(queryEmbedding)
      .where(`"userId" = '${userId}' OR "userId" = 'ai'`)
      .limit(topK)
      .execute();

    const rows = [];
    for await (const row of results) {
      rows.push(row);
    }

    return rows.map(r => r.summary);

  } catch (err) {
    console.error("❌ 장기기억 검색 오류:", err);
    return [];
  }
}



// =======================================
// 🔥 4) 규칙 기반 자동 저장: 유저 정보 추출
// =======================================
export function extractUserInfo(text) {
  const rules = [];

  const nameMatch = text.match(/내\s*이름은\s*([가-힣A-Za-z0-9]+)/);
  if (nameMatch)
    rules.push({
      category: "user:name",
      summary: `유저 이름은 ${nameMatch[1]}`,
      importance: 0.9
    });

  const ageMatch = text.match(/(\d+)\s*살/);
  if (ageMatch)
    rules.push({
      category: "user:age",
      summary: `유저 나이는 ${ageMatch[1]}살`,
      importance: 0.7
    });

  if (text.includes("좋아해") || text.includes("좋아함"))
    rules.push({
      category: "user:favor",
      summary: `유저의 취향 관련 정보: ${text}`,
      importance: 0.6
    });

  if (text.match(/기분|슬퍼|피곤|우울|행복/))
    rules.push({
      category: "user:emotion",
      summary: `유저 감정 정보: ${text}`,
      importance: 0.8
    });

  return rules;
}

// =======================================
// 🔥 5) AI 정보 추출
// =======================================
export function extractAiInfo(text) {
  const rules = [];

  if (text.includes("나는") || text.includes("내 성격은"))
    rules.push({
      category: "ai:self",
      summary: text,
      importance: 0.5
    });

  return rules;
}
