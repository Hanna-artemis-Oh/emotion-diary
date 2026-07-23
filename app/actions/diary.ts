'use server'

import { redirect } from 'next/navigation'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export type DiaryActionState = { error: string } | null

async function uploadDiaryPhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  diaryId: string,
  files: File[],
  startPosition: number
) {
  const rows: { diary_id: string; user_id: string; storage_path: string; position: number }[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const ext = file.name.split('.').pop() || 'jpg'
    const position = startPosition + i
    const path = `${userId}/${diaryId}/${position}-${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('diary-photos')
      .upload(path, file, { contentType: file.type || undefined })

    if (uploadError) {
      console.error('[uploadDiaryPhotos] upload error:', uploadError)
      continue
    }
    rows.push({ diary_id: diaryId, user_id: userId, storage_path: path, position })
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('diary_photos').insert(rows)
    if (error) console.error('[uploadDiaryPhotos] insert error:', error)
  }
}

const EMOTION_PROMPT = `사용자의 일기를 읽고 주요 감정을 분석하세요.
아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "emotion_label": "감정 이름 (기쁨/슬픔/불안/분노/평온/설렘/피곤/외로움/감사/뿌듯함 중 가장 적합한 하나)",
  "emotion_color": "감정에 어울리는 HEX 색상 코드 (예: #FFD93D)",
  "emotion_emoji": "감정을 나타내는 이모지 하나"
}`

export async function createDiary(
  _prevState: DiaryActionState,
  formData: FormData
): Promise<DiaryActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const title = (formData.get('title') as string).trim()
  const content = (formData.get('content') as string).trim()
  const date = (formData.get('date') as string) || new Date().toISOString().slice(0, 10)

  if (!content) return { error: '일기 내용을 입력해주세요.' }
  if (date > new Date().toISOString().slice(0, 10)) {
    return { error: '미래 날짜는 선택할 수 없습니다.' }
  }

  // Claude Haiku 감정 분석
  const anthropic = new Anthropic()
  let emotion: { emotion_label: string; emotion_color: string; emotion_emoji: string }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `${EMOTION_PROMPT}\n\n일기:\n${content}`,
        },
      ],
    })

    const block = message.content[0]
    if (block.type !== 'text') return { error: '감정 분석에 실패했습니다.' }

    const cleaned = block.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    emotion = JSON.parse(cleaned)
  } catch (e) {
    console.error('[createDiary] Claude API error:', e)
    return { error: '감정 분석 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }

  // Supabase 저장
  const { data, error } = await supabase
    .from('diaries')
    .insert({
      user_id: user.id,
      title: title || null,
      content,
      emotion_label: emotion.emotion_label,
      emotion_color: emotion.emotion_color,
      emotion_emoji: emotion.emotion_emoji,
      created_at: `${date}T00:00:00.000Z`,
    })
    .select('id')
    .single()

  if (error) return { error: '저장에 실패했습니다. 다시 시도해주세요.' }

  // 첨부 사진 업로드 (선택된 순서대로 position 부여)
  const photos = formData.getAll('photos').filter(
    (f): f is File => f instanceof File && f.size > 0
  )

  if (photos.length > 0) {
    await uploadDiaryPhotos(supabase, user.id, data.id, photos, 0)
  }

  redirect(`/diary/${data.id}`)
}

export async function updateDiary(
  diaryId: string,
  _prevState: DiaryActionState,
  formData: FormData
): Promise<DiaryActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const title = (formData.get('title') as string).trim()
  const content = (formData.get('content') as string).trim()

  if (!content) return { error: '일기 내용을 입력해주세요.' }

  const { error } = await supabase
    .from('diaries')
    .update({ title: title || null, content })
    .eq('id', diaryId)
    .eq('user_id', user.id)

  if (error) return { error: '수정에 실패했습니다. 다시 시도해주세요.' }

  // 제거된 기존 사진 삭제 (Storage + 레코드)
  const removedPhotoIds = formData.getAll('removedPhotoIds') as string[]
  if (removedPhotoIds.length > 0) {
    const { data: photosToRemove } = await supabase
      .from('diary_photos')
      .select('id, storage_path')
      .in('id', removedPhotoIds)
      .eq('diary_id', diaryId)
      .eq('user_id', user.id)

    if (photosToRemove && photosToRemove.length > 0) {
      await supabase.storage
        .from('diary-photos')
        .remove(photosToRemove.map((p) => p.storage_path))
      await supabase
        .from('diary_photos')
        .delete()
        .in('id', photosToRemove.map((p) => p.id))
    }
  }

  // 새로 추가된 사진 업로드 (기존 사진 뒤에 이어 붙임)
  const newPhotos = formData.getAll('newPhotos').filter(
    (f): f is File => f instanceof File && f.size > 0
  )

  if (newPhotos.length > 0) {
    const { data: lastPhoto } = await supabase
      .from('diary_photos')
      .select('position')
      .eq('diary_id', diaryId)
      .order('position', { ascending: false })
      .limit(1)

    const startPosition = (lastPhoto?.[0]?.position ?? -1) + 1
    await uploadDiaryPhotos(supabase, user.id, diaryId, newPhotos, startPosition)
  }

  redirect(`/diary/${diaryId}`)
}

export async function deleteDiary(diaryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: photos } = await supabase
    .from('diary_photos')
    .select('storage_path')
    .eq('diary_id', diaryId)
    .eq('user_id', user.id)

  if (photos && photos.length > 0) {
    await supabase.storage.from('diary-photos').remove(photos.map((p) => p.storage_path))
  }

  await supabase.from('diaries').delete().eq('id', diaryId).eq('user_id', user.id)

  redirect('/history')
}
