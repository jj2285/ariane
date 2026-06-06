import { useEffect, useState } from 'react';
import type { RuntimeNode } from './types';

interface Props {
  node: RuntimeNode | null;
  onClose: () => void;
}

export function InfoPanel({ node, onClose }: Props) {
  const [displayed, setDisplayed] = useState<RuntimeNode | null>(null);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (node) {
      setDisplayed(node);
      setAnimKey(k => k + 1);
    }
  }, [node]);

  if (!displayed) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 300,
        height: '100%',
        background: 'rgba(255,255,255,0.97)',
        borderLeft: '1px solid #d1fae5',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 20px',
        boxSizing: 'border-box',
        backdropFilter: 'blur(8px)',
        overflowY: 'auto',
        zIndex: 10,
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 12,
          right: 14,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          color: '#6ee7b7',
          lineHeight: 1,
        }}
        aria-label="Fermer"
      >
        ×
      </button>

      <div key={animKey} style={{ animation: 'fadeUp 0.35s ease both' }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#34d399',
          background: '#f0fdf4',
          padding: '2px 8px',
          borderRadius: 4,
          border: '1px solid #a7f3d0',
        }}>
          {displayed.type === 'hub' ? 'HUB' :
           displayed.type === 'pillar' ? 'PILIER' :
           displayed.type === 'indie' ? 'THÈME INDÉPENDANT' : 'SOUS-THÈME'}
        </span>

        <h2 style={{
          marginTop: 12,
          marginBottom: 8,
          fontSize: 17,
          fontWeight: 700,
          color: '#064e3b',
          lineHeight: 1.3,
        }}>
          {displayed.title}
        </h2>

        <p style={{
          fontSize: 13,
          color: '#374151',
          lineHeight: 1.6,
          margin: '0 0 20px',
        }}>
          {displayed.body}
        </p>

        {displayed.stat && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #a7f3d0',
            borderRadius: 8,
            padding: '14px 16px',
            marginBottom: 20,
          }}>
            <div style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#059669',
              fontFamily: 'Georgia, serif',
              lineHeight: 1,
            }}>
              {displayed.stat}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
              {displayed.statLabel}
            </div>
          </div>
        )}

        {displayed.worksUrl && (
          <a
            href={displayed.worksUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: '#059669',
              textDecoration: 'none',
              border: '1px solid #34d399',
              padding: '6px 14px',
              borderRadius: 6,
            }}
          >
            Voir nos travaux →
          </a>
        )}
      </div>
    </div>
  );
}
