import { useState, useCallback } from 'react';
import { ConstellationCanvas } from './ConstellationCanvas';
import { InfoPanel } from './InfoPanel';
import { Intro } from './Intro';
import { AdminPanel } from './AdminPanel';
import { Legend } from './Legend';
import { SearchBar } from './SearchBar';
import type { ConstellationData, RuntimeNode } from './types';
import { loadData, isIntroDone } from './storage';

export function ConstellationApp() {
  const [data, setData] = useState<ConstellationData>(() => loadData());
  const [focusId, setFocusId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [introActive, setIntroActive] = useState(() => !isIntroDone());
  const [introStep] = useState(0);

  const activeNode: RuntimeNode | null = focusId
    ? (data.nodes.find(n => n.id === focusId) as RuntimeNode | undefined) ?? null
    : null;

  const handleNodeClick = useCallback((id: string) => {
    setFocusId(prev => prev === id ? null : id);
    setShowInfo(true);
  }, []);

  const handleClose = useCallback(() => {
    setFocusId(null);
    setShowInfo(false);
  }, []);

  const handleIntroComplete = useCallback(() => {
    setIntroActive(false);
  }, []);

  const pillarNames = data.nodes
    .filter(n => n.type === 'pillar')
    .map(n => n.label);

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
        focusId={focusId}
        onNodeClick={handleNodeClick}
        introActive={introActive}
        introStep={introStep}
      />

      {showInfo && activeNode && (
        <InfoPanel node={activeNode} onClose={handleClose} />
      )}

      {showAdmin && (
        <AdminPanel
          data={data}
          onChange={setData}
          onClose={() => setShowAdmin(false)}
        />
      )}

      <SearchBar data={data} onSelect={handleNodeClick} />

      <Legend />

      <div style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '8px 16px',
        backdropFilter: 'blur(8px)',
        zIndex: 5,
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', letterSpacing: '0.16em' }}>
          ARIANE
        </span>
        <span style={{ color: '#cbd5e1', fontSize: 10 }}>·</span>
        <span style={{ fontSize: 10, color: '#64748b' }}>
          le fil des acteurs · {data.nodes.length} nœuds · {data.edges.length} liens
        </span>
      </div>

      <ZoomControls />

      <button
        onClick={() => setShowAdmin(v => !v)}
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          background: showAdmin ? '#059669' : 'rgba(255,255,255,0.92)',
          border: '1px solid #d1fae5',
          borderRadius: 6,
          padding: '6px 12px',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
          color: showAdmin ? '#fff' : '#059669',
          backdropFilter: 'blur(8px)',
          zIndex: 5,
        }}
      >
        {showAdmin ? '✕ Admin' : '⚙ Admin'}
      </button>

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
  const zoom = (delta: number) => {
    const ev = new CustomEvent('constellation-zoom', { detail: delta });
    window.dispatchEvent(ev);
  };
  const reset = () => {
    const ev = new CustomEvent('constellation-reset');
    window.dispatchEvent(ev);
  };

  const btnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid #d1fae5',
    borderRadius: 4,
    width: 32,
    height: 32,
    cursor: 'pointer',
    fontSize: 16,
    color: '#059669',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 16,
      right: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      zIndex: 5,
    }}>
      <button onClick={() => zoom(0.15)} style={btnStyle}>+</button>
      <button onClick={reset} style={{ ...btnStyle, fontSize: 11, fontWeight: 600, color: '#6b7280' }}>⌂</button>
      <button onClick={() => zoom(-0.15)} style={btnStyle}>−</button>
    </div>
  );
}
