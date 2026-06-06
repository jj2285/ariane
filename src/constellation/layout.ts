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
