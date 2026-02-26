import { useEffect, useState } from "react"

const AVATAR_COLORS = [
  "from-gray-600 to-gray-800",
  "from-slate-500 to-slate-700",
  "from-zinc-500 to-zinc-700",
  "from-neutral-500 to-neutral-700",
  "from-stone-500 to-stone-700",
  "from-gray-500 to-gray-700",
  "from-slate-600 to-slate-800",
  "from-zinc-600 to-zinc-800",
]

export function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function getInitial(name: string) {
  return name.charAt(0).toUpperCase()
}

type Props = {
  id: string
  name: string
  source?: string
  /** Extra Tailwind classes for size, border-radius, font-size, etc. */
  className?: string
  /** Increment to force avatar reload after upload */
  refreshKey?: number
}

export default function RoleAvatar({ id, name, source, className = "", refreshKey = 0 }: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setAvatarUrl(null)
    window.electronAPI?.getRoleAvatar({ id, source })
      .then((res) => {
        if (!cancelled && res?.data) setAvatarUrl(res.data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [id, source, refreshKey])

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`shrink-0 object-cover ${className}`}
      />
    )
  }

  return (
    <div className={`flex shrink-0 items-center justify-center bg-gradient-to-br ${getAvatarColor(name)} text-white font-bold ${className}`}>
      {getInitial(name)}
    </div>
  )
}
