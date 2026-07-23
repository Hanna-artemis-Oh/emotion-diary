'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export default function PhotoFilmStrip({ photos }: { photos: { id: string; url: string }[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const draggedRef = useRef(false)
  const startXRef = useRef(0)
  const startScrollLeftRef = useRef(0)

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = trackRef.current
    if (!el) return
    isDraggingRef.current = true
    draggedRef.current = false
    startXRef.current = e.clientX
    startScrollLeftRef.current = el.scrollLeft
    el.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return
    const el = trackRef.current
    if (!el) return
    const delta = e.clientX - startXRef.current
    if (Math.abs(delta) > 5) draggedRef.current = true
    el.scrollLeft = startScrollLeftRef.current - delta
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    isDraggingRef.current = false
    trackRef.current?.releasePointerCapture(e.pointerId)
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
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
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex(null)
            }}
            aria-label="닫기"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white text-xl flex items-center justify-center hover:bg-white/20 transition-colors"
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
              className="absolute left-2 sm:left-4 w-10 h-10 rounded-full bg-white/10 text-white text-2xl flex items-center justify-center hover:bg-white/20 transition-colors"
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
              className="absolute right-2 sm:right-4 w-10 h-10 rounded-full bg-white/10 text-white text-2xl flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  )
}
