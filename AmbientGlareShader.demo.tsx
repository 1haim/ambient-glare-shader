// Copyright (c) 2026 haim repael azoulay. All rights reserved.
import AmbientGlareShader from "./AmbientGlareShader"

const settings = {
  playback: true,
  duration: 2,
  loop: true,
  reverse: false,
  glowWidth: 68,
  intensity: 1.15,
  softness: 0.7,
}

export default function AmbientGlareShaderDemo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props }
  return (
    <div className="flex min-h-[360px] w-full items-center justify-center bg-background p-8">
      <div className="w-full max-w-xl overflow-hidden rounded-full border border-border bg-card shadow-sm">
        <AmbientGlareShader
          className="h-16 w-full"
          playback={s.playback}
          duration={s.duration}
          loop={s.loop}
          reverse={s.reverse}
          glowWidth={s.glowWidth}
          intensity={s.intensity}
          softness={s.softness}
        />
      </div>
    </div>
  )
}
