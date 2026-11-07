import type { CSSProperties, ReactNode } from 'react'
import type { StickerPackId } from '../types/photobooth'

interface StickerDoodleProps {
  pack: StickerPackId
  variant?: number
  size?: number
  style?: CSSProperties
}

const INK = '#2a211d'

function Cat({ sleepy = false }: { sleepy?: boolean }) {
  return (
    <>
      <path d="M12 27 11 9 25 18Q32 15 39 18L53 9 52 29C61 54 3 58 12 27Z" fill="#fffaf1" />
      <path d="m15 22 0-7 6 6m23 0 5-6 0 8" stroke="#e8a9b6" strokeWidth="3" />
      <path d={sleepy ? 'm21 33 5 2 3-3m9 0 3 3 5-2' : 'M23 31v3m18-3v3'} />
      <path d="m30 37 3 2 3-2m-3 2q-3 6-6 1m6-1q3 6 6 1" />
      <path d="m8 34 8 2m-9 5 9-1m32-4 8-2m-8 6 9 1" strokeWidth="1.7" />
      <ellipse cx="20" cy="39" rx="4" ry="2" fill="#f3a6b8" stroke="none" />
      <ellipse cx="45" cy="39" rx="4" ry="2" fill="#f3a6b8" stroke="none" />
      {sleepy && <path d="M25 19q2 7 7 4l3-6" stroke="#d1b292" strokeWidth="5" />}
    </>
  )
}

function Bow({ lace = false }: { lace?: boolean }) {
  return (
    <>
      <path d="m29 34-8 22-8-6-5 1 15-23m12 6 8 22 8-6 5 1-15-23" fill={lace ? '#fffaf1' : '#f3a6b8'} />
      <path d="M28 25C10 3 1 13 9 33c4 10 13 5 20-2m7-6C54 3 63 13 55 33c-4 10-13 5-20-2" fill={lace ? '#f9e1e6' : '#f3a6b8'} />
      <path d="m15 21 14 7m20-7-14 7" stroke="#b86d83" />
      <rect x="27" y="23" width="10" height="12" rx="4" fill="#fffaf1" />
      {lace && <path d="m11 17 3 2-2 4 4 2-1 4 5 2m33-14-3 2 2 4-4 2 1 4-5 2M19 45l4 2m18-2 4-2" stroke="#fffaf1" strokeWidth="3" />}
    </>
  )
}

function Heart({ color = '#f3a6b8' }: { color?: string }) {
  return <path d="M32 52C-10 30 10 4 30 23 50 0 76 25 32 52Z" fill={color} />
}

function Flower({ blossom = false }: { blossom?: boolean }) {
  return (
    <>
      <path d="M32 25C15-1 46-2 37 23 64 5 72 35 43 33 68 56 38 68 34 42 17 67-4 41 22 34-7 25 13 3 29 24Z" fill={blossom ? '#f7d2df' : '#d9ceeb'} />
      <circle cx="32" cy="32" r="7" fill="#f7d97e" />
      {blossom
        ? <path d="m32 16 0 9m15 1-8 4m2 15-5-7m-14 7 5-7m-13-13 10 5" stroke="#c7859b" strokeWidth="1.5" />
        : <path d="m28 31 .1 0m8 0 .1 0m-7 5q3 2 6-1" strokeWidth="2" />}
    </>
  )
}

function ChromeStar() {
  return (
    <>
      <path d="m32 5 8 20 19 7-19 8-8 19-8-19-19-8 19-7Z" fill="#d2dce7" />
      <path d="m32 5 0 27 27 0-19-7Z" fill="#fffaf1" stroke="none" />
      <path d="m5 32 27 0 0 27-8-19Z" fill="#9babc0" stroke="none" />
      <path d="m32 5 8 20 19 7-19 8-8 19-8-19-19-8 19-7Z" />
    </>
  )
}

