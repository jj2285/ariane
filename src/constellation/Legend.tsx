import { useState } from 'react';
import { TYPE_LABELS, TYPE_SWATCH, RELATION_STYLES } from './colors';

// Types shown in the legend (skip hub — it's obvious as the centre).
const NODE_TYPES = ['pillar', 'subtheme', 'indie', 'company', 'institution', 'person', 'elu'];
const RELATIONS = Object.keys(RELATION_STYLES);

export function Legend() {
  const [open, setOpen] = useState(true);

  return (
    <div style={{
      position: 'absolute',
      top: 64,
      left: 16,
      width: open ? 210 : 'auto',
      background: 'rgba(255,255,255,0.94)',
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      padding: open ? '12px 14px' : '8px 12px',
      backdropFilter: 'blur(8px)',
      zIndex: 6,
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#475569',
          width: '100%',
        }}
      >
        <span style={{ fontSize: 9, transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>▼</span>
        LÉGENDE
      </button>

      {open && (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', margin: '12px 0 6px' }}>
            ACTEURS
          </div>
          {NODE_TYPES.map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
              <span style={{
                width: 12,
                height: 12,
                borderRadius: t === 'institution' ? 3 : '50%',
                background: '#fff',
                border: `2px solid ${TYPE_SWATCH[t]}`,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, color: '#334155' }}>{TYPE_LABELS[t]}</span>
            </div>
          ))}

          <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', margin: '12px 0 6px' }}>
            RELATIONS
          </div>
          {RELATIONS.map(r => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
              <span style={{
                width: 16,
                height: 0,
                borderTop: `2px solid ${RELATION_STYLES[r].particle}`,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, color: '#334155' }}>{RELATION_STYLES[r].legend}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
