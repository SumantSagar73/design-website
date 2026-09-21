export type InteractionMode = 0 | 1 | 2 | 3

export interface InteractionVariant {
  id: InteractionMode
  num: string
  title: string
  hint: string
}

export const INTERACTION_VARIANTS: readonly InteractionVariant[] = [
  { id: 0, num: '01', title: 'Liquid Ripples', hint: 'Hover & click ribbon to emit expanding water waves' },
  { id: 1, num: '02', title: 'Prismatic Caustics', hint: 'Move cursor across ribbon to glide optical light flares' },
  { id: 2, num: '03', title: 'Sonic Resonance', hint: 'Harmonic standing waves; click to strike an acoustic glass chime' },
  { id: 3, num: '04', title: 'Gyroscopic Inertia', hint: 'Deep zero-gravity momentum and weightless 3D perspective' },
] as const
