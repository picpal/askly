'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
export default function Header() {
  const pathname = usePathname();

  // Don't show header on the home page (it has its own)
  if (pathname === '/') return null;

  // Derive role/context from pathname
  const isAdmin = pathname.startsWith('/admin');
  const isSession = pathname.startsWith('/session') || pathname.startsWith('/join');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo */}
        <Link
          href="/"
          className="text-lg font-bold text-blue-600 hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          aria-label="Askly 홈으로 이동"
        >
          Askly
        </Link>

        {/* Center: Session context */}
        <div className="hidden sm:block text-sm text-gray-500 truncate max-w-[200px] md:max-w-xs">
          {isAdmin && '관리자 패널'}
          {isSession && !isAdmin && '세션 참여 중'}
        </div>

        {/* Right: Role badge */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              관리자
            </span>
          )}
          {isSession && !isAdmin && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              참여자
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
