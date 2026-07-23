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

-- diary_photos 테이블 생성 (일기에 첨부된 사진)
create table diary_photos (
  id           uuid default gen_random_uuid() primary key,
  diary_id     uuid references diaries on delete cascade not null,
  user_id      uuid references auth.users not null,
  storage_path text not null,   -- Storage 버킷(diary-photos) 내 경로
  position     int not null default 0,  -- 첨부 순서 (작을수록 먼저 첨부됨)
  created_at   timestamp with time zone default now()
);

alter table diary_photos enable row level security;

create policy "본인 사진만 조회" on diary_photos
  for select using (auth.uid() = user_id);

create policy "본인 사진만 삽입" on diary_photos
  for insert with check (auth.uid() = user_id);

create policy "본인 사진만 삭제" on diary_photos
  for delete using (auth.uid() = user_id);

-- diary-photos Storage 버킷 생성 (private)
insert into storage.buckets (id, name, public)
values ('diary-photos', 'diary-photos', false)
on conflict (id) do nothing;

-- 본인 폴더(user_id/...)에만 업로드/조회/삭제 가능
create policy "본인 폴더에만 업로드" on storage.objects
  for insert with check (
    bucket_id = 'diary-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "본인 폴더만 조회" on storage.objects
  for select using (
    bucket_id = 'diary-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "본인 폴더만 삭제" on storage.objects
  for delete using (
    bucket_id = 'diary-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
