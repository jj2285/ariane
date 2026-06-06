import { useEffect, useState } from 'react';
import type { RuntimeNode } from './types';

interface Props {
  node: RuntimeNode | null;
  onClose: () => void;
  hasChildren?: boolean;
  onDrill?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  hub: 'CŒUR',
  pillar: 'PILIER',
  indie: 'THÈME TRANSVERSE',
  subtheme: 'SOUS-THÈME',
  company: 'ENTREPRISE',
  person: 'CONTACT',
  elu: 'ÉLU / DÉPUTÉ',
  institution: 'INSTITUTION',
};

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  hub:     { bg: '#f0fdf4', border: '#a7f3d0', text: '#064e3b', accent: '#059669' },
  pillar:  { bg: '#f0fdf4', border: '#a7f3d0', text: '#064e3b', accent: '#059669' },
  indie:   { bg: '#f0fdf4', border: '#a7f3d0', text: '#064e3b', accent: '#059669' },
  subtheme:{ bg: '#f0fdf4', border: '#a7f3d0', text: '#064e3b', accent: '#059669' },
  company: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', accent: '#2563eb' },
  person:  { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', accent: '#ea580c' },
  elu:     { bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8', accent: '#9333ea' },
  institution: { bg: '#f1f5f9', border: '#cbd5e1', text: '#334155', accent: '#475569' },
};

function Avatar({ name, fill, border, color }: { name: string; fill: string; border: string; color: string }) {
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();

  return (
    <div style={{
      width: 56,
      height: 56,
      borderRadius: '50%',
      background: fill,
      border: `2.5px solid ${border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 20,
      fontWeight: 700,
      color,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function ContactRow({ icon, value, href }: { icon: string; value: string; href?: string }) {
  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 13, width: 18, textAlign: 'center' }}>{icon}</span>
      <span style={{ fontSize: 12, color: '#374151' }}>{value}</span>
    </div>
  );
  if (href) return <a href={href} style={{ textDecoration: 'none' }}>{content}</a>;
  return content;
}

export function InfoPanel({ node, onClose, hasChildren, onDrill }: Props) {
  const [displayed, setDisplayed] = useState<RuntimeNode | null>(null);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (node) {
      setDisplayed(node);
      setAnimKey(k => k + 1);
    }
  }, [node]);

  if (!displayed) return null;

  const colors = TYPE_COLORS[displayed.type] ?? TYPE_COLORS.subtheme;
  const isElu = displayed.type === 'elu';
  const isPerson = displayed.type === 'person' || isElu;
  const isCompany = displayed.type === 'company';
  const isInstitution = displayed.type === 'institution';
  const panelBorder =
    isElu ? '#e9d5ff'
    : displayed.type === 'person' ? '#fed7aa'
    : isCompany ? '#bfdbfe'
    : isInstitution ? '#cbd5e1'
    : '#d1fae5';

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: 300,
      height: '100%',
      background: 'rgba(255,255,255,0.97)',
      borderLeft: `1px solid ${panelBorder}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 20px',
      boxSizing: 'border-box',
      backdropFilter: 'blur(8px)',
      overflowY: 'auto',
      zIndex: 10,
    }}>
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
          color: '#9ca3af',
          lineHeight: 1,
        }}
        aria-label="Fermer"
      >
        ×
      </button>

      <div key={animKey} style={{ animation: 'fadeUp 0.35s ease both' }}>

        {/* Badge type */}
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: colors.accent,
          background: colors.bg,
          padding: '2px 8px',
          borderRadius: 4,
          border: `1px solid ${colors.border}`,
        }}>
          {TYPE_LABELS[displayed.type] ?? displayed.type}
        </span>

        {/* ── FICHE PERSONNE / ÉLU ─────────────────────────── */}
        {isPerson ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, marginBottom: 14 }}>
              <Avatar
                name={displayed.title}
                fill={colors.bg}
                border={isElu ? '#c084fc' : '#fb923c'}
                color={colors.accent}
              />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                  {displayed.title}
                </div>
                <div style={{ fontSize: 12, color: colors.accent, fontWeight: 600, marginTop: 3 }}>
                  {isElu ? displayed.eluMandate : displayed.personPosition}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  {isElu ? displayed.eluParty : displayed.personCompany}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '0 0 16px' }}>
              {displayed.body}
            </p>

            {isElu && displayed.eluCommission && (
              <div style={{
                fontSize: 12,
                color: colors.text,
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 16,
              }}>
                <span style={{ fontWeight: 600 }}>Commission · </span>{displayed.eluCommission}
              </div>
            )}

            {/* Bloc contact */}
            {(displayed.personEmail || displayed.personPhone) && (
              <div style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: colors.accent, letterSpacing: '0.08em', marginBottom: 4 }}>
                  CONTACT
                </div>
                {displayed.personEmail && (
                  <ContactRow icon="✉" value={displayed.personEmail} href={`mailto:${displayed.personEmail}`} />
                )}
                {displayed.personPhone && (
                  <ContactRow icon="☎" value={displayed.personPhone} href={`tel:${displayed.personPhone}`} />
                )}
              </div>
            )}

            {displayed.stat && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: colors.accent, fontFamily: 'Georgia, serif' }}>
                  {displayed.stat}
                </span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>{displayed.statLabel}</span>
              </div>
            )}
          </>
        ) : (
          /* ── FICHE STANDARD (hub, pillar, subtheme, company, indie) ── */
          <>
            <h2 style={{
              marginTop: 12,
              marginBottom: 8,
              fontSize: 17,
              fontWeight: 700,
              color: colors.text,
              lineHeight: 1.3,
            }}>
              {displayed.title}
            </h2>

            {isInstitution && displayed.institutionKind && (
              <div style={{ fontSize: 12, color: colors.accent, fontWeight: 600, marginBottom: 10 }}>
                {displayed.institutionKind}
              </div>
            )}

            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '0 0 20px' }}>
              {displayed.body}
            </p>

            {displayed.stat && (
              <div style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: '14px 16px',
                marginBottom: 20,
              }}>
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: colors.accent,
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
                  color: colors.accent,
                  textDecoration: 'none',
                  border: `1px solid ${colors.border}`,
                  padding: '6px 14px',
                  borderRadius: 6,
                }}
              >
                Voir nos travaux →
              </a>
            )}
          </>
        )}

        {/* Plonger d'un niveau — poupée russe */}
        {hasChildren && onDrill && (
          <button
            onClick={onDrill}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              width: '100%',
              marginTop: 22,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              background: colors.accent,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Explorer ce niveau →
          </button>
        )}
      </div>
    </div>
  );
}
