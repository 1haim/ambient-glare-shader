# Ambient Glare — continuous glow-only fill

## Identity
- id: 6c989476-2068-4c82-9a1f-12411142cfb7
- displayName: Ambient Glare
- kind: fill
- Author credit: haim repael azoulay

## Authoritative scope update
The user wants only the procedural scan glow over a chosen background, to apply to their own native Figma buttons and shapes. This supersedes all earlier requirements for drawn UI, labels, arrow badges, glass, outlines, pill width, corner rounding and internal shape clipping. Render across the entire normalized target surface. Native Figma geometry alone determines the final silhouette. No text, icons, buttons, glass simulation or canvas mutations.

Retain the original light character: dark blue, right-edge blue/pink ignition, blue wash with upper/lower luminous ribbons moving right-to-left, and a warm orange/pink flare toward the left. Merge ignition, travel and settle into one uninterrupted movement: no stationary beginning/middle phases, no per-phase motion easing, and no holds between cycles. Begin moving immediately at constant speed, ease out only over the final 20% of playback, and fade back to the dark-blue base at the endpoint. Apply final easing in playback order, including in reverse. Preserve the existing blue/pink/orange color, glow width, intensity and softness controls and their defaults. Glow width retains its original reference-space range, normalized across the full target width; ribbons fit the full target height, without an inset pill boundary.

Preserve playback, deterministic manual Progress scrubbing, duration, looping and reverse behavior. Remove the obsolete pause control and ignore previously stored pause values so existing instances also have no cycle holds. Default duration is now 2 seconds; existing explicit duration settings remain respected. Playback off must be time invariant. No mouse interaction. Keep animated metadata because playback reads frame.time.

Expose Background as a standard type: color picker (existing dark default), allowing native Figma variable/token binding and color alpha. Do not implement string token resolution. Composite glow over the background with correct straight-alpha fill output, including when the background is transparent. No input texture sampling or external refraction.

## Implementation
Single fullscreen WebGPU render pass; uniform buffer only. No text-rendering code. Preserve existing shader ID and kind. Source identity and metadata use Ambient Glare with the exact author credit haim repael azoulay; include no organization, employer or email details. Published-record renaming is unsupported and is not attempted. Build locally; deployment and canvas application are handled separately.
