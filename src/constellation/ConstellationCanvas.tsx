import { useRef, useEffect, useCallback } from 'react';;
import type { ConstellationData, RuntimeNode, RuntimeEdge } from './types';
import { computeLayout } from './layout';
import { COLORS, NODE_RADIUS } from './colors';

interface Props {
  data: ConstellationData;
  focusId: string | null;
  onNodeClick: (id: string) => void;
  introActive: boolean;
  introStep: number;
}

interface State {
  nodes: RuntimeNode[];
  edges: RuntimeEdge[];
  zoom: number;
  panX: number;
  panY: number;
  focusId: string | null;
  introActive: boolean;
  introStep: number;
  hubRotation: number;
  dragStart: { x: number; y: number; px: number; py: number } | null;
  hoverNodeId: string | null;
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

export function ConstellationCanvas({ data, focusId, onNodeClick, introActive, introStep }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stRef = useRef<State>({
    nodes: [],
    edges: [],
    zoom: 1,
    panX: 0,
    panY: 0,
    focusId: null,
    introActive: true,
    introStep: 0,
    hubRotation: 0,
    dragStart: null,
    hoverNodeId: null,
  });
  const frameRef = useRef<((ts: number) => void) | null>(null);
  const rafRef = useRef<number>(0);
  const prevTsRef = useRef<number>(0);

  // Sync props into state ref
  useEffect(() => {
    stRef.current.focusId = focusId;
    stRef.current.introActive = introActive;
    stRef.current.introStep = introStep;
  }, [focusId, introActive, introStep]);

  // Initialize / reinitialize when data changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const D = Math.min(canvas.offsetWidth, canvas.offsetHeight);

    const rNodes = computeLayout(data.nodes, D);
    // Staggered appear animation via setTimeout
    rNodes.forEach(n => { n.visible = false; n.scale = 0; n.opacity = 0; });

    const showAt = (ids: string[], delay: number) => {
      setTimeout(() => {
        ids.forEach(id => {
          const n = stRef.current.nodes.find(x => x.id === id);
          if (n) { n.visible = true; }
        });
      }, delay);
    };

    stRef.current.nodes = rNodes;
    stRef.current.edges = data.edges.map(e => ({
      ...e,
      visible: true,
      particleT: Math.random(),
    }));

    // Staggered reveal
    showAt(['hub'], 360);
    const pillars = rNodes.filter(n => n.type === 'pillar');
    pillars.forEach((p, i) => showAt([p.id], 1150 + i * 65));
    const subs = rNodes.filter(n => n.type === 'subtheme' || n.type === 'indie');
    subs.forEach((s, i) => showAt([s.id], 1150 + pillars.length * 65 + 200 + i * 65));
  }, [data]);

  const hitTest = useCallback((cx: number, cy: number, canvas: HTMLCanvasElement): string | null => {
    const st = stRef.current;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    const worldX = (cx * dpr / dpr - W / 2 - st.panX) / st.zoom;
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

  // Zoom/reset via custom events (from toolbar buttons)
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

  // Draw loop
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

    // Animate node scale/opacity
    for (const n of st.nodes) {
      const target = n.visible ? 1 : 0;
      n.scale += (target - n.scale) * 0.08;
      n.opacity += (target - n.opacity) * 0.08;
    }

    // Hub slow rotation
    st.hubRotation += dt * 0.0003;

    // Particle animation
    for (const e of st.edges) {
      e.particleT = (e.particleT + dt * 0.00025) % 1;
    }

    // --- Background ---
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#f0fdf4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Halo
    const haloGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.22);
    haloGrad.addColorStop(0, 'rgba(20,184,166,0.10)');
    haloGrad.addColorStop(1, 'rgba(20,184,166,0)');
    ctx.fillStyle = haloGrad;
    ctx.fillRect(0, 0, W, H);

    // Transform to world space
    ctx.save();
    ctx.translate(W / 2 + st.panX, H / 2 + st.panY);
    ctx.scale(st.zoom, st.zoom);

    // Build adjacency for focus
    const focusId = st.focusId;
    const connectedIds = new Set<string>();
    if (focusId) {
      connectedIds.add(focusId);
      for (const e of st.edges) {
        if (e.sourceId === focusId || e.targetId === focusId) {
          connectedIds.add(e.sourceId);
          connectedIds.add(e.targetId);
        }
      }
      // also include tree parent/children
      for (const n of st.nodes) {
        if (n.id === focusId) {
          if (n.parentId) connectedIds.add(n.parentId);
        }
        if (n.parentId === focusId) connectedIds.add(n.id);
      }
    }

    const nodeOpacity = (id: string) => {
      if (!focusId) return 1;
      if (connectedIds.has(id)) return 1;
      return COLORS.focus.dimOpacity;
    };

    // --- Draw edges ---
    for (const e of st.edges) {
      const src = st.nodes.find(n => n.id === e.sourceId);
      const tgt = st.nodes.find(n => n.id === e.targetId);
      if (!src || !tgt || !src.visible || !tgt.visible) continue;

      const ox = src.x + Math.sin(ts * 0.0004 + src.phase) * 3;
      const oy = src.y + Math.cos(ts * 0.0004 + src.phase) * 3;
      const tx = tgt.x + Math.sin(ts * 0.0004 + tgt.phase) * 3;
      const ty = tgt.y + Math.cos(ts * 0.0004 + tgt.phase) * 3;

      const mx = (ox + tx) / 2;
      const my = (oy + ty) / 2;
      const perp = { x: -(ty - oy) * 0.25, y: (tx - ox) * 0.25 };
      const cx = mx + perp.x;
      const cy = my + perp.y;

      const edgeOpacity = focusId
        ? (connectedIds.has(e.sourceId) && connectedIds.has(e.targetId) ? 0.8 : 0.05)
        : 0.4;

      const isPersonEdge = src.type === 'person' && tgt.type === 'person';
      const edgeColor = isPersonEdge ? COLORS.personEdge : COLORS.edge;

      ctx.save();
      ctx.globalAlpha = edgeOpacity;
      ctx.strokeStyle = edgeColor.stroke;
      ctx.lineWidth = isPersonEdge ? 1.2 : 1.5;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.quadraticCurveTo(cx, cy, tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow at target
      const arrowT = 0.92;
      const p1 = bezierPoint(arrowT, ox, oy, cx, cy, tx, ty);
      const p2 = bezierPoint(arrowT + 0.05, ox, oy, cx, cy, tx, ty);
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const aLen = 8;
      ctx.strokeStyle = edgeColor.stroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - aLen * Math.cos(angle - 0.4), ty - aLen * Math.sin(angle - 0.4));
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - aLen * Math.cos(angle + 0.4), ty - aLen * Math.sin(angle + 0.4));
      ctx.stroke();

      // Particle
      const pt = bezierPoint(e.particleT, ox, oy, cx, cy, tx, ty);
      ctx.globalAlpha = edgeOpacity * 0.9;
      ctx.fillStyle = edgeColor.particle;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Edge label at midpoint
      const lpt = bezierPoint(0.45, ox, oy, cx, cy, tx, ty);
      ctx.globalAlpha = edgeOpacity * 0.85;
      ctx.fillStyle = edgeColor.label;
      ctx.font = '9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.label, lpt.x, lpt.y - 8);

      ctx.restore();
    }

    // Hub–pillar lines (tree edges)
    for (const n of st.nodes) {
      if (n.type !== 'pillar' && n.type !== 'subtheme' && n.type !== 'company' && n.type !== 'person') continue;
      if (!n.parentId) continue;
      const parent = st.nodes.find(p => p.id === n.parentId);
      if (!parent || !parent.visible || !n.visible) continue;

      const px = parent.x + Math.sin(ts * 0.0004 + parent.phase) * 3;
      const py = parent.y + Math.cos(ts * 0.0004 + parent.phase) * 3;
      const nx = n.x + Math.sin(ts * 0.0004 + n.phase) * 3;
      const ny = n.y + Math.cos(ts * 0.0004 + n.phase) * 3;

      const op = Math.min(nodeOpacity(n.id), nodeOpacity(parent.id));

      const isPersonLink = n.type === 'person' || (st.nodes.find(x => x.id === n.parentId)?.type === 'person');
      ctx.save();
      ctx.globalAlpha = op * 0.25 * n.opacity;
      ctx.strokeStyle = isPersonLink ? '#fb923c' : (n.type === 'company' ? '#60a5fa' : '#34d399');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.restore();
    }

    // Hub lines (hub to pillars)
    const hub = st.nodes.find(n => n.type === 'hub');
    if (hub) {
      for (const n of st.nodes) {
        if (n.type !== 'pillar') continue;
        if (!n.visible) continue;
        const nx = n.x + Math.sin(ts * 0.0004 + n.phase) * 3;
        const ny = n.y + Math.cos(ts * 0.0004 + n.phase) * 3;
        const op = Math.min(nodeOpacity('hub'), nodeOpacity(n.id));
        ctx.save();
        ctx.globalAlpha = op * 0.3 * n.opacity * hub.opacity;
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        ctx.restore();
      }
    }

    // --- Draw nodes ---
    const sortedNodes = [...st.nodes].sort((a, b) => {
      const order: Record<string, number> = { hub: 5, pillar: 4, subtheme: 3, indie: 3, company: 2, person: 1 };
      return (order[a.type] ?? 0) - (order[b.type] ?? 0);
    });

    for (const n of sortedNodes) {
      if (n.opacity < 0.01) continue;

      const r = (NODE_RADIUS[n.type] ?? 22) * n.scale;
      const ox = n.x + Math.sin(ts * 0.0004 + n.phase) * 3;
      const oy = n.y + Math.cos(ts * 0.0004 + n.phase) * 3;

      const isHovered = st.hoverNodeId === n.id;
      const displayScale = isHovered || focusId === n.id ? 1.14 : 1;
      const finalR = r * displayScale;
      const op = nodeOpacity(n.id) * n.opacity;

      ctx.save();
      ctx.globalAlpha = op;
      ctx.translate(ox, oy);

      if (n.type === 'hub') {
        // Hub: dark rotating circle
        ctx.save();
        ctx.rotate(st.hubRotation);
        const hGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, finalR);
        hGrad.addColorStop(0, '#1f4034');
        hGrad.addColorStop(1, '#0d1f1a');
        ctx.fillStyle = hGrad;
        ctx.beginPath();
        ctx.arc(0, 0, finalR, 0, Math.PI * 2);
        ctx.fill();
        // Ring
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
        } else {
          ctx.fillText(n.label, 0, 0);
        }

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
        } else {
          ctx.fillText(n.label, 0, 0);
        }

      } else if (n.type === 'company') {
        // Company: rounded rect style with blue tones
        ctx.fillStyle = COLORS.company.fill;
        ctx.beginPath();
        ctx.arc(0, 0, finalR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.company.stroke;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Small building icon hint (2 rectangles)
        ctx.fillStyle = COLORS.company.stroke;
        ctx.fillRect(-finalR * 0.22, -finalR * 0.1, finalR * 0.18, finalR * 0.25);
        ctx.fillRect(finalR * 0.04, -finalR * 0.2, finalR * 0.22, finalR * 0.35);

        ctx.fillStyle = COLORS.company.text;
        ctx.font = `700 ${Math.round(finalR * 0.32)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cWords = n.label.split(' ');
        if (cWords.length > 1) {
          ctx.fillText(cWords[0], 0, -finalR * 0.55);
          ctx.fillText(cWords.slice(1).join(' '), 0, -finalR * 0.3);
        } else {
          ctx.fillText(n.label, 0, -finalR * 0.45);
        }

      } else if (n.type === 'person') {
        // Person: circle with initials
        ctx.fillStyle = COLORS.person.fill;
        ctx.beginPath();
        ctx.arc(0, 0, finalR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.person.stroke;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Initials
        const parts = n.title.split(' ');
        const initials = parts.length >= 2
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : n.title.slice(0, 2).toUpperCase();
        ctx.fillStyle = COLORS.person.initials;
        ctx.font = `700 ${Math.round(finalR * 0.52)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, 0, 0);

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
        if (words.length === 1) {
          ctx.fillText(n.label, 0, 0);
        } else if (words.length === 2) {
          ctx.fillText(words[0], 0, -finalR * 0.2);
          ctx.fillText(words[1], 0, finalR * 0.2);
        } else {
          const mid = Math.ceil(words.length / 2);
          ctx.fillText(words.slice(0, mid).join(' '), 0, -finalR * 0.2);
          ctx.fillText(words.slice(mid).join(' '), 0, finalR * 0.2);
        }
      }

      ctx.restore();
    }

    ctx.restore(); // world transform

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
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const st = stRef.current;
    if (st.dragStart) {
      st.panX = st.dragStart.px + (e.clientX - st.dragStart.x);
      st.panY = st.dragStart.py + (e.clientY - st.dragStart.y);
      return;
    }

    const hit = hitTest(cx, cy, canvas);
    st.hoverNodeId = hit;
    canvas.style.cursor = hit ? 'pointer' : 'grab';
  }, [hitTest]);

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
      const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top, canvas);
      if (hit) onNodeClick(hit);
    }
  }, [hitTest, onNodeClick]);

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const st = stRef.current;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    st.zoom = Math.min(2.2, Math.max(0.6, st.zoom * factor));
  }, []);

  const onMouseLeave = useCallback(() => {
    stRef.current.hoverNodeId = null;
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
