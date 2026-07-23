'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export default function PhotoFilmStrip({ photos }: { photos: { id: string; url: string }[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const draggedRef = useRef(false)

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // 데스크톱 마우스 드래그 스크롤. 터치 기기는 overflow-x-auto의 네이티브 스와이프로 동작하므로
  // 별도 처리가 필요 없고, setPointerCapture를 쓰면 클릭 이벤트가 컨테이너로 리타겟되어
  // 썸네일의 onClick이 아예 발생하지 않기 때문에 mouse 이벤트로 구현한다.
  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const el = trackRef.current
    if (!el) return
    draggedRef.current = false
    const startX = e.clientX
    const startScrollLeft = el.scrollLeft

    function handleMouseMove(moveEvent: MouseEvent) {
      const delta = moveEvent.clientX - startX
      if (Math.abs(delta) > 5) draggedRef.current = true
      el!.scrollLeft = startScrollLeft - delta
    }

    function handleMouseUp() {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  function openLightbox(index: number) {
    if (draggedRef.current) return
    setLightboxIndex(index)
  }

  function showPrev() {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length))
  }

  function showNext() {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length))
  }

  useEffect(() => {
    if (lightboxIndex === null) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft') showPrev()
      if (e.key === 'ArrowRight') showNext()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex])

  if (photos.length === 0) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <p className="text-sm font-semibold text-gray-900 mb-3">사진 {photos.length}장</p>

      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        className="flex gap-2 overflow-x-auto cursor-grab active:cursor-grabbing select-none"
      >
        {photos.map((photo, index) => (
          <div key={photo.id} className="relative shrink-0 w-28 h-28">
            <Image
              src={photo.url}
              alt={`첨부 사진 ${index + 1}`}
              fill
              draggable={false}
              onClick={() => openLightbox(index)}
              sizes="112px"
              className="object-cover rounded-xl border border-gray-100 cursor-pointer"
            />
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="touch-manipulation fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex(null)
            }}
            aria-label="닫기"
            className="touch-manipulation absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-black/60 text-white text-xl flex items-center justify-center border border-white/20 hover:bg-black/80 transition-colors"
          >
            ✕
          </button>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                showPrev()
              }}
              aria-label="이전 사진"
              className="touch-manipulation absolute left-4 z-10 w-11 h-11 rounded-full bg-black/60 text-white text-2xl flex items-center justify-center border border-white/20 hover:bg-black/80 transition-colors"
            >
              ‹
            </button>
          )}

          <div
            className="relative w-full h-full max-w-4xl max-h-[85vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[lightboxIndex].url}
              alt={`첨부 사진 ${lightboxIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                showNext()
              }}
              aria-label="다음 사진"
              className="touch-manipulation absolute right-4 z-10 w-11 h-11 rounded-full bg-black/60 text-white text-2xl flex items-center justify-center border border-white/20 hover:bg-black/80 transition-colors"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  )
}
