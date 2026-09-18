type Props = {
  seed: string
  elevationM: number
  distanceKm: number
}

function hash(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function ElevationSpark({ seed, elevationM, distanceKm }: Props) {
  const points = 18
  const w = 280
  const h = 46
  const rnd = hash(seed)
  const coords: Array<[number, number]> = []
  let y = h * 0.7
  for (let i = 0; i < points; i += 1) {
    const t = i / (points - 1)
    const wave = Math.sin(t * Math.PI * (1.6 + (rnd % 5) / 10)) * (8 + (elevationM / 80))
    const noise = ((rnd >> (i % 16)) & 7) - 3
    y = Math.min(h - 4, Math.max(6, h * 0.72 - wave - noise - t * Math.min(18, elevationM / 60)))
    coords.push([(t * w), y])
  }
  const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ')
  const fill = `${d} L${w},${h} L0,${h} Z`
  const peak = Math.min(...coords.map((c) => c[1]))
  const peakX = coords.find((c) => c[1] === peak)?.[0] ?? w / 2

  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Profil trasy, ${Math.round(distanceKm)} kilometrů`}>
      <path d={fill} className="spark-fill" />
      <path d={d} className="spark-line" />
      <circle cx={peakX} cy={peak} r="2.8" className="spark-peak" />
    </svg>
  )
}
