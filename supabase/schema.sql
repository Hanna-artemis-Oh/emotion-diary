-- diaries 테이블 생성
create table diaries (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users not null,
  title        text,
  content      text not null,
  emotion_label text,   -- 감정 레이블 (기쁨, 슬픔, 불안 등)
  emotion_color text,   -- HEX 색상 코드 (#RRGGBB)
  emotion_emoji text,   -- 이모지
  created_at   timestamp with time zone default now()
);

-- RLS 활성화
alter table diaries enable row level security;

-- 본인 일기만 조회
create policy "본인 일기만 조회" on diaries
  for select using (auth.uid() = user_id);

-- 본인 일기만 삽입
create policy "본인 일기만 삽입" on diaries
  for insert with check (auth.uid() = user_id);

-- 본인 일기만 수정
create policy "본인 일기만 수정" on diaries
  for update using (auth.uid() = user_id);

-- 본인 일기만 삭제
create policy "본인 일기만 삭제" on diaries
  for delete using (auth.uid() = user_id);
