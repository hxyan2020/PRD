import { genreIconKey } from '../lib/genreIcons'
import './GenreIcon.css'

function paths(key: string) {
  switch (key) {
    case 'portrait':
      return (
        <>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.5 19.5c1.4-3.2 3.6-4.8 6.5-4.8s5.1 1.6 6.5 4.8" />
        </>
      )
    case 'nude':
      return (
        <>
          <circle cx="12" cy="6.5" r="2.4" />
          <path d="M8 21v-6.2c0-2.2 1.8-4 4-4s4 1.8 4 4V21" />
        </>
      )
    case 'religious':
      return (
        <>
          <path d="M12 3v18" />
          <path d="M6.5 8.5h11" />
        </>
      )
    case 'myth':
      return (
        <>
          <path d="M12 4l2.2 4.6L19 9.2l-3.5 3.4.8 4.9L12 15.2 7.7 17.5l.8-4.9L5 9.2l4.8-.6L12 4z" />
        </>
      )
    case 'allegory':
      return (
        <>
          <circle cx="12" cy="12" r="7.5" />
          <path d="M12 7.5v5l3 1.8" />
        </>
      )
    case 'landscape':
      return (
        <>
          <path d="M3.5 16.5 9 9l3.5 4.5L15 11l5.5 5.5" />
          <path d="M3 19h18" />
          <circle cx="17.5" cy="7" r="1.6" />
        </>
      )
    case 'marine':
      return (
        <>
          <path d="M4 15c1.5 0 1.5-1.2 3-1.2S8.5 15 10 15s1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2" />
          <path d="M4 18.5c1.5 0 1.5-1.2 3-1.2s1.5 1.2 3 1.2 1.5-1.2 3-1.2 1.5 1.2 3 1.2 1.5-1.2 3-1.2" />
          <path d="M8 13.5 12 5l4 8.5" />
        </>
      )
    case 'still-life':
      return (
        <>
          <ellipse cx="12" cy="15.5" rx="6.5" ry="2.8" />
          <path d="M5.5 15.2V12c0-2 2.9-3.6 6.5-3.6s6.5 1.6 6.5 3.6v3.2" />
          <path d="M12 8.4V5.5" />
          <circle cx="12" cy="4.8" r="1.1" />
        </>
      )
    case 'animal':
      return (
        <>
          <path d="M5 16.5c1.2-3.5 3.4-5.5 7-5.5s5.8 2 7 5.5" />
          <circle cx="9" cy="10" r="1.1" />
          <circle cx="15" cy="10" r="1.1" />
          <path d="M8 7.2 9.2 9M16 7.2 14.8 9" />
        </>
      )
    case 'history':
      return (
        <>
          <path d="M6 19V7.5L12 4l6 3.5V19" />
          <path d="M9.5 19v-6h5v6" />
        </>
      )
    case 'abstract':
      return (
        <>
          <rect x="4.5" y="4.5" width="6.5" height="6.5" rx="0.8" />
          <circle cx="16.2" cy="8" r="3.2" />
          <path d="M5 18.5h14" />
        </>
      )
    case 'movement':
      return (
        <>
          <path d="M4.5 16.5c3-6 5.5-9 7.5-9s4.5 3 7.5 9" />
          <path d="M7 19h10" />
        </>
      )
    case 'scroll':
      return (
        <>
          <path d="M7 5.5h9.5a2 2 0 0 1 0 4H8.5a2 2 0 0 0 0 4H17" />
          <path d="M7 5.5v13" />
        </>
      )
    case 'interior':
      return (
        <>
          <path d="M4.5 19V9.5L12 4l7.5 5.5V19" />
          <path d="M9.5 19v-6h5v6" />
          <path d="M4.5 19h15" />
        </>
      )
    default:
      return (
        <>
          <rect x="4.5" y="5.5" width="15" height="13" rx="1.2" />
          <path d="M4.5 9.5h15" />
          <path d="M9 5.5v4" />
        </>
      )
  }
}

export function GenreIcon({ genre }: { genre: string }) {
  const key = genreIconKey(genre)
  return (
    <svg
      className="genre-icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths(key)}
      </g>
    </svg>
  )
}
