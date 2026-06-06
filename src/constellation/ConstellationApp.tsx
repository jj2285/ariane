import { useState, useCallback, useEffect } from 'react';
import { ConstellationCanvas } from './ConstellationCanvas';
import { InfoPanel } from './InfoPanel';
import { EdgeTooltip } from './EdgeTooltip';
import { Intro } from './Intro';
import { AdminPanel } from './AdminPanel';
import { Legend } from './Legend';
import { SearchBar } from './SearchBar';
import type { ConstellationData, NodeData, RuntimeNode } from './types';
import { loadData, isIntroDone } from './storage';

// Path from the hub down to the given node (for the breadcrumb).
function pathTo(nodes: NodeData[], id: string): NodeData[] {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const path: NodeData[] = [];
  let cur: NodeData | undefined = byId.get(id);
  while (cur) {
    path.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return path;
}

export function ConstellationApp() {
  const [data, setData] = useState<ConstellationData>(() => loadData());
  const [scopeId, setScopeId] = useState<string>('hub');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [introActive, setIntroActive] = useState(() => !isIntroDone());
  const [macroMode, setMacroMode] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<{ id: string; x: number; y: number } | null>(null);

  // Admin panel hidden by default — unlock with Ctrl+Shift+A
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setAdminUnlocked(v => !v);
        setShowAdmin(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const activeNode: RuntimeNode | null = selectedId
    ? (data.nodes.find(n => n.id === selectedId) as RuntimeNode | undefined) ?? null
    : null;

  const selectedHasChildren = !!selectedId && data.nodes.some(n => n.parentId === selectedId);

  const handleNodeClick = useCallback((id: string) => {
    setSelectedEdge(null);
    setSelectedId(prev => (prev === id ? null : id));
  }, []);

  const handleClose = useCallback(() => setSelectedId(null), []);

  const handleDrill = useCallback((id: string) => {
    setScopeId(id);
    setSelectedId(null);
  }, []);

  // Search: scope to the node's parent so it shows up, then select it.
  const handleSearchSelect = useCallback((id: string) => {
    const node = data.nodes.find(n => n.id === id);
    if (!node) return;
    setScopeId(node.parentId ?? 'hub');
    setSelectedId(id);
  }, [data.nodes]);

  const handleScopeTo = useCallback((id: string) => {
    setScopeId(id);
    setSelectedId(null);
  }, []);

  const handleIntroComplete = useCallback(() => setIntroActive(false), []);

  const pillarNames = data.nodes.filter(n => n.type === 'pillar').map(n => n.label);
  const crumbs = pathTo(data.nodes, scopeId);
  const scopeNode = data.nodes.find(n => n.id === scopeId);
  const parentOfScope = scopeNode?.parentId;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <ConstellationCanvas
        data={data}
        scopeId={scopeId}
        selectedId={selectedId}
        macroMode={macroMode}
        onNodeClick={handleNodeClick}
        onEdgeClick={(id, x, y) => setSelectedEdge({ id, x, y })}
      />

      {selectedEdge && (() => {
        const edge = data.edges.find(e => e.id === selectedEdge.id);
        if (!edge) return null;
        const srcNode = data.nodes.find(n => n.id === edge.sourceId);
        const tgtNode = data.nodes.find(n => n.id === edge.targetId);
        return (
          <EdgeTooltip
            edge={edge}
            sourceName={srcNode?.label ?? edge.sourceId}
            targetName={tgtNode?.label ?? edge.targetId}
            x={selectedEdge.x}
            y={selectedEdge.y}
            onClose={() => setSelectedEdge(null)}
          />
        );
      })()}

      {activeNode && (
        <InfoPanel
          node={activeNode}
          onClose={handleClose}
          hasChildren={selectedHasChildren}
          onDrill={() => handleDrill(activeNode.id)}
        />
      )}

      {showAdmin && (
        <AdminPanel data={data} onChange={setData} onClose={() => setShowAdmin(false)} />
      )}

      <SearchBar data={data} onSelect={handleSearchSelect} />

      <Legend />

      {/* Breadcrumb — le fil d'Ariane */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(255,255,255,0.94)',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '7px 14px',
        backdropFilter: 'blur(8px)',
        zIndex: 6,
        maxWidth: '60vw',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#1e293b', letterSpacing: '0.14em', marginRight: 4 }}>
          ARIANE
        </span>
        {parentOfScope !== undefined && (
          <button
            onClick={() => handleScopeTo(parentOfScope)}
            title="Remonter d'un niveau"
            style={{
              background: 'none', border: '1px solid #e2e8f0', borderRadius: 5,
              width: 22, height: 22, cursor: 'pointer', color: '#475569',
              fontSize: 13, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >‹</button>
        )}
        {crumbs.map((c, i) => (
          <span key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {i > 0 && <span style={{ color: '#cbd5e1', fontSize: 11 }}>›</span>}
            <button
              onClick={() => handleScopeTo(c.id)}
              disabled={i === crumbs.length - 1}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: i === crumbs.length - 1 ? 'default' : 'pointer',
                fontSize: 12,
                fontWeight: i === crumbs.length - 1 ? 700 : 500,
                color: i === crumbs.length - 1 ? '#0f766e' : '#64748b',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160,
              }}
            >
              {c.id === 'hub' ? 'Accueil' : c.label}
            </button>
          </span>
        ))}
      </div>

      {/* Macro mode toggle — reveal cross-sector relationship links */}
      <button
        onClick={() => setMacroMode(v => !v)}
        title="Afficher les liens hors secteur (vision macro)"
        style={{
          position: 'absolute',
          bottom: 130,
          right: 16,
          background: macroMode ? '#0f766e' : 'rgba(255,255,255,0.92)',
          border: `1px solid ${macroMode ? '#0f766e' : '#d1fae5'}`,
          borderRadius: 6,
          padding: '6px 10px',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
          color: macroMode ? '#fff' : '#0f766e',
          backdropFilter: 'blur(8px)',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          whiteSpace: 'nowrap',
          boxShadow: macroMode ? '0 0 0 2px #5eead4' : 'none',
        }}
      >
        <span style={{ fontSize: 13 }}>🔗</span>
        {macroMode ? 'Liens croisés ON' : 'Liens croisés'}
      </button>

      <ZoomControls />

      {adminUnlocked && (
        <button
          onClick={() => setShowAdmin(v => !v)}
          style={{
            position: 'absolute', bottom: 16, left: 16,
            background: showAdmin ? '#059669' : 'rgba(255,255,255,0.92)',
            border: '1px solid #d1fae5', borderRadius: 6, padding: '6px 12px',
            cursor: 'pointer', fontSize: 11, fontWeight: 600,
            color: showAdmin ? '#fff' : '#059669', backdropFilter: 'blur(8px)', zIndex: 5,
          }}
        >
          {showAdmin ? '✕ Admin' : '⚙ Admin'}
        </button>
      )}

      {introActive && (
        <Intro
          nodeCount={data.nodes.length}
          edgeCount={data.edges.length}
          pillarNames={pillarNames}
          onComplete={handleIntroComplete}
        />
      )}
    </div>
  );
}

function ZoomControls() {
  const zoom = (delta: number) => window.dispatchEvent(new CustomEvent('constellation-zoom', { detail: delta }));
  const reset = () => window.dispatchEvent(new CustomEvent('constellation-reset'));

  const btnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.92)', border: '1px solid #d1fae5', borderRadius: 4,
    width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#059669', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)',
  };

  return (
    <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 5 }}>
      <button onClick={() => zoom(0.15)} style={btnStyle}>+</button>
      <button onClick={reset} style={{ ...btnStyle, fontSize: 11, fontWeight: 600, color: '#6b7280' }}>⌂</button>
      <button onClick={() => zoom(-0.15)} style={btnStyle}>−</button>
    </div>
  );
}
