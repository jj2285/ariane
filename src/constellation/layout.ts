import type { NodeData, RuntimeNode } from './types';

// Pillar angles in radians (225°, 45°, 315°, 135°)
const PILLAR_ANGLES: Record<string, number> = {
  'p-indus':   (225 * Math.PI) / 180,
  'p-alim':    (45  * Math.PI) / 180,
  'p-energie': (315 * Math.PI) / 180,
  'p-tech':    (135 * Math.PI) / 180,
};

// Independent theme angles (evenly distributed)
const INDIE_ANGLES: string[] = ['indie-geopolitique', 'indie-finance'];
const INDIE_BASE = (270 * Math.PI) / 180; // top, then spread

const FAN = (33 * Math.PI) / 180;   // half-fan per child
const FAN_DECAY = 0.72;              // fan reduction per depth level

export function computeLayout(nodes: NodeData[], D: number): RuntimeNode[] {
  const R1 = D * 0.225;
  const R2 = D * 0.40;
  const R3 = D * 0.58;
  const R_INDIE = D * 0.53;
  const R_STEP = D * 0.165;

  // Build tree maps
  const childrenOf = new Map<string, NodeData[]>();
  const parentAngleOf = new Map<string, number>();

  for (const n of nodes) {
    if (n.parentId) {
      if (!childrenOf.has(n.parentId)) childrenOf.set(n.parentId, []);
      childrenOf.get(n.parentId)!.push(n);
    }
  }

  const result: RuntimeNode[] = [];

  for (const n of nodes) {
    let angle = 0;
    let radius = 0;

    if (n.type === 'hub') {
      angle = 0;
      radius = 0;
    } else if (n.type === 'indie') {
      const idx = INDIE_ANGLES.indexOf(n.id);
      const total = INDIE_ANGLES.length;
      angle = INDIE_BASE + ((idx - (total - 1) / 2) * (Math.PI / 4));
      radius = R_INDIE;
    } else if (n.depth === 1) {
      // pillar
      angle = PILLAR_ANGLES[n.id] ?? 0;
      radius = R1;
      parentAngleOf.set(n.id, angle);
    } else {
      // subtheme or deeper — find parent angle
      const parentId = n.parentId!;
      const parentAngle = parentAngleOf.get(parentId) ?? 0;
      const siblings = childrenOf.get(parentId) ?? [];
      const idx = siblings.findIndex(s => s.id === n.id);
      const count = siblings.length;

      const fanAtDepth = FAN * Math.pow(FAN_DECAY, n.depth - 2);
      const spreadAngle = parentAngle + (idx - (count - 1) / 2) * 2 * fanAtDepth;
      angle = spreadAngle;
      parentAngleOf.set(n.id, spreadAngle);

      if (n.depth === 2) {
        radius = R2;
      } else if (n.depth === 3) {
        radius = R3;
      } else {
        radius = R3 + R_STEP * (n.depth - 3);
      }
    }

    result.push({
      ...n,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      phase: Math.random() * Math.PI * 2,
      visible: false,
      scale: 0,
      opacity: 0,
    });
  }

  return result;
}

// ── Scoped "poupée russe" layout ───────────────────────────────────────────
// Centers the view on `scopeId` and lays out only that node, its direct
// children (ring 1) and grandchildren (ring 2). Everything else is hidden.
export interface ScopedNode extends RuntimeNode {
  level: number;          // 0 = scope center, 1 = child, 2 = grandchild
  _hasChildren: boolean;  // true if this node can be drilled into further
}

export function computeScopedLayout(
  nodes: NodeData[],
  scopeId: string,
  D: number,
): ScopedNode[] {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const childrenOf = new Map<string, NodeData[]>();
  for (const n of nodes) {
    if (n.parentId) {
      if (!childrenOf.has(n.parentId)) childrenOf.set(n.parentId, []);
      childrenOf.get(n.parentId)!.push(n);
    }
  }

  const scope = byId.get(scopeId);
  if (!scope) return [];

  const R1 = D * 0.30;
  const R2 = D * 0.52;
  const GRAND_FAN = (28 * Math.PI) / 180; // half-spread of grandchildren

  const out: ScopedNode[] = [];
  const mk = (n: NodeData, x: number, y: number, level: number): ScopedNode => ({
    ...n, x, y, level,
    _hasChildren: (childrenOf.get(n.id)?.length ?? 0) > 0,
    phase: Math.random() * Math.PI * 2,
    visible: false, scale: 0, opacity: 0,
  });

  // Center
  out.push(mk(scope, 0, 0, 0));

  // Ring 1 — direct children (+ indie themes when at the hub)
  let children = (childrenOf.get(scopeId) ?? []).slice();
  if (scopeId === 'hub') {
    children = children.concat(nodes.filter(n => n.type === 'indie'));
  }
  const c = Math.max(1, children.length);
  children.forEach((child, i) => {
    const angle = -Math.PI / 2 + (i / c) * Math.PI * 2;
    out.push(mk(child, Math.cos(angle) * R1, Math.sin(angle) * R1, 1));

    // Ring 2 — grandchildren fanned around their parent's angle
    const gks = childrenOf.get(child.id) ?? [];
    const g = gks.length;
    gks.forEach((gk, j) => {
      const offset = g === 1 ? 0 : (j - (g - 1) / 2) * ((GRAND_FAN * 2) / Math.max(1, g - 1));
      const a = angle + offset;
      out.push(mk(gk, Math.cos(a) * R2, Math.sin(a) * R2, 2));
    });
  });

  return out;
}
