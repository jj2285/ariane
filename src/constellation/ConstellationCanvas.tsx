import { useRef, useEffect, useCallback } from 'react';
import type { ConstellationData, NodeData, RuntimeEdge } from './types';
import { computeScopedLayout, type ScopedNode } from './layout';
import { COLORS, NODE_RADIUS, RELATION_STYLES } from './colors';

interface Props {
  data: ConstellationData;
  scopeId: string;
  selectedId: string | null;
  macroMode: boolean;
  onNodeClick: (id: string) => void;
  onEdgeClick?: (id: string, x: number, y: number) => void;
}

interface State {
  nodes: ScopedNode[];
  allNodes: NodeData[];
  edges: RuntimeEdge[];
  zoom: number;
  panX: number;
  panY: number;
  scopeId: string;
  selectedId: string | null;
  macroMode: boolean;
  hubRotation: number;
  dragStart: { x: number; y: number; px: number; py: number } | null;
  hoverNodeId: string | null;
  hoverEdgeId: string | null;
}

function bezierPoint(
  t: number,
  x0: number, y0: number,
  cx: number, cy: number,
  x1: number, y1: number
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
    y: mt * mt * y0 + 2 * mt * t * cy + t * t * y1,
  };
}

export function ConstellationCanvas({ data, scopeId, selectedId, macroMode, onNodeClick, onEdgeClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stRef = useRef<State>({
    nodes: [],
    allNodes: [],
    edges: [],
    zoom: 1,
    panX: 0,
    panY: 0,
    scopeId: 'hub',
    selectedId: null,
    macroMode: false,
    hubRotation: 0,
    dragStart: null,
    hoverNodeId: null,
    hoverEdgeId: null,
  });
  const frameRef = useRef<((ts: number) => void) | null>(null);
  const rafRef = useRef<number>(0);
  const prevTsRef = useRef<number>(0);

  // Sync props into state ref
  useEffect(() => { stRef.current.selectedId = selectedId; }, [selectedId]);
  useEffect(() => { stRef.current.macroMode = macroMode; }, [macroMode]);

  // Rebuild the scoped view whenever the data or current level changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const D = Math.min(canvas.offsetWidth, canvas.offsetHeight);

    const rNodes = computeScopedLayout(data.nodes, scopeId, D);
    rNodes.forEach(n => { n.visible = false; n.scale = 0; n.opacity = 0; });

    stRef.current.scopeId = scopeId;
    stRef.current.nodes = rNodes;
    stRef.current.allNodes = data.nodes;
    stRef.current.edges = data.edges.map(e => ({ ...e, visible: true, particleT: Math.random() }));

    // Auto-fit: compute zoom so the outermost nodes sit comfortably in the viewport.
    stRef.current.panX = 0;
    stRef.current.panY = 0;
    const maxExtent = rNodes.reduce((m, n) => Math.max(m, Math.abs(n.x), Math.abs(n.y)), 0);
    if (maxExtent > 0) {
      const halfView = Math.min(canvas.offsetWidth, canvas.offsetHeight) / 2 * 0.84;
      stRef.current.zoom = Math.min(1.6, Math.max(0.45, halfView / maxExtent));
    } else {
      stRef.current.zoom = 1;
    }

    const showAt = (id: string, delay: number) => {
      setTimeout(() => {
        const n = stRef.current.nodes.find(x => x.id === id);
        if (n) n.visible = true;
      }, delay);
    };

    // Staggered reveal ring by ring.
    rNodes.filter(n => n.level === 0).forEach(n => showAt(n.id, 60));
    const ring1 = rNodes.filter(n => n.level === 1);
    ring1.forEach((n, i) => showAt(n.id, 260 + i * 55));
    const ring2 = rNodes.filter(n => n.level === 2);
    ring2.forEach((n, i) => showAt(n.id, 260 + ring1.length * 55 + 180 + i * 35));
  }, [data, scopeId]);

  const hitTest = useCallback((cx: number, cy: number, canvas: HTMLCanvasElement): string | null => {
    const st = stRef.current;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    const worldX = (cx - W / 2 - st.panX) / st.zoom;
    const worldY = (cy - H / 2 - st.panY) / st.zoom;

    let best: string | null = null;
    let bestDist = Infinity;
    for (const n of st.nodes) {
      if (!n.visible) continue;
      const r = NODE_RADIUS[n.type] ?? 22;
      const dx = n.x - worldX;
      const dy = n.y - worldY;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < r + 6 && d < bestDist) {
        bestDist = d;
        best = n.id;
      }
    }
    return best;
  }, []);

  const hitTestEdge = useCallback((cx: number, cy: number, canvas: HTMLCanvasElement): string | null => {
    const st = stRef.current;
    if (!st.selectedId) return null;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    const worldX = (cx - W / 2 - st.panX) / st.zoom;
    const worldY = (cy - H / 2 - st.panY) / st.zoom;
    const threshold = Math.max(8, 10 / st.zoom);

    const visibleIds = new Set(st.nodes.map(n => n.id));
    const getPos = (id: string) => {
      const n = st.nodes.find(x => x.id === id);
      if (n && n.visible) return { x: n.x, y: n.y };
      return null;
    };

    for (const e of st.edges) {
      if (e.sourceId !== st.selectedId && e.targetId !== st.selectedId) continue;
      if (!st.macroMode && (!visibleIds.has(e.sourceId) || !visibleIds.has(e.targetId))) continue;
      const src = getPos(e.sourceId);
      const tgt = getPos(e.targetId);
      if (!src || !tgt) continue;

      const mx = (src.x + tgt.x) / 2;
      const my = (src.y + tgt.y) / 2;
      const bx = mx - (tgt.y - src.y) * 0.25;
      const by = my + (tgt.x - src.x) * 0.25;

      for (let t = 0; t <= 1; t += 0.05) {
        const pt = bezierPoint(t, src.x, src.y, bx, by, tgt.x, tgt.y);
        if (Math.sqrt((pt.x - worldX) ** 2 + (pt.y - worldY) ** 2) < threshold) {
          return e.id;
        }
      }
    }
    return null;
  }, []);

  // Zoom/reset via toolbar buttons
  useEffect(() => {
    const onZoom = (e: Event) => {
      const delta = (e as CustomEvent<number>).detail;
      const st = stRef.current;
      st.zoom = Math.min(2.2, Math.max(0.6, st.zoom + delta));
    };
    const onReset = () => {
      const st = stRef.current;
      st.zoom = 1;
      st.panX = 0;
      st.panY = 0;
    };
    window.addEventListener('constellation-zoom', onZoom);
    window.addEventListener('constellation-reset', onReset);
    return () => {
      window.removeEventListener('constellation-zoom', onZoom);
      window.removeEventListener('constellation-reset', onReset);
    };
  }, []);

  const draw = useCallback((ts: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const st = stRef.current;
    const dt = Math.min(ts - prevTsRef.current, 50);
    prevTsRef.current = ts;

    for (const n of st.nodes) {
      const target = n.visible ? 1 : 0;
      n.scale += (target - n.scale) * 0.08;
      n.opacity += (target - n.opacity) * 0.08;
    }
    st.hubRotation += dt * 0.0003;
    for (const e of st.edges) {
      e.particleT = (e.particleT + dt * 0.00025) % 1;
    }

    // Background
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#f0fdf4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    const haloGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.22);
    haloGrad.addColorStop(0, 'rgba(20,184,166,0.10)');
    haloGrad.addColorStop(1, 'rgba(20,184,166,0)');
    ctx.fillStyle = haloGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W / 2 + st.panX, H / 2 + st.panY);
    ctx.scale(st.zoom, st.zoom);

    const visibleIds = new Set(st.nodes.map(n => n.id));
    const selectedId = st.selectedId;

    // Which nodes are "connected" to the selection (tree neighbours + relations).
    const connectedIds = new Set<string>();
    if (selectedId) {
      connectedIds.add(selectedId);
      const sel = st.nodes.find(n => n.id === selectedId);
      if (sel?.parentId) connectedIds.add(sel.parentId);
      for (const n of st.nodes) if (n.parentId === selectedId) connectedIds.add(n.id);
      for (const e of st.edges) {
        if (e.sourceId === selectedId) connectedIds.add(e.targetId);
        if (e.targetId === selectedId) connectedIds.add(e.sourceId);
      }
    }
    const nodeOpacity = (id: string) => {
      if (!selectedId) return 1;
      return connectedIds.has(id) ? 1 : COLORS.focus.dimOpacity;
    };

    const find = (id: string) => st.nodes.find(n => n.id === id);

    // ── Ghost positions for macro mode (cross-sector nodes outside current scope) ──
    const ghostPos = new Map<string, { x: number; y: number }>();
    if (st.macroMode && selectedId) {
      const D = Math.min(W, H);
      const R_GHOST = D * 0.68;
      const outsideIds = [...new Set(
        st.edges
          .filter(e => (e.sourceId === selectedId || e.targetId === selectedId))
          .map(e => e.sourceId === selectedId ? e.targetId : e.sourceId)
          .filter(id => !visibleIds.has(id))
      )];
      outsideIds.forEach((id, i) => {
        const angle = -Math.PI / 2 + (i / Math.max(1, outsideIds.length)) * Math.PI * 2;
        ghostPos.set(id, { x: Math.cos(angle) * R_GHOST, y: Math.sin(angle) * R_GHOST });
      });
    }

    // Helper: coordinates for any node (scoped or ghost)
    const getCoords = (id: string): { x: number; y: number; phase: number } | null => {
      const n = find(id);
      if (n && n.visible) return { x: n.x, y: n.y, phase: n.phase };
      const gp = ghostPos.get(id);
      if (gp) return { x: gp.x, y: gp.y, phase: 0 };
      return null;
    };

    // ── Relationship edges — selected node, both ends available (scoped or ghost) ──
    if (selectedId) {
      for (const e of st.edges) {
        if (e.sourceId !== selectedId && e.targetId !== selectedId) continue;
        const srcCoords = getCoords(e.sourceId);
        const tgtCoords = getCoords(e.targetId);
        if (!srcCoords || !tgtCoords) continue;
        const isGhostEdge = ghostPos.has(e.sourceId) || ghostPos.has(e.targetId);

        // Without macro mode, skip edges where either end is outside the scope.
        if (!st.macroMode && (!visibleIds.has(e.sourceId) || !visibleIds.has(e.targetId))) continue;

        const ox = srcCoords.x + Math.sin(ts * 0.0004 + srcCoords.phase) * 3;
        const oy = srcCoords.y + Math.cos(ts * 0.0004 + srcCoords.phase) * 3;
        const tx = tgtCoords.x + Math.sin(ts * 0.0004 + tgtCoords.phase) * 3;
        const ty = tgtCoords.y + Math.cos(ts * 0.0004 + tgtCoords.phase) * 3;
        const mx = (ox + tx) / 2;
        const my = (oy + ty) / 2;
        const cx = mx - (ty - oy) * 0.25;
        const cy = my + (tx - ox) * 0.25;

        const srcNode = find(e.sourceId) ?? st.allNodes.find(n => n.id === e.sourceId);
        const tgtNode = find(e.targetId) ?? st.allNodes.find(n => n.id === e.targetId);
        const relStyle = e.relationType ? RELATION_STYLES[e.relationType] : undefined;
        const isPersonEdge = !relStyle &&
          (srcNode?.type === 'person' || srcNode?.type === 'elu') &&
          (tgtNode?.type === 'person' || tgtNode?.type === 'elu');
        const edgeColor = relStyle ?? (isPersonEdge ? COLORS.personEdge : COLORS.edge);

        const isHoveredEdge = st.hoverEdgeId === e.id;
        ctx.save();
        ctx.globalAlpha = isGhostEdge ? 0.55 : 0.9;
        ctx.strokeStyle = edgeColor.stroke;
        ctx.lineWidth = isHoveredEdge ? (relStyle ? 3.5 : 3) : (relStyle ? 2 : 1.5);
        ctx.setLineDash([5, 6]);
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.quadraticCurveTo(cx, cy, tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow at target
        const p1 = bezierPoint(0.92, ox, oy, cx, cy, tx, ty);
        const p2 = bezierPoint(0.97, ox, oy, cx, cy, tx, ty);
        const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - 8 * Math.cos(ang - 0.4), ty - 8 * Math.sin(ang - 0.4));
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - 8 * Math.cos(ang + 0.4), ty - 8 * Math.sin(ang + 0.4));
        ctx.stroke();

        // Particle
        const pt = bezierPoint(e.particleT, ox, oy, cx, cy, tx, ty);
        ctx.fillStyle = edgeColor.particle;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Label — near arrowhead so direction is readable
        const lpt = bezierPoint(0.68, ox, oy, cx, cy, tx, ty);
        ctx.fillStyle = edgeColor.label;
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.label, lpt.x, lpt.y - 8);
        ctx.restore();
      }
    }

    // ── Tree links — structure of the current level (always shown) ──────────
    const TREE_LINK_COLOR: Record<string, string> = {
      person: '#fb923c',
      elu: '#c084fc',
      company: '#60a5fa',
      institution: '#94a3b8',
    };
    for (const n of st.nodes) {
      if (n.level === 0) continue;
      const parent = n.parentId ? find(n.parentId) : (n.type === 'indie' ? find(st.scopeId) : undefined);
      if (!parent || !parent.visible || !n.visible) continue;

      const px = parent.x + Math.sin(ts * 0.0004 + parent.phase) * 3;
      const py = parent.y + Math.cos(ts * 0.0004 + parent.phase) * 3;
      const nx = n.x + Math.sin(ts * 0.0004 + n.phase) * 3;
      const ny = n.y + Math.cos(ts * 0.0004 + n.phase) * 3;
      const op = Math.min(nodeOpacity(n.id), nodeOpacity(parent.id));

      ctx.save();
      ctx.globalAlpha = op * 0.3 * n.opacity;
      ctx.strokeStyle = TREE_LINK_COLOR[n.type] ?? '#34d399';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.restore();
    }

    // ── Nodes ───────────────────────────────────────────────────────────────
    const order: Record<string, number> = { hub: 5, pillar: 4, subtheme: 3, indie: 3, institution: 2, company: 2, elu: 1, person: 1 };
    const sortedNodes = [...st.nodes].sort((a, b) => (order[a.type] ?? 0) - (order[b.type] ?? 0));

    for (const n of sortedNodes) {
      if (n.opacity < 0.01) continue;
      const r = (NODE_RADIUS[n.type] ?? 22) * n.scale;
      const ox = n.x + Math.sin(ts * 0.0004 + n.phase) * 3;
      const oy = n.y + Math.cos(ts * 0.0004 + n.phase) * 3;
      const isHovered = st.hoverNodeId === n.id;
      const finalR = r * (isHovered || selectedId === n.id ? 1.14 : 1);
      const op = nodeOpacity(n.id) * n.opacity;

      ctx.save();
      ctx.globalAlpha = op;
      ctx.translate(ox, oy);

      if (n.type === 'hub') {
        ctx.save();
        ctx.rotate(st.hubRotation);
        const hGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, finalR);
        hGrad.addColorStop(0, '#1f4034');
        hGrad.addColorStop(1, '#0d1f1a');
        ctx.fillStyle = hGrad;
        ctx.beginPath();
        ctx.arc(0, 0, finalR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.hubRing;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        ctx.fillStyle = COLORS.hubText;
        ctx.font = `bold ${Math.round(finalR * 0.55)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LPE', 0, 0);

      } else if (n.type === 'pillar') {
        const pGrad = ctx.createRadialGradient(0, -finalR * 0.2, 0, 0, 0, finalR);
        pGrad.addColorStop(0, '#234d38');
        pGrad.addColorStop(1, '#1a3329');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(0, 0, finalR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.pillar.stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = COLORS.pillar.text;
        ctx.font = `600 ${Math.round(finalR * 0.38)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const words = n.label.split(' ');
        if (words.length > 1) {
          ctx.fillText(words[0], 0, -finalR * 0.18);
          ctx.fillText(words.slice(1).join(' '), 0, finalR * 0.18);
        } else ctx.fillText(n.label, 0, 0);

      } else if (n.type === 'indie') {
        ctx.fillStyle = '#f0fdf4';
        ctx.beginPath();
        ctx.arc(0, 0, finalR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#166534';
        ctx.font = `500 ${Math.round(finalR * 0.36)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const words = n.label.split(' ');
        if (words.length > 1) {
          ctx.fillText(words[0], 0, -finalR * 0.18);
          ctx.fillText(words.slice(1).join(' '), 0, finalR * 0.18);
        } else ctx.fillText(n.label, 0, 0);

      } else if (n.type === 'company') {
        ctx.fillStyle = COLORS.company.fill;
        ctx.beginPath();
        ctx.arc(0, 0, finalR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.company.stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = COLORS.company.stroke;
        ctx.fillRect(-finalR * 0.22, -finalR * 0.1, finalR * 0.18, finalR * 0.25);
        ctx.fillRect(finalR * 0.04, -finalR * 0.2, finalR * 0.22, finalR * 0.35);
        ctx.fillStyle = COLORS.company.text;
        ctx.font = `700 ${Math.round(finalR * 0.32)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const w = n.label.split(' ');
        if (w.length > 1) {
          ctx.fillText(w[0], 0, -finalR * 0.55);
          ctx.fillText(w.slice(1).join(' '), 0, -finalR * 0.3);
        } else ctx.fillText(n.label, 0, -finalR * 0.45);

      } else if (n.type === 'person') {
        ctx.fillStyle = COLORS.person.fill;
        ctx.beginPath();
        ctx.arc(0, 0, finalR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.person.stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
        const parts = n.title.split(' ');
        const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : n.title.slice(0, 2).toUpperCase();
        ctx.fillStyle = COLORS.person.initials;
        ctx.font = `700 ${Math.round(finalR * 0.52)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, 0, 0);

      } else if (n.type === 'elu') {
        ctx.fillStyle = COLORS.elu.fill;
        ctx.beginPath();
        ctx.arc(0, 0, finalR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.elu.stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
        const parts = n.title.split(' ');
        const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : n.title.slice(0, 2).toUpperCase();
        ctx.fillStyle = COLORS.elu.initials;
        ctx.font = `700 ${Math.round(finalR * 0.5)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, 0, 0);

      } else if (n.type === 'institution') {
        const s = finalR * 0.92;
        const rad = finalR * 0.28;
        ctx.fillStyle = COLORS.institution.fill;
        ctx.strokeStyle = COLORS.institution.stroke;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s + rad, -s);
        ctx.arcTo(s, -s, s, s, rad);
        ctx.arcTo(s, s, -s, s, rad);
        ctx.arcTo(-s, s, -s, -s, rad);
        ctx.arcTo(-s, -s, s, -s, rad);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = COLORS.institution.text;
        ctx.font = `600 ${Math.round(finalR * 0.34)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const w = n.label.split(' ');
        if (w.length > 1) {
          ctx.fillText(w[0], 0, -finalR * 0.18);
          ctx.fillText(w.slice(1).join(' '), 0, finalR * 0.18);
        } else ctx.fillText(n.label, 0, 0);

      } else {
        // subtheme
        ctx.fillStyle = '#f0fdf4';
        ctx.beginPath();
        ctx.arc(0, 0, finalR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.subtheme.stroke;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = COLORS.subtheme.text;
        ctx.font = `500 ${Math.round(finalR * 0.38)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const words = n.label.split(' ');
        if (words.length === 1) ctx.fillText(n.label, 0, 0);
        else if (words.length === 2) {
          ctx.fillText(words[0], 0, -finalR * 0.2);
          ctx.fillText(words[1], 0, finalR * 0.2);
        } else {
          const mid = Math.ceil(words.length / 2);
          ctx.fillText(words.slice(0, mid).join(' '), 0, -finalR * 0.2);
          ctx.fillText(words.slice(mid).join(' '), 0, finalR * 0.2);
        }
      }

      // "Plonger" hint ring for nodes that have a deeper level
      if (n.level >= 1 && n._hasChildren && st.hoverNodeId === n.id) {
        ctx.globalAlpha = op * 0.5;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, finalR + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    }

    // ── Ghost nodes (macro mode: out-of-scope connected nodes) ──────────────
    if (st.macroMode && ghostPos.size > 0) {
      const GHOST_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
        person:      { fill: '#fff7ed', stroke: '#fb923c', text: '#9a3412' },
        elu:         { fill: '#faf5ff', stroke: '#c084fc', text: '#6b21a8' },
        company:     { fill: '#eff6ff', stroke: '#60a5fa', text: '#1e40af' },
        institution: { fill: '#f1f5f9', stroke: '#94a3b8', text: '#334155' },
        subtheme:    { fill: '#f0fdf4', stroke: '#34d399', text: '#065f46' },
      };

      for (const [ghostId, gp] of ghostPos.entries()) {
        const ghostData = st.allNodes.find(n => n.id === ghostId);
        if (!ghostData) continue;
        const tc = GHOST_COLORS[ghostData.type] ?? GHOST_COLORS.subtheme;
        const r = (NODE_RADIUS[ghostData.type] ?? 18) * 0.88;

        ctx.save();
        ctx.translate(gp.x, gp.y);
        ctx.globalAlpha = 0.70;

        ctx.fillStyle = tc.fill;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = tc.stroke;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (ghostData.type === 'person' || ghostData.type === 'elu') {
          const parts = ghostData.title.split(' ');
          const initials = parts.length >= 2
            ? (parts[0][0] + parts[1][0]).toUpperCase()
            : ghostData.title.slice(0, 2).toUpperCase();
          ctx.fillStyle = tc.text;
          ctx.font = `700 ${Math.round(r * 0.52)}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(initials, 0, 0);
        }

        // Label + sector badge below
        ctx.globalAlpha = 0.80;
        ctx.fillStyle = '#374151';
        ctx.font = `600 10px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(ghostData.label, 0, r + 5);
        if (ghostData.personCompany) {
          ctx.fillStyle = tc.text;
          ctx.font = `500 9px system-ui, sans-serif`;
          ctx.fillText(ghostData.personCompany, 0, r + 17);
        }

        ctx.restore();
      }
    }

    ctx.restore();
    rafRef.current = requestAnimationFrame(frameRef.current!);
  }, []);

  frameRef.current = draw;

  useEffect(() => {
    rafRef.current = requestAnimationFrame(ts => {
      prevTsRef.current = ts;
      rafRef.current = requestAnimationFrame(frameRef.current!);
    });
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // Mouse handlers
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const st = stRef.current;
    if (st.dragStart) {
      st.panX = st.dragStart.px + (e.clientX - st.dragStart.x);
      st.panY = st.dragStart.py + (e.clientY - st.dragStart.y);
      return;
    }
    const lx = e.clientX - rect.left;
    const ly = e.clientY - rect.top;
    const nodeHit = hitTest(lx, ly, canvas);
    const edgeHit = nodeHit ? null : hitTestEdge(lx, ly, canvas);
    st.hoverNodeId = nodeHit;
    st.hoverEdgeId = edgeHit;
    canvas.style.cursor = (nodeHit || edgeHit) ? 'pointer' : 'grab';
  }, [hitTest, hitTestEdge]);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const st = stRef.current;
    st.dragStart = { x: e.clientX, y: e.clientY, px: st.panX, py: st.panY };
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = 'grabbing';
  }, []);

  const onMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const st = stRef.current;
    const wasDragging = st.dragStart &&
      (Math.abs(e.clientX - st.dragStart.x) > 4 || Math.abs(e.clientY - st.dragStart.y) > 4);
    st.dragStart = null;
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = 'grab';
    if (!wasDragging && canvas) {
      const rect = canvas.getBoundingClientRect();
      const lx = e.clientX - rect.left;
      const ly = e.clientY - rect.top;
      const nodeHit = hitTest(lx, ly, canvas);
      if (nodeHit) {
        onNodeClick(nodeHit);
      } else {
        const edgeHit = hitTestEdge(lx, ly, canvas);
        if (edgeHit) onEdgeClick?.(edgeHit, e.clientX, e.clientY);
      }
    }
  }, [hitTest, hitTestEdge, onNodeClick, onEdgeClick]);

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    const st = stRef.current;
    st.zoom = Math.min(2.2, Math.max(0.6, st.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
  }, []);

  const onMouseLeave = useCallback(() => {
    stRef.current.hoverNodeId = null;
    stRef.current.hoverEdgeId = null;
    stRef.current.dragStart = null;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
      onMouseLeave={onMouseLeave}
    />
  );
}
