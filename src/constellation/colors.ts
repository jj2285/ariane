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
  elu: {
    fill: '#faf5ff',
    stroke: '#c084fc',
    text: '#6b21a8',
    initials: '#7e22ce',
  },
  institution: {
    fill: '#f1f5f9',
    stroke: '#94a3b8',
    text: '#334155',
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
    dimOpacity: 0.42,
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
  elu: 19,
  institution: 25,
};

// Human-readable labels per node type (for legend + panels).
export const TYPE_LABELS: Record<string, string> = {
  hub: 'Cœur',
  pillar: 'Pilier',
  subtheme: 'Sous-thème',
  indie: 'Thème transverse',
  company: 'Entreprise',
  person: 'Contact',
  elu: 'Élu / Député',
  institution: 'Institution',
};

// Representative color (stroke) per node type for the legend swatches.
export const TYPE_SWATCH: Record<string, string> = {
  hub: '#0d1f1a',
  pillar: '#1a3329',
  subtheme: '#6ee7b7',
  indie: '#22c55e',
  company: '#60a5fa',
  person: '#fb923c',
  elu: '#c084fc',
  institution: '#94a3b8',
};

// Typed relationship styling. Each relation has a distinct color + label.
export const RELATION_STYLES: Record<
  string,
  { stroke: string; particle: string; label: string; legend: string }
> = {
  soutient:  { stroke: 'rgba(168,85,247,0.55)',  particle: '#a855f7', label: 'rgba(126,34,206,0.85)',  legend: 'soutient' },
  finance:   { stroke: 'rgba(16,185,129,0.55)',  particle: '#10b981', label: 'rgba(5,122,85,0.85)',    legend: 'finance' },
  fournit:   { stroke: 'rgba(59,130,246,0.55)',  particle: '#3b82f6', label: 'rgba(30,64,175,0.85)',   legend: 'fournit' },
  regule:    { stroke: 'rgba(239,68,68,0.55)',   particle: '#ef4444', label: 'rgba(185,28,28,0.85)',   legend: 'régule' },
  emploie:   { stroke: 'rgba(100,116,139,0.55)', particle: '#64748b', label: 'rgba(51,65,85,0.85)',    legend: 'emploie' },
  collabore: { stroke: 'rgba(20,184,166,0.5)',   particle: '#14b8a6', label: 'rgba(13,148,136,0.85)',  legend: 'collabore' },
};
