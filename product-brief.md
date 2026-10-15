# Glass scan — reusable glow-only fill

## Identity
- id: 6c989476-2068-4c82-9a1f-12411142cfb7
- displayName: Glass scan (existing name preserved)
- kind: fill

## Authoritative scope update
The user wants only the procedural scan glow over a chosen background, to apply to their own native Figma buttons and shapes. This supersedes all earlier requirements for drawn UI, labels, arrow badges, glass, outlines, pill width, corner rounding and internal shape clipping. Render across the entire normalized target surface. Native Figma geometry alone determines the final silhouette. No text, icons, buttons, glass simulation or canvas mutations.

Retain the original chronological light character: quiet dark blue, right-edge blue/pink ignition, blue wash with upper/lower luminous ribbons moving right-to-left, a warm orange/pink flare on arrival at the left, receding pink and dark-blue settle before reset. Preserve the existing blue/pink/orange color, glow width, intensity and softness controls and their defaults. Glow width retains its original reference-space range, normalized across the full target width; ribbons fit the full target height, without an inset pill boundary.

Preserve playback, deterministic manual Progress scrubbing, duration, pause between cycles, looping and reverse behavior. Playback off must be time invariant. No mouse interaction. Keep animated metadata because playback reads frame.time.

Expose Background as a standard type: color picker (existing dark default), allowing native Figma variable/token binding and color alpha. Do not implement string token resolution. Composite glow over the background with correct straight-alpha fill output, including when the background is transparent. No input texture sampling or external refraction.

## Implementation
Single fullscreen WebGPU render pass; uniform buffer only. Remove the obsolete glyph storage buffer and all text-rendering code. Preserve existing shader ID, kind and published display name. Build locally; deployment and canvas application are handled separately.
