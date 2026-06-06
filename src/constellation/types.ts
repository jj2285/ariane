export type NodeType =
  | 'hub'
  | 'pillar'
  | 'subtheme'
  | 'indie'
  | 'company'
  | 'person'
  | 'elu'
  | 'institution';

export interface NodeData {
  id: string;
  label: string;
  type: NodeType;
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
  // Élu / Député fields
  eluMandate?: string;       // ex: "Députée — Paris 12e circonscription"
  eluParty?: string;         // ex: "Renaissance"
  eluCommission?: string;    // ex: "Commission des Affaires sociales"
  // Institution fields
  institutionKind?: string;  // ex: "Autorité de régulation", "Ministère"
}

// Typed relationships — drive edge color and meaning.
export type RelationType =
  | 'soutient'
  | 'finance'
  | 'fournit'
  | 'regule'
  | 'emploie'
  | 'collabore';

export interface EdgeData {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  relationType?: RelationType;
  body?: string;
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
