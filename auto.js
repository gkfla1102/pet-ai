import { client } from "./openai.js";
import { saveMemory, retrieveMemory } from "./memory.js";
import { updateState } from "./state.js";
import { buildPrompt } from "./prompt.js";

export const AUTO_CHAT_DELAY = 15000; // 15초 동안 입력 없으면 자동 발화
export const userTimers = {};
export const autoTriggered = {}; 

export function resetUserTimer(userId) {
  userTimers[userId] = Date.now();
  autoTriggered[userId] = false;
}

export async function checkAutoChat(userId, userStates) {
  const last = userTimers[userId];
  if (!last) return;

  const now = Date.now();

  // 아직 타이머가 안 지났으면 무시
  if (now - last < AUTO_CHAT_DELAY) return;

  // 이미 자동발화 했으면 다시 하지 않음
  if (autoTriggered[userId]) return;

  autoTriggered[userId] = true;

  // 자동 발화 처리
  const memories = await retrieveMemory(userId, "최근 분위기");
  const state = userStates[userId];

  const prompt = buildPrompt(memories, state, "조용히 있을 때 스스로 한마디 해줘");

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  const reply = res.choices[0].message.content;

  // 기억 저장
  await saveMemory(userId, reply);

  console.log(`(auto) ${userId}: ${reply}`);

  return reply;
}
