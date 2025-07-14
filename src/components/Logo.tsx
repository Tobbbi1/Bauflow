'use client'

import Link from 'next/link'

export default function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-blue-600"
      >
        <rect
          x="4"
          y="8"
          width="8"
          height="8"
          fill="currentColor"
          className="animate-pulse"
          style={{ transformOrigin: 'center' }}
        />
        <rect
          x="4"
          y="18"
          width="8"
          height="8"
          fill="currentColor"
          className="animate-pulse"
          style={{ transformOrigin: 'center', animationDelay: '0.5s' }}
        />
        <rect
          x="14"
          y="8"
          width="8"
          height="8"
          fill="currentColor"
          className="animate-pulse"
          style={{ transformOrigin: 'center', animationDelay: '1s' }}
        />
        <rect
          x="14"
          y="18"
          width="8"
          height="8"
          fill="currentColor"
          className="animate-pulse"
          style={{ transformOrigin: 'center', animationDelay: '1.5s' }}
        />
        <rect
          x="24"
          y="8"
          width="4"
          height="18"
          fill="currentColor"
          className="animate-pulse"
          style={{ transformOrigin: 'center', animationDelay: '2s' }}
        />
      </svg>
      <span className="text-xl font-bold text-gray-900">BauPlaner</span>
    </Link>
  )
} 