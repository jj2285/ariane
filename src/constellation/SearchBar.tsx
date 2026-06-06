import { useState, useMemo, useRef, useEffect } from 'react';
import type { ConstellationData } from './types';
import { TYPE_LABELS, TYPE_SWATCH } from './colors';

interface Props {
  data: ConstellationData;
  onSelect: (id: string) => void;
}

export function SearchBar({ data, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return data.nodes
      .filter(n =>
        n.label.toLowerCase().includes(q) ||
        n.title.toLowerCase().includes(q) ||
        (n.personCompany ?? '').toLowerCase().includes(q) ||
        (n.personPosition ?? '').toLowerCase().includes(q) ||
        (n.eluParty ?? '').toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, data.nodes]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, []);

  const pick = (id: string) => {
    onSelect(id);
    window.dispatchEvent(new CustomEvent('constellation-center', { detail: id }));
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrapRef} style={{
      position: 'absolute',
      top: 16,
      left: 16,
      width: 260,
      zIndex: 7,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute',
          left: 11,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 13,
          color: '#94a3b8',
          pointerEvents: 'none',
        }}>⌕</span>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter' && results[0]) pick(results[0].id); }}
          placeholder="Rechercher un acteur…"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '9px 12px 9px 30px',
            fontSize: 13,
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: 'rgba(255,255,255,0.96)',
            color: '#1e293b',
            outline: 'none',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        />
      </div>

      {open && results.length > 0 && (
        <div style={{
          marginTop: 6,
          background: 'rgba(255,255,255,0.98)',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          overflow: 'hidden',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        }}>
          {results.map(n => (
            <button
              key={n.id}
              onClick={() => pick(n.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid #f1f5f9',
                cursor: 'pointer',
                fontSize: 12,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{
                width: 10,
                height: 10,
                borderRadius: n.type === 'institution' ? 2 : '50%',
                border: `2px solid ${TYPE_SWATCH[n.type] ?? '#94a3b8'}`,
                flexShrink: 0,
              }} />
              <span style={{ flex: 1, color: '#1e293b', fontWeight: 500 }}>{n.title || n.label}</span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>{TYPE_LABELS[n.type]}</span>
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && results.length === 0 && (
        <div style={{
          marginTop: 6,
          background: 'rgba(255,255,255,0.98)',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: '10px 12px',
          fontSize: 12,
          color: '#94a3b8',
          backdropFilter: 'blur(8px)',
        }}>
          Aucun résultat
        </div>
      )}
    </div>
  );
}
