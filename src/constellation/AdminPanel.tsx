import { useState } from 'react';
import type { ConstellationData, NodeData, EdgeData, RelationType } from './types';
import { saveData, resetData } from './storage';

const DEPTH_BY_TYPE: Record<string, number> = {
  pillar: 1, indie: 1, subtheme: 2, company: 3, institution: 3, person: 4, elu: 4,
};

const RELATION_OPTIONS: RelationType[] = ['soutient', 'finance', 'fournit', 'regule', 'emploie', 'collabore'];

interface Props {
  data: ConstellationData;
  onChange: (data: ConstellationData) => void;
  onClose: () => void;
}

type Tab = 'nodes' | 'edges' | 'create-node' | 'create-edge';

export function AdminPanel({ data, onChange, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('nodes');
  const [editNodeId, setEditNodeId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<NodeData>>({});
  const [edgeDraft, setEdgeDraft] = useState<Partial<EdgeData>>({});
  const [newNode, setNewNode] = useState<Partial<NodeData>>({
    type: 'subtheme', depth: 2, label: '', title: '', body: '',
  });

  const editNode = (id: string) => {
    const n = data.nodes.find(x => x.id === id);
    if (!n) return;
    setDraft({ ...n });
    setEditNodeId(id);
    setTab('nodes');
  };

  const saveNode = () => {
    if (!editNodeId) return;
    const updated = data.nodes.map(n => n.id === editNodeId ? { ...n, ...draft } as NodeData : n);
    const newData = { ...data, nodes: updated };
    saveData(newData);
    onChange(newData);
    setEditNodeId(null);
  };

  const createNode = () => {
    if (!newNode.label || !newNode.title) return;
    const type = (newNode.type as NodeData['type']) || 'subtheme';
    const id = `node-${Date.now()}`;
    const node: NodeData = {
      id,
      label: newNode.label!,
      type,
      parentId: type !== 'indie' ? newNode.parentId : undefined,
      depth: DEPTH_BY_TYPE[type] ?? 2,
      title: newNode.title!,
      body: newNode.body || '',
      stat: newNode.stat,
      statLabel: newNode.statLabel,
      personPosition: newNode.personPosition,
      personEmail: newNode.personEmail,
      personPhone: newNode.personPhone,
      personCompany: newNode.personCompany,
      eluMandate: newNode.eluMandate,
      eluParty: newNode.eluParty,
      eluCommission: newNode.eluCommission,
      institutionKind: newNode.institutionKind,
    };
    const newData = { ...data, nodes: [...data.nodes, node] };
    saveData(newData);
    onChange(newData);
    setNewNode({ type: 'subtheme', depth: 2, label: '', title: '', body: '' });
    setTab('nodes');
  };

  const handleReset = () => {
    const fresh = resetData();
    onChange(fresh);
    setTab('nodes');
  };

  const createEdge = () => {
    if (!edgeDraft.sourceId || !edgeDraft.targetId || !edgeDraft.label) return;
    const edge: EdgeData = {
      id: `edge-${Date.now()}`,
      sourceId: edgeDraft.sourceId!,
      targetId: edgeDraft.targetId!,
      label: edgeDraft.label!,
      relationType: edgeDraft.relationType,
    };
    const newData = { ...data, edges: [...data.edges, edge] };
    saveData(newData);
    onChange(newData);
    setEdgeDraft({});
    setTab('edges');
  };

  const deleteNode = (id: string) => {
    const newData = {
      nodes: data.nodes.filter(n => n.id !== id && n.parentId !== id),
      edges: data.edges.filter(e => e.sourceId !== id && e.targetId !== id),
    };
    saveData(newData);
    onChange(newData);
  };

  const deleteEdge = (id: string) => {
    const newData = { ...data, edges: data.edges.filter(e => e.id !== id) };
    saveData(newData);
    onChange(newData);
  };

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 340,
    height: '100%',
    background: 'rgba(5,15,10,0.97)',
    borderRight: '1px solid #1a3329',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 20,
    color: '#d1fae5',
    fontSize: 13,
    backdropFilter: 'blur(8px)',
  };

  const inputStyle: React.CSSProperties = {
    background: '#0d1f1a',
    border: '1px solid #1a3329',
    color: '#d1fae5',
    borderRadius: 4,
    padding: '5px 8px',
    fontSize: 12,
    width: '100%',
    boxSizing: 'border-box',
  };

  const btnStyle: React.CSSProperties = {
    background: '#059669',
    border: 'none',
    color: '#fff',
    borderRadius: 4,
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #1a3329', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, letterSpacing: '0.05em', fontSize: 13, color: '#34d399' }}>ADMIN</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6ee7b7', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a3329' }}>
        {(['nodes', 'edges', 'create-node', 'create-edge'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1,
            background: tab === t ? '#0d2a1f' : 'none',
            border: 'none',
            borderBottom: tab === t ? '2px solid #34d399' : '2px solid transparent',
            color: tab === t ? '#34d399' : '#6b7280',
            padding: '8px 4px',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}>
            {t === 'nodes' ? 'NŒUDS' : t === 'edges' ? 'LIENS' : t === 'create-node' ? '+ NŒUD' : '+ LIEN'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>

        {/* Edit node inline */}
        {editNodeId && tab === 'nodes' && (
          <div style={{ marginBottom: 16, background: '#0d2a1f', borderRadius: 6, padding: 12 }}>
            <p style={{ color: '#34d399', fontWeight: 600, marginBottom: 10, fontSize: 11 }}>ÉDITION</p>
            {(['label', 'title', 'body', 'stat', 'statLabel', 'worksUrl'] as const).map(field => (
              <div key={field} style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 3, fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>{field}</label>
                {field === 'body' ? (
                  <textarea
                    value={(draft as Record<string, string>)[field] || ''}
                    onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))}
                    style={{ ...inputStyle, height: 70, resize: 'vertical' }}
                  />
                ) : (
                  <input
                    value={(draft as Record<string, string>)[field] || ''}
                    onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))}
                    style={inputStyle}
                  />
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={saveNode} style={btnStyle}>Sauvegarder</button>
              <button onClick={() => setEditNodeId(null)} style={{ ...btnStyle, background: '#374151' }}>Annuler</button>
            </div>
          </div>
        )}

        {/* Nodes list */}
        {tab === 'nodes' && !editNodeId && data.nodes.map(n => (
          <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #0f2a1e' }}>
            <div>
              <span style={{ color: n.type === 'hub' ? '#34d399' : n.type === 'pillar' ? '#6ee7b7' : n.type === 'indie' ? '#86efac' : '#d1fae5', fontSize: 12, fontWeight: n.type === 'pillar' ? 600 : 400 }}>
                {'  '.repeat(Math.max(0, n.depth - 1))}{n.label}
              </span>
              <span style={{ color: '#374151', fontSize: 10, marginLeft: 6 }}>{n.type}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => editNode(n.id)} style={{ background: 'none', border: '1px solid #1a3329', color: '#6ee7b7', borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontSize: 10 }}>✎</button>
              {n.type !== 'hub' && (
                <button onClick={() => deleteNode(n.id)} style={{ background: 'none', border: '1px solid #3b0f0f', color: '#f87171', borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontSize: 10 }}>✕</button>
              )}
            </div>
          </div>
        ))}

        {/* Edges list */}
        {tab === 'edges' && data.edges.map(e => (
          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #0f2a1e', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#9ca3af', flex: 1 }}>
              {e.sourceId} → <span style={{ color: '#34d399' }}>{e.label}</span> → {e.targetId}
            </span>
            <button onClick={() => deleteEdge(e.id)} style={{ background: 'none', border: '1px solid #3b0f0f', color: '#f87171', borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontSize: 10 }}>✕</button>
          </div>
        ))}

        {/* Create node */}
        {tab === 'create-node' && (
          <div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>Type</label>
              <select value={newNode.type} onChange={e => setNewNode(n => ({ ...n, type: e.target.value as NodeData['type'] }))} style={inputStyle}>
                <option value="pillar">Pilier</option>
                <option value="subtheme">Sous-thème</option>
                <option value="indie">Thème transverse</option>
                <option value="company">Entreprise</option>
                <option value="institution">Institution</option>
                <option value="person">Contact</option>
                <option value="elu">Élu / Député</option>
              </select>
            </div>
            {newNode.type !== 'indie' && newNode.type !== 'pillar' && (
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>Parent</label>
                <select value={newNode.parentId || ''} onChange={e => setNewNode(n => ({ ...n, parentId: e.target.value }))} style={inputStyle}>
                  <option value="">— choisir —</option>
                  {data.nodes.filter(n => n.type !== 'hub').map(n => (
                    <option key={n.id} value={n.id}>{n.label} ({n.type})</option>
                  ))}
                </select>
              </div>
            )}
            {newNode.type === 'elu' && (['eluMandate', 'eluParty', 'eluCommission'] as const).map(field => (
              <div key={field} style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 3, fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>{field}</label>
                <input value={(newNode as Record<string, string>)[field] || ''} onChange={e => setNewNode(n => ({ ...n, [field]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
            {newNode.type === 'institution' && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 3, fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>institutionKind</label>
                <input value={newNode.institutionKind || ''} onChange={e => setNewNode(n => ({ ...n, institutionKind: e.target.value }))} style={inputStyle} />
              </div>
            )}
            {(newNode.type === 'person' || newNode.type === 'elu') && (['personEmail', 'personPhone'] as const).map(field => (
              <div key={field} style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 3, fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>{field}</label>
                <input value={(newNode as Record<string, string>)[field] || ''} onChange={e => setNewNode(n => ({ ...n, [field]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
            {newNode.type === 'person' && (['personPosition', 'personCompany'] as const).map(field => (
              <div key={field} style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 3, fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>{field}</label>
                <input value={(newNode as Record<string, string>)[field] || ''} onChange={e => setNewNode(n => ({ ...n, [field]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
            {(['label', 'title', 'body', 'stat', 'statLabel'] as const).map(field => (
              <div key={field} style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 3, fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>{field}</label>
                {field === 'body' ? (
                  <textarea value={(newNode as Record<string, string>)[field] || ''} onChange={e => setNewNode(n => ({ ...n, [field]: e.target.value }))} style={{ ...inputStyle, height: 60, resize: 'vertical' }} />
                ) : (
                  <input value={(newNode as Record<string, string>)[field] || ''} onChange={e => setNewNode(n => ({ ...n, [field]: e.target.value }))} style={inputStyle} />
                )}
              </div>
            ))}
            <button onClick={createNode} style={{ ...btnStyle, marginTop: 8, width: '100%' }}>Créer le nœud</button>
          </div>
        )}

        {/* Create edge */}
        {tab === 'create-edge' && (
          <div>
            {(['sourceId', 'targetId'] as const).map(field => (
              <div key={field} style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>{field === 'sourceId' ? 'Source' : 'Cible'}</label>
                <select value={edgeDraft[field] || ''} onChange={e => setEdgeDraft(d => ({ ...d, [field]: e.target.value }))} style={inputStyle}>
                  <option value="">— choisir —</option>
                  {data.nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              </div>
            ))}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>Type de relation</label>
              <select value={edgeDraft.relationType || ''} onChange={e => setEdgeDraft(d => ({ ...d, relationType: (e.target.value || undefined) as RelationType | undefined }))} style={inputStyle}>
                <option value="">— neutre —</option>
                {RELATION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>Étiquette</label>
              <input value={edgeDraft.label || ''} onChange={e => setEdgeDraft(d => ({ ...d, label: e.target.value }))} style={inputStyle} placeholder="auditionne, finance, fournit…" />
            </div>
            <button onClick={createEdge} style={{ ...btnStyle, width: '100%' }}>Créer le lien</button>
          </div>
        )}
      </div>

      {/* Footer — reset */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #1a3329' }}>
        <button
          onClick={handleReset}
          style={{ background: 'none', border: '1px solid #3b0f0f', color: '#f87171', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 11, width: '100%' }}
        >
          ↺ Réinitialiser les données
        </button>
      </div>
    </div>
  );
}