/** Original, export-safe vector stickers. No external assets, filters, or CSS colors. */
function artwork(pack: Exclude<StickerPackId, 'none'>, variant: number): ReactNode {
  const v = variant % 3
  switch (pack) {
    case 'cats':
      if (v === 0) return <Cat />
      if (v === 2) return <Cat sleepy />
      return <>
        <path d="M21 36c-13 13-4 24 10 17 15 8 26-6 11-18-5-8-17-9-21 1Z" fill="#f3a6b8" />
        <ellipse cx="12" cy="27" rx="6" ry="8" transform="rotate(-30 12 27)" fill="#f8d3dc" />
        <ellipse cx="25" cy="16" rx="6" ry="8" fill="#f8d3dc" />
        <ellipse cx="40" cy="16" rx="6" ry="8" fill="#f8d3dc" />
        <ellipse cx="53" cy="28" rx="6" ry="8" transform="rotate(30 53 28)" fill="#f8d3dc" />
      </>
    case 'girlypop':
      if (v === 0) return <Bow />
      if (v === 1) return <><Heart /><path d="m14 25 4-2m-3 6 2-1" stroke="#fffaf1" strokeWidth="3" /><path d="m50 6 0 8m-4-4h8" /></>
      return <>
        <path d="M13 15q24-18 39 4c6 11-12 21-22 16C7 24 15 60 48 49" stroke="#2a211d" strokeWidth="9" />
        <path d="M13 15q24-18 39 4c6 11-12 21-22 16C7 24 15 60 48 49" stroke="#f3a6b8" strokeWidth="5" />
        <path d="m43 44 7 5-7 8" stroke="#b86d83" />
      </>
    case 'cute':
      if (v === 1) return <Flower />
      if (v === 2) return <>
        <path d="M10 24q10-12 18 0m8 0q10-12 18 0M23 37q9 12 18 0" strokeWidth="3" />
        <ellipse cx="13" cy="35" rx="9" ry="5" fill="#f3a6b8" stroke="none" /><ellipse cx="51" cy="35" rx="9" ry="5" fill="#f3a6b8" stroke="none" />
        <path d="m8 33-2 4m8-4-2 4m35-4-2 4m8-4-2 4" stroke="#bd7583" strokeWidth="1.5" />
      </>
      return <>
        <circle cx="15" cy="17" r="10" fill="#cfa989" /><circle cx="49" cy="17" r="10" fill="#cfa989" />
        <circle cx="32" cy="34" r="23" fill="#e1bea0" /><ellipse cx="32" cy="41" rx="12" ry="9" fill="#fffaf1" />
        <path d="M22 29v3m20-3v3m-13 6 3 2 3-2m-3 2v4" />
        <ellipse cx="17" cy="38" rx="5" ry="3" fill="#f3a6b8" stroke="none" /><ellipse cx="47" cy="38" rx="5" ry="3" fill="#f3a6b8" stroke="none" />
      </>
    case 'y2k':
      if (v === 0) return <ChromeStar />
      if (v === 1) return <>
        <path d="M31 31C4-12-6 37 23 36 2 55 28 68 32 38 38 65 62 54 42 36 72 35 59-11 33 31Z" fill="#d9c9ed" />
        <path d="M32 27v21m-2-21-5-8m9 8 5-8m-27 8 11 3m29-3-11 3" stroke="#685878" />
        <circle cx="15" cy="25" r="3" fill="#fffaf1" stroke="none" /><circle cx="49" cy="25" r="3" fill="#fffaf1" stroke="none" />
      </>
      return <>
        <ellipse cx="32" cy="32" rx="28" ry="10" transform="rotate(-30 32 32)" fill="#fffaf1" />
        <circle cx="32" cy="32" r="14" fill="#c6d9ec" /><path d="m24 24 16 16" stroke="#fffaf1" strokeWidth="4" />
        <path d="m50 6 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#f7d97e" />
      </>
    case 'shinchan':
      if (v === 0) return <>
        <path d="M8 24q9-19 20-3M37 21q11-18 20 3" strokeWidth="8" />
        <path d="m21 31 1 4m23-4-1 4M27 45q7 5 12-2" strokeWidth="3" />
        <ellipse cx="13" cy="40" rx="7" ry="4" fill="#f3a6b8" stroke="none" /><ellipse cx="51" cy="40" rx="7" ry="4" fill="#f3a6b8" stroke="none" />
      </>
      if (v === 1) return <>
        <path d="m33 5 8 17 18 2-13 13 4 20-18-9-18 10 3-21L4 24l20-3Z" fill="#f7d97e" />
        <path d="m22 29 4-2m12 0 5 2m-20 4v2m16-2v2m-11 6q5 7 11-2" strokeWidth="2.5" />
      </>
      return <>
        <path d="m9 8 17 17m5-20 1 17M53 9 40 25M7 37l16-3m34-1-15 1M14 56l13-15m25 14L40 42" stroke="#fffaf1" strokeWidth="7" />
        <path d="m9 8 17 17m5-20 1 17M53 9 40 25M7 37l16-3m34-1-15 1M14 56l13-15m25 14L40 42" strokeWidth="3" />
      </>
    case 'matcha':
      if (v === 0) return <>
        <path d="M13 22h35l-4 33H18Z" fill="#c3d5aa" /><path d="M48 28c19-4 17 19-2 17" fill="#fffaf1" />
        <ellipse cx="30" cy="22" rx="18" ry="6" fill="#fffaf1" /><ellipse cx="30" cy="22" rx="12" ry="3" fill="#a1ba86" stroke="none" />
        <path d="M24 6q-6 5 0 9m12-11q-6 5 0 10m-9 24q4-6 8 0-4 8-8 0Z" stroke="#5b7751" />
        <path d="M10 58h42" />
      </>
      if (v === 1) return <>
        <path d="M8 48C-1 23 19 9 32 14 48 7 68 26 56 48l-12-7c-5 5-19 5-24 0Z" fill="#e7b86e" />
        <path d="M21 17q-11 9-1 24m12-27q-7 14-1 31m12-30q13 11 1 26m-34-9 9 3m27 0 11-3" stroke="#8c5b32" />
        <path d="m22 21 3-3m9 2 3-1" stroke="#fff0c9" strokeWidth="3" />
      </>
      return <>
        <path d="M12 54Q23 31 49 10C58 34 36 49 23 40 12 35 7 20 9 16 29 14 35 25 27 34" fill="#b4ce9f" />
        <path d="m14 51 26-29M15 23l11 13" stroke="#53714a" />
      </>
    case 'cyber':
      if (v === 0) return <>
        <path d="M7 13h16v8h16v-8h16v24h-8v8h-8v8H23v-8h-8v-8H7Z" fill="#f3a6b8" strokeLinejoin="miter" />
        <path d="M12 19h8v8h-8Zm29 0h8v8h-8Z" fill="#fffaf1" stroke="none" />
      </>
      if (v === 1) return <>
        <path d="M19 17h26c13 0 19 33 10 36-6 3-13-9-16-10H25c-4 1-10 13-16 10-9-4-3-36 10-36Z" fill="#c7d9cf" />
        <path d="M17 25v14m-7-7h14" strokeWidth="4" /><circle cx="43" cy="29" r="3" fill="#f3a6b8" /><circle cx="50" cy="36" r="3" fill="#f7d97e" /><path d="m28 29 8 0" />
      </>
      return <>
        <path d="M31 5h15v8h-8v9h-8v9h18v8h-9v8h-9v9H15v-8h8v-9h8v-8H15v-9h8v-9h8Z" fill="#f7d97e" strokeLinejoin="miter" />
        <path d="M8 9v7m-3-3h6M54 48v9m-4-4h8" stroke="#9c7ca9" />
      </>
    case 'coquette':
      if (v === 0) return <Flower blossom />
      if (v === 2) return <Bow lace />
      return <>
        <ellipse cx="32" cy="33" rx="21" ry="23" stroke="#b7978c" />
        {[[32,10],[43,14],[51,24],[53,36],[47,47],[37,55],[25,55],[15,47],[11,36],[13,24],[21,14]].map(([cx, cy], i) =>
          <circle key={i} cx={cx} cy={cy} r="4.5" fill="#fffaf1" stroke="#b7978c" strokeWidth="1.5" />,
        )}
        <path d="m29 52-7-6-3 9 10-2m6-1 7-6 3 9-10-2" fill="#f3a6b8" /><circle cx="32" cy="53" r="3" fill="#f3a6b8" />
      </>
    case 'scribbles':
      if (v === 0) return <>
        <path d="M8 51C54 58 45 8 24 20 6 30 42 39 54 14m-14 1 14-3 1 15" stroke="#fffaf1" strokeWidth="7" />
        <path d="M8 51C54 58 45 8 24 20 6 30 42 39 54 14m-14 1 14-3 1 15" strokeWidth="2.5" />
      </>
      if (v === 1) return <>
        <path d="M14 44 7 17l17 10 8-18 9 18 16-10-7 27Z" fill="#f7d97e" /><path d="m14 50 36-1" strokeWidth="3" />
        <circle cx="32" cy="35" r="3" fill="#f3a6b8" /><path d="m8 7-3-3m52 4 3-4" />
      </>
      return <>
        <path d="m4 17 52-7 5 36-52 8Z" fill="#fffaf1" />
        <path d="m8 16 9-2m31-4 8-1" stroke="#e9cdb8" strokeWidth="6" />
        <text x="10" y="38" fill="#2a211d" stroke="none" fontFamily="Comic Sans MS, cursive" fontSize="18" fontStyle="italic" transform="rotate(-8 32 32)">cutie!</text>
        <path d="m17 44 28-4" stroke="#f3a6b8" strokeWidth="3" />
      </>
  }
}

export default function StickerDoodle({ pack, variant = 0, size = 40, style }: StickerDoodleProps) {
  if (pack === 'none') return null
  return (
    <span
      aria-hidden="true"
      data-sticker-doodle={pack}
      style={{ display: 'block', width: size, height: size, pointerEvents: 'none', flexShrink: 0, ...style }}
    >
      {/* Keep placement on the HTML wrapper: html2canvas rasterizes each SVG separately. */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        stroke={INK}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
        style={{ display: 'block' }}
      >
        {artwork(pack, variant)}
      </svg>
    </span>
  )
}
