# 🌈 Emotion Diary
> 오늘 하루를 기록하면, AI가 감정을 읽어드립니다.

일기를 작성하면 Claude AI가 감정을 분석하고, 그에 맞는 색상과 이모지로 감정을 시각화해주는 웹 앱입니다.  
ADHD로 인한 감정 인식 어려움을 보완하고, 내 감정 패턴을 돌아볼 수 있도록 돕는 개인 프로젝트입니다.

---

## ✨ 주요 기능

- **일기 작성** — 오늘 있었던 일을 자유롭게 기록
- **AI 감정 분석** — Claude API(Haiku 4.5)가 일기를 읽고 감정 레이블 분류
- **감정 시각화** — 감정에 맞는 색상 + 이모지로 직관적으로 표현
- **히스토리** — 날짜별 일기 목록과 감정 기록 보관
- **감정 통계** — 기간별 감정 변화 그래프로 내 패턴 파악
- **구글 로그인** — Supabase Auth 기반 간편 로그인

---

## 🛠 기술 스택

| 역할 | 기술 |
|------|------|
| 프론트엔드 | Next.js 15 + TypeScript + Tailwind CSS |
| AI 감정 분석 | Claude API (claude-haiku-4-5) |
| 인증 + DB | Supabase (Auth + PostgreSQL) |
| 배포 | Vercel |
| 개발 도구 | Claude Code |

---

## 🗂 프로젝트 구조

```
emotion-diary/
├── app/
│   ├── (auth)/
│   │   └── login/          # 구글 로그인 페이지
│   ├── diary/
│   │   ├── new/            # 일기 작성 페이지
│   │   └── [id]/           # 일기 상세 + 감정 결과
│   ├── history/            # 날짜별 히스토리 목록
│   ├── stats/              # 감정 통계 그래프
│   └── api/
│       └── analyze/        # Claude API 감정 분석 엔드포인트
├── components/
│   ├── EmotionCard.tsx     # 감정 결과 카드 (레이블 + 색상 + 이모지)
│   ├── DiaryEditor.tsx     # 일기 작성 에디터
│   └── EmotionChart.tsx    # 감정 통계 차트
├── lib/
│   ├── supabase.ts         # Supabase 클라이언트
│   └── claude.ts           # Claude API 호출
└── .env.local              # 환경변수 (Git 제외)
```

---

## 🚀 로컬 실행 방법

**1. 저장소 클론**
```bash
git clone https://github.com/{your-username}/emotion-diary.git
cd emotion-diary
```

**2. 패키지 설치**
```bash
npm install
```

**3. 환경변수 설정**

`.env.local` 파일을 생성하고 아래 값을 입력하세요:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-claude-api-key
```

**4. 개발 서버 실행**
```bash
npm run dev
```

`http://localhost:3000` 에서 확인하세요.

---

## 🗄 DB 스키마 (Supabase)

```sql
-- 일기 테이블
create table diaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text,
  content text not null,
  emotion_label text,         -- 감정 레이블 (기쁨, 슬픔, 불안 등)
  emotion_color text,         -- HEX 색상 코드
  emotion_emoji text,         -- 이모지
  created_at timestamp with time zone default now()
);

-- RLS 설정 (본인 일기만 접근 가능)
alter table diaries enable row level security;

create policy "본인 일기만 접근" on diaries
  for all using (auth.uid() = user_id);
```

---

## 🔮 향후 계획 (Phase 2)

- [ ] 미니 감정 분류 모델 개발 및 Claude API 대체
- [ ] 감정 기반 음악 / 콘텐츠 추천
- [ ] 푸시 알림 (일기 작성 리마인더)

---

## 📝 개발 배경

ADHD 증상으로 인해 하루의 감정을 인식하고 정리하는 것이 어렵게 느껴질 때가 많았어요.  
일기를 쓰면서 AI가 감정을 대신 읽어주고, 시각적으로 보여주면 어떨까 하는 아이디어에서 시작했습니다.  
바이브 코딩 스터디 첫 번째 프로젝트로, Claude Code를 활용해 개발했습니다.

---

## 📄 License

MIT
