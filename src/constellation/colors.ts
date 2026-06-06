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
    stroke: '#86efac',
    text: '#166534',
    strokeColor: '#22c55e',
  },
  edge: {
    stroke: 'rgba(52,211,153,0.35)',
    particle: '#34d399',
    label: 'rgba(52,211,153,0.7)',
  },
  focus: {
    dimOpacity: 0.12,
    brightStroke: '#6ee7b7',
  },
  halo: 'rgba(20,184,166,0.08)',
};

// Node radius by type
export const NODE_RADIUS: Record<string, number> = {
  hub: 40,
  pillar: 30,
  subtheme: 22,
  indie: 24,
};
