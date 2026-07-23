'use server'

import { redirect } from 'next/navigation'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export type DiaryActionState = { error: string } | null

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

  redirect(`/diary/${data.id}`)
}
