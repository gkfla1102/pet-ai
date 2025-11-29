import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { client } from "./openai.js";
import { saveShortTerm, getRecentShortTerm } from "./memory.js";

import {
  initLongTermMemory,
  saveMemory,
  searchLongTermMemory,
  extractUserInfo,
  extractAiInfo
} from "./ltmemory.js";

import { buildPrompt } from "./prompt.js";
import { defaultState, updateState } from "./state.js";

console.log("🚀 서버 시작");
await initLongTermMemory();

const app = express();
app.use(express.json());

// 경로 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const userStates = {};
const timers = {};


// ------------------------------------------------------
// 🔍 검색 의도 판단 (gpt-5.1)
// ------------------------------------------------------
async function detectSearchIntent(message) {
  const prompt = `
다음 문장이 "웹 검색이 필요한 말"인지 판단해줘.

형식:
search: yes/no
query: 검색해야 할 핵심 키워드(짧게)

문장: "${message}"
  `;

  const r = await client.responses.create({
    model: "gpt-5.1",
    input: prompt
  });

  const text = r.output_text;

  const isSearch = /search:\s*yes/i.test(text);
  const query = text.match(/query:\s*(.*)/i)?.[1]?.trim() || null;

  return { isSearch, query };
}



// ------------------------------------------------------
// 🔥 “대화 흐름 기반 자동발화” (gpt-5.1)
// ------------------------------------------------------
function scheduleAutoReply(userId, send) {
  if (timers[userId]) clearTimeout(timers[userId]);

  timers[userId] = setTimeout(async () => {

    const recent = getRecentShortTerm(userId, 5)
      .map(v => v.text)
      .join("\n");

    const prompt = `
유저가 잠시 조용해졌어.
아래는 최근 대화 내용이야:

${recent}

너는 유저와 편하게 대화하는 AI야.
👉 지금 이야기 흐름을 자연스럽게 이어서 1문장만 말해줘.
새로운 주제 시작하지 마.
`;

    const r = await client.responses.create({
      model: "gpt-5.1",
      input: prompt
    });

    const msg = r.output_text.trim();

    saveShortTerm(userId, msg);
    send(msg);

  }, 60000);
}



// ------------------------------------------------------
// 🔥 /chat (메인 처리) — 전체 gpt-5.1 통일
// ------------------------------------------------------
app.post("/chat", async (req, res) => {
  const { userId, message } = req.body;

  if (!userStates[userId]) userStates[userId] = { ...defaultState };

  scheduleAutoReply(userId, () => null);

  saveShortTerm(userId, message);

  // 자동 유저 정보 저장
  const urules = extractUserInfo(message);
  for (const r of urules)
    await saveMemory(userId, r.category, r.summary, r.importance, message);

  // 기억
  const short = getRecentShortTerm(userId, 100);
  const long = await searchLongTermMemory(userId, message);

  // 상태 업데이트
  const state = updateState(userStates[userId], message);
  userStates[userId] = state;

  // 검색 의도 판단
  const { isSearch, query } = await detectSearchIntent(message);

  let searchResult = null;


  // ------------------------------------------------------
  // 🌐 gpt-5.1 웹 검색 (사실 데이터만 추출)
  // ------------------------------------------------------
  if (isSearch && query) {
    try {
      const resp = await client.responses.create({
        model: "gpt-5.1",
        input: [
          {
            role: "user",
            content: `웹 검색으로 "${query}" 정보를 찾아줘.`
          }
        ],
        tools: [
          { type: "web_search" }
        ]
      });

      searchResult =
        resp.output_text ??
        resp.output?.[0]?.content?.[0]?.text ??
        "검색 결과 없음";

    } catch (err) {
      console.log("❌ 검색 오류:", err);
      searchResult = "검색 오류";
    }
  }


  // ------------------------------------------------------
  // 🔥 최종 응답: buildPrompt + gpt-5.1 단일 생성
  // ------------------------------------------------------
  const finalPrompt = buildPrompt(short, long, state, message, searchResult);

  const gpt = await client.responses.create({
    model: "gpt-5.1",
    input: finalPrompt
  });

  const reply = gpt.output_text;


  // AI 정보 자동 저장
  const arules = extractAiInfo(reply);
  for (const r of arules)
    await saveMemory("ai", r.category, r.summary, r.importance, reply);

  saveShortTerm(userId, reply);

  res.json({ reply, state });
});



// ------------------------------------------------------
// 서버 시작
// ------------------------------------------------------
app.listen(3000, () =>
  console.log("🐾 Pet AI running (FULL GPT-5.1 MODE) at http://localhost:3000")
);
