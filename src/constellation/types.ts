export interface NodeData {
  id: string;
  label: string;
  type: 'hub' | 'pillar' | 'subtheme' | 'indie' | 'company' | 'person';
  parentId?: string;
  depth: number;
  // Panel content
  title: string;
  body: string;
  stat?: string;
  statLabel?: string;
  worksUrl?: string;
  // Person-specific fields
  personPosition?: string;
  personEmail?: string;
  personPhone?: string;
  personCompany?: string;
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

export interface RuntimeNode extends NodeData {
  x: number;
  y: number;
  phase: number;
  visible: boolean;
  scale: number;
  opacity: number;
}

export interface RuntimeEdge extends EdgeData {
  visible: boolean;
  particleT: number;
}
