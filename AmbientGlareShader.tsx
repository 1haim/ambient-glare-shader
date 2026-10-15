// Ambient Glare — continuous blue/pink/orange scan with a final-only ease-out.
// Author: haim repael azoulay
// Copyright (c) 2026 haim repael azoulay. All rights reserved.

"use client"

import { useEffect, useRef } from "react"

type RGBA = { r: number; g: number; b: number; a: number }

export type AmbientGlareShaderProps = {
  className?: string
  playback?: boolean
  progress?: number
  duration?: number
  loop?: boolean
  reverse?: boolean
  glowWidth?: number
  intensity?: number
  softness?: number
  blue?: RGBA
  pink?: RGBA
  orange?: RGBA
  background?: RGBA
}

const VERT = `
attribute vec2 a_pos;
attribute vec2 a_uv;
varying vec2 v_uv;
void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;
uniform vec4 u_motion;
uniform vec4 u_blue;
uniform vec4 u_pink;
uniform vec4 u_orange;
uniform vec4 u_background;
varying vec2 v_uv;

float gaussian(float x, float width) {
  return exp(-0.5 * x * x / max(width * width, 0.001));
}

void main() {
  vec2 p = (v_uv - vec2(0.5)) * vec2(440.0, 52.0);
  float prog = u_motion.x;
  float ignition = min(prog / 0.06, 1.0) * (1.0 - smoothstep(0.86, 1.0, prog));
  float travel = prog;
  float flareX = mix(440.0 * 0.48, -440.0 * 0.45, travel);
  float gx = p.x - flareX;
  float soft = u_motion.w;
  float glowWidth = max(u_motion.y, 8.0);
  float band = gaussian(gx, glowWidth);
  float wake = smoothstep(flareX - glowWidth, flareX + glowWidth, p.x);
  float wash = (band * 0.5 + wake * 0.60) * ignition;
  float ribbon = gaussian(abs(p.y) - 26.0, 2.0 + soft * 2.2) * band * ignition;
  float warm = gaussian(prog - 0.89, 0.10);
  vec3 cool = u_blue.rgb * u_blue.a;
  vec3 rose = u_pink.rgb * u_pink.a;
  vec3 amber = u_orange.rgb * u_orange.a;
  vec3 glow = cool * (0.045 + wash * 0.63);
  glow += cool * gaussian(p.y, 16.0) * wake * ignition * 0.15;
  glow += cool * ribbon * 1.15;
  float crest = gaussian(p.y + 26.0, 4.5 + soft * 2.0) * band;
  glow += rose * crest * ignition * 1.10;
  float front = gaussian(gx, 11.0 + soft * 6.0) * ignition;
  glow += mix(rose, amber, warm) * front * (0.25 + 0.75 * warm);
  glow = clamp(glow * u_motion.z, vec3(0.0), vec3(1.0));
  float glowAlpha = max(glow.r, max(glow.g, glow.b));
  float bgAlpha = clamp(u_background.a, 0.0, 1.0);
  float alpha = glowAlpha + bgAlpha * (1.0 - glowAlpha);
  vec3 composite = glow + u_background.rgb * bgAlpha * (1.0 - glowAlpha);
  gl_FragColor = vec4(composite / max(alpha, 0.00001), alpha);
}
`

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error("Unable to create shader")
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(info || "Shader compile failed")
  }
  return shader
}

function createProgram(gl: WebGLRenderingContext) {
  const program = gl.createProgram()
  if (!program) throw new Error("Unable to create program")
  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(info || "Program link failed")
  }
  return program
}

const DEFAULTS = {
  playback: true,
  progress: 0,
  duration: 2,
  loop: true,
  reverse: false,
  glowWidth: 68,
  intensity: 1.15,
  softness: 0.7,
  blue: { r: 0.15, g: 0.25, b: 1, a: 1 },
  pink: { r: 1, g: 0.2, b: 0.76, a: 1 },
  orange: { r: 1, g: 0.32, b: 0.02, a: 1 },
  background: { r: 0, g: 0, b: 0, a: 0 },
} satisfies Required<Omit<AmbientGlareShaderProps, "className">>

export default function AmbientGlareShader({
  className,
  playback = DEFAULTS.playback,
  progress = DEFAULTS.progress,
  duration = DEFAULTS.duration,
  loop = DEFAULTS.loop,
  reverse = DEFAULTS.reverse,
  glowWidth = DEFAULTS.glowWidth,
  intensity = DEFAULTS.intensity,
  softness = DEFAULTS.softness,
  blue = DEFAULTS.blue,
  pink = DEFAULTS.pink,
  orange = DEFAULTS.orange,
  background = DEFAULTS.background,
}: AmbientGlareShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const propsRef = useRef({
    playback,
    progress,
    duration,
    loop,
    reverse,
    glowWidth,
    intensity,
    softness,
    blue,
    pink,
    orange,
    background,
  })
  propsRef.current = {
    playback,
    progress,
    duration,
    loop,
    reverse,
    glowWidth,
    intensity,
    softness,
    blue,
    pink,
    orange,
    background,
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    })
    if (!gl) return

    const program = createProgram(gl)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, -1, 1, 0, 0, 1, -1, 1, 1, 1, 1, 1, 0]),
      gl.STATIC_DRAW
    )

    const aPos = gl.getAttribLocation(program, "a_pos")
    const aUv = gl.getAttribLocation(program, "a_uv")
    const uMotion = gl.getUniformLocation(program, "u_motion")
    const uBlue = gl.getUniformLocation(program, "u_blue")
    const uPink = gl.getUniformLocation(program, "u_pink")
    const uOrange = gl.getUniformLocation(program, "u_orange")
    const uBackground = gl.getUniformLocation(program, "u_background")

    gl.useProgram(program)
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0)
    gl.enableVertexAttribArray(aUv)
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8)
    gl.disable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    let raf = 0
    const started = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const height = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const currentProgress = (now: number) => {
      const p = propsRef.current
      let value = Math.max(0, Math.min(1, p.progress))
      if (p.playback) {
        const elapsed = Math.max(0, (now - started) * 0.001)
        const cycleDuration = Math.max(0.2, p.duration)
        const t = p.loop ? elapsed % cycleDuration : Math.min(elapsed, cycleDuration)
        value = Math.min(t / cycleDuration, 1)
      }
      // One continuous trajectory: constant velocity, then a final-only ease-out.
      const ending = Math.max(0, (value - 0.8) / 0.2)
      value = (value - 0.1 * ending * ending) / 0.9
      return p.reverse ? 1 - value : value
    }

    const frame = (now: number) => {
      resize()
      const p = propsRef.current
      const prog = currentProgress(now)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform4f(uMotion, prog, p.glowWidth, p.intensity, p.softness)
      gl.uniform4f(uBlue, p.blue.r, p.blue.g, p.blue.b, p.blue.a)
      gl.uniform4f(uPink, p.pink.r, p.pink.g, p.pink.b, p.pink.a)
      gl.uniform4f(uOrange, p.orange.r, p.orange.g, p.orange.b, p.orange.a)
      gl.uniform4f(uBackground, p.background.r, p.background.g, p.background.b, p.background.a)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      raf = requestAnimationFrame(frame)
    }

    const observer = new ResizeObserver(() => resize())
    observer.observe(canvas)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={["block h-full w-full", className].filter(Boolean).join(" ")}
      aria-hidden
    />
  )
}
