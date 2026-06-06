export const COLORS = {
  bg: '#f7f9f7',
  hubFill: '#0d1f1a',
  hubText: '#a8f0d8',
  hubRing: '#2dd4a0',

  pillar: {
    fill: '#1a3329',
    stroke: '#34d399',
    text: '#d1fae5',
  },
  subtheme: {
    fill: '#f0fdf4',
    stroke: '#6ee7b7',
    text: '#064e3b',
  },
  indie: {
    fill: '#f0fdf4',
    stroke: '#22c55e',
    text: '#166534',
  },
  company: {
    fill: '#eff6ff',
    stroke: '#60a5fa',
    text: '#1e40af',
  },
  person: {
    fill: '#fff7ed',
    stroke: '#fb923c',
    text: '#9a3412',
    initials: '#c2410c',
  },
  edge: {
    stroke: 'rgba(52,211,153,0.35)',
    particle: '#34d399',
    label: 'rgba(52,211,153,0.7)',
  },
  personEdge: {
    stroke: 'rgba(251,146,60,0.4)',
    particle: '#fb923c',
    label: 'rgba(251,146,60,0.75)',
  },
  focus: {
    dimOpacity: 0.12,
  },
  halo: 'rgba(20,184,166,0.08)',
};

export const NODE_RADIUS: Record<string, number> = {
  hub: 40,
  pillar: 30,
  subtheme: 22,
  indie: 24,
  company: 26,
  person: 18,
};
