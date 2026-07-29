'use server'

import { redirect } from 'next/navigation'
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

const EMOTION_MAP: Record<string, { label: string; color: string; emoji: string }> = {
  happiness: { label: '기쁨', color: '#FFD93D', emoji: '😊' },
  neutral: { label: '평온', color: '#A8D8EA', emoji: '😌' },
  sadness: { label: '슬픔', color: '#6C8EBF', emoji: '😢' },
  angry: { label: '분노', color: '#FF6B6B', emoji: '😠' },
  disgust: { label: '혐오', color: '#9B8EA8', emoji: '🤢' },
  fear: { label: '불안', color: '#B8860B', emoji: '😨' },
  surprise: { label: '설렘', color: '#FF9F43', emoji: '😲' },
}

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

  // 파인튜닝 모델 감정 분석
  let emotion: { emotion_label: string; emotion_color: string; emotion_emoji: string }

  try {
    const HF_MODEL = 'Hanna-artemis/korean-emotion-diary'
    const HF_TOKEN = process.env.HF_TOKEN

    console.log('HF_TOKEN 존재:', !!HF_TOKEN)
    console.log('요청 URL:', `https://api-inference.huggingface.co/models/${HF_MODEL}`)

    // 콜드 스타트 대비 재시도 (모델 로딩 중이면 503 반환)
    let result: { label: string; score: number }[][] | undefined
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: content }),
      })

      if (response.status === 503) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        continue
      }

      if (!response.ok) throw new Error(`HF API error: ${response.status}`)

      result = await response.json()
      break
    }

    if (!result) throw new Error('모델 로딩 타임아웃')

    // result: [[{label, score}, ...]] 형태로 반환
    const topLabel = result[0][0].label
    const mapped = EMOTION_MAP[topLabel] ?? { label: '평온', color: '#A8D8EA', emoji: '😌' }

    emotion = {
      emotion_label: mapped.label,
      emotion_color: mapped.color,
      emotion_emoji: mapped.emoji,
    }
  } catch (e) {
    console.error('[createDiary] HF API error:', e)
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
