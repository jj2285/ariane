export interface NodeData {
  id: string;
  label: string;
  type: 'hub' | 'pillar' | 'subtheme' | 'indie';
  parentId?: string;
  depth: number; // 0=hub, 1=pillar, 2=subtheme, 3+
  // Panel content
  title: string;
  body: string;
  stat?: string;
  statLabel?: string;
  worksUrl?: string;
  // Runtime layout (set by layout engine)
  angle?: number;  // radians
  radius?: number; // px from center
}

export interface EdgeData {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
}

export interface ConstellationData {
  nodes: NodeData[];
  edges: EdgeData[];
}

// Runtime node with computed position
export interface RuntimeNode extends NodeData {
  x: number; // canvas coords relative to center
  y: number;
  phase: number; // oscillation phase offset
  visible: boolean;
  scale: number; // for animation
  opacity: number;
}

export interface RuntimeEdge extends EdgeData {
  visible: boolean;
  particleT: number; // 0–1 along the path
}
