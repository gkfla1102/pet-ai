export async function styleToDC(text) {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
너는 '대답 말투 변환기'다.
입력된 문장을 '디시인사이드 말투'로 자연스럽게 변환해라.

규칙:
- 문장은 짧고 툭 끊어지게.
- 과한 친절 금지.
- 상담사, 선생님 말투 절대 금지.
- 과도한 이모티콘 금지.
- 말투는 무심하거나 담백하게.
- "ㅇㅇ", "그렇다", "그럼", "뭐" 같은 표현 허용.
- 비속어나 모욕적 표현은 금지.
- 문장은 1~2문장만.
`
      },
      { role: "user", content: text }
    ]
  });

  return res.choices[0].message.content;
}
