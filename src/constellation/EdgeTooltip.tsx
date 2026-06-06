import type { EdgeData } from './types';
import { RELATION_STYLES } from './colors';

const RELATION_DESCRIPTIONS: Record<string, string> = {
  soutient:  'Appui politique, médiatique ou symbolique. L\'un des acteurs prend publiquement position en faveur de l\'autre ou de ses intérêts.',
  finance:   'Flux de capitaux, subventions ou investissements. Cette relation crée une dépendance économique et un levier d\'influence.',
  fournit:   'Livraison de biens, services ou technologies critiques. Une dépendance opérationnelle qui peut devenir stratégique.',
  regule:    'Encadrement légal, contrôle ou supervision institutionnelle. Cet acteur définit les règles du jeu auxquelles l\'autre est soumis.',
  emploie:   'Lien hiérarchique ou contractuel de travail. Structure les relations de pouvoir et les flux d\'information internes.',
  collabore: 'Partenariat, projet commun ou alliance stratégique. Intérêts temporairement alignés sur un objectif partagé.',
};

interface Props {
  edge: EdgeData;
  sourceName: string;
  targetName: string;
  x: number;
  y: number;
  onClose: () => void;
}

export function EdgeTooltip({ edge, sourceName, targetName, x, y, onClose }: Props) {
  const relStyle = edge.relationType ? RELATION_STYLES[edge.relationType] : null;
  const body =
    edge.body ??
    (edge.relationType ? RELATION_DESCRIPTIONS[edge.relationType] : null) ??
    'Relation entre ces deux acteurs.';

  const safeLeft = Math.min(x + 14, window.innerWidth - 268);
  const safeTop = Math.max(10, Math.min(y - 24, window.innerHeight - 200));

  // Derive solid accent color from the RGBA stroke string
  const accentColor = relStyle ? relStyle.particle : '#64748b';
  const bgTint = relStyle
    ? relStyle.stroke.replace(/[\d.]+\)$/, '0.06)')
    : 'rgba(100,116,139,0.06)';
  const borderColor = relStyle
    ? relStyle.stroke.replace(/[\d.]+\)$/, '0.25)')
    : 'rgba(100,116,139,0.25)';

  return (
    <div
      style={{
        position: 'fixed',
        left: safeLeft,
        top: safeTop,
        width: 248,
        background: 'rgba(255,255,255,0.97)',
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: '14px 16px 14px',
        zIndex: 25,
        boxShadow: '0 8px 28px rgba(0,0,0,0.11)',
        backdropFilter: 'blur(10px)',
        animation: 'fadeUp 0.2s ease both',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 10, right: 12,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 16, color: '#9ca3af', lineHeight: 1, padding: 0,
        }}
        aria-label="Fermer"
      >
        ×
      </button>

      {/* Badge type de relation */}
      {relStyle && (
        <span style={{
          display: 'inline-block',
          fontSize: 9, fontWeight: 700, letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: accentColor,
          background: bgTint,
          padding: '2px 7px', borderRadius: 4,
          border: `1px solid ${borderColor}`,
        }}>
          {edge.relationType}
        </span>
      )}

      {/* Source → label → target */}
      <div style={{
        marginTop: 10, marginBottom: 10,
        display: 'flex', alignItems: 'center',
        gap: 5, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{sourceName}</span>
        <span style={{ fontSize: 10, color: '#cbd5e1' }}>›</span>
        <span style={{
          fontSize: 13, fontWeight: 700,
          color: accentColor,
          padding: '1px 6px',
          background: bgTint,
          borderRadius: 4,
        }}>
          {edge.label}
        </span>
        <span style={{ fontSize: 10, color: '#cbd5e1' }}>›</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{targetName}</span>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, margin: 0 }}>
        {body}
      </p>
    </div>
  );
}
