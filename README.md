# Pet AI — Memory-Based Personal Chatbot

이 프로젝트는 사용자의 말투를 유지하고, 단기·장기 기억을 저장하며,
필요할 때 GPT-5.1 검색까지 수행하는 개인 맞춤형 AI 챗봇입니다.

---

## 주요 기능

### 1) 단기 기억 (Short-Term Memory)
- 최근 대화 최대 1000개 메시지까지 저장
- 서버 재시작 후에도 대화 흐름 유지
- 문맥 기반 자연스러운 대화 가능

### 2) 장기 기억 (Long-Term Memory)
- LanceDB 기반 벡터 저장소 사용
- 사용자의 특징·성향·중요 정보를 요약하여 저장
- 이후 대화에서 유저 정보를 활용해 일관된 성격 유지

### 3) GPT-5.1 웹 검색 기능
- 사용자가 요청하면 GPT-5.1 Tools 기능을 사용해 최신 정보 검색
- 검색 결과를 캐릭터 말투에 맞게 자연스럽게 반영

### 4) 말투 및 캐릭터 일관성 유지
- AI 말투를 배제한 자연스러운 캐릭터 말투 유지
- 반말, 카톡 말투, 밈 스타일
- 설명체·과한 친절·호들갑 금지 등 캐릭터 제약 포함

---

## 프로젝트 구조

pet-ai/
├── server.js
├── openai.js
├── prompt.js
├── memory.js
├── ltmemory.js
├── state.js
├── styleToDC.js
├── auto.js
├── public/
├── package.json
├── package-lock.json
└── .gitignore



---

## 실행 방법

### 1) 패키지 설치
npm install

### 2) 서버 실행
npm start

### 3) 접속 주소
http://localhost:3000

---

## 보안 관련
- .gitignore를 통해 memory.json, vectordb/, *.db, node_modules/ 등
  민감 데이터 및 불필요한 파일이 GitHub에 업로드되지 않도록 설정되어 있습니다.
- OpenAI API 키는 코드에 포함되지 않으며 OS 환경 변수를 통해 불러옵니다.

---

## License
MIT License

---

## 참고
이 프로젝트는 “기억을 갖고 말투를 유지하는 개인형 챗봇”을 목표로 설계되었습니다.
