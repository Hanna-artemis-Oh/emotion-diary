import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900 hover:opacity-70 transition-opacity">
            🌈 감정 일기
          </Link>
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
