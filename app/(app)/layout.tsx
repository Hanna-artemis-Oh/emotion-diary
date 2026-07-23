import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5 min-w-0">
            <Link href="/" className="text-lg font-bold text-gray-900 hover:opacity-70 transition-opacity shrink-0">
              🌈 감정 일기
            </Link>
            <nav className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 overflow-x-auto">
              <Link href="/history" className="hover:text-gray-900 transition-colors whitespace-nowrap">히스토리</Link>
              <Link href="/stats" className="hover:text-gray-900 transition-colors whitespace-nowrap">감정 통계</Link>
              <Link href="/photos" className="hover:text-gray-900 transition-colors whitespace-nowrap">사진</Link>
            </nav>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>
      {children}
    </>
  )
}
