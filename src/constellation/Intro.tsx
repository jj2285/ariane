import { useEffect, useRef, useState } from 'react';
import { markIntroDone } from './storage';

interface Props {
  nodeCount: number;
  edgeCount: number;
  pillarNames: string[];
  onComplete: () => void;
}

export function Intro({ nodeCount, edgeCount, pillarNames, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [typeText, setTypeText] = useState('');
  const [showTitle, setShowTitle] = useState(false);
  const [countersVal, setCountersVal] = useState({ nodes: 0, edges: 0 });
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const skip = () => {
    markIntroDone();
    onComplete();
  };

  // Step 0 — typewriter
  useEffect(() => {
    if (step !== 0) return;
    const msg = 'INITIALISATION DU SYSTÈME…';
    let i = 0;
    setTypeText('');
    setShowTitle(false);
    const iv = setInterval(() => {
      setTypeText(msg.slice(0, ++i));
      if (i >= msg.length) {
        clearInterval(iv);
        setTimeout(() => setShowTitle(true), 400);
        autoRef.current = setTimeout(() => setStep(1), 2200);
      }
    }, 45);
    return () => { clearInterval(iv); if (autoRef.current) clearTimeout(autoRef.current); };
  }, [step]);

  // Step 1 — animated counters
  useEffect(() => {
    if (step !== 1) return;
    setCountersVal({ nodes: 0, edges: 0 });
    const dur = 900;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCountersVal({
        nodes: Math.round(ease * nodeCount),
        edges: Math.round(ease * edgeCount),
      });
      if (p < 1) requestAnimationFrame(tick);
      else {
        autoRef.current = setTimeout(() => setStep(2), 1000);
      }
    };
    requestAnimationFrame(tick);
    return () => { if (autoRef.current) clearTimeout(autoRef.current); };
  }, [step, nodeCount, edgeCount]);

  // Step 2 — pillar list lighting up
  useEffect(() => {
    if (step !== 2) return;
    setVisibleLines([]);
    let i = 0;
    const iv = setInterval(() => {
      setVisibleLines(prev => [...prev, i]);
      i++;
      if (i >= pillarNames.length) {
        clearInterval(iv);
        autoRef.current = setTimeout(() => setStep(3), 1000);
      }
    }, 350);
    return () => { clearInterval(iv); if (autoRef.current) clearTimeout(autoRef.current); };
  }, [step, pillarNames]);

  // Steps 3, 4 — auto-advance
  useEffect(() => {
    if (step !== 3 && step !== 4) return;
    autoRef.current = setTimeout(() => setStep(step + 1), 3200);
    return () => { if (autoRef.current) clearTimeout(autoRef.current); };
  }, [step]);

  // Step 5 — complete after 2.1s
  useEffect(() => {
    if (step !== 5) return;
    autoRef.current = setTimeout(() => {
      markIntroDone();
      onComplete();
    }, 2100);
    return () => { if (autoRef.current) clearTimeout(autoRef.current); };
  }, [step, onComplete]);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: step === 5 ? 'rgba(0,0,0,0)' : 'rgba(5,15,10,0.93)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      transition: step === 5 ? 'background 1.5s ease' : undefined,
      pointerEvents: 'auto',
    }}>
      {/* Skip button */}
      {step < 5 && (
        <button
          onClick={skip}
          style={{
            position: 'absolute',
            top: 20,
            right: 24,
            background: 'none',
            border: '1px solid rgba(52,211,153,0.4)',
            color: 'rgba(52,211,153,0.7)',
            padding: '6px 14px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 11,
            letterSpacing: '0.1em',
          }}
        >
          PASSER
        </button>
      )}

      {/* Step 0 */}
      {step === 0 && (
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'monospace',
            color: '#34d399',
            fontSize: 13,
            letterSpacing: '0.08em',
            marginBottom: 20,
            minHeight: 20,
          }}>
            {typeText}
            <span style={{ animation: 'blink 0.8s step-end infinite' }}>|</span>
          </p>
          {showTitle && (
            <h1 style={{
              color: '#ffffff',
              fontSize: 'clamp(18px, 3vw, 32px)',
              fontWeight: 700,
              letterSpacing: '0.15em',
              animation: 'fadeUp 0.6s ease both',
              margin: 0,
            }}>
              CONSTELLATION DES SOUVERAINETÉS
            </h1>
          )}
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ textAlign: 'center', animation: 'fadeUp 0.4s ease both' }}>
          <div style={{ display: 'flex', gap: 48, justifyContent: 'center', marginBottom: 16 }}>
            <Stat value={countersVal.nodes} label="nœuds" />
            <Stat value={countersVal.edges} label="connexions" />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8 }}>
            cartographie active
          </p>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ textAlign: 'center', animation: 'fadeUp 0.4s ease both' }}>
          <p style={{ color: '#34d399', fontSize: 11, letterSpacing: '0.1em', marginBottom: 16 }}>
            4 PILIERS
          </p>
          {pillarNames.map((name, i) => (
            <div key={name} style={{
              opacity: visibleLines.includes(i) ? 1 : 0,
              transition: 'opacity 0.3s ease',
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 8,
            }}>
              {name}
            </div>
          ))}
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div style={{ textAlign: 'center', maxWidth: 380, padding: '0 20px', animation: 'fadeUp 0.4s ease both' }}>
          <p style={{ color: '#34d399', fontSize: 11, letterSpacing: '0.1em', marginBottom: 16 }}>
            ARCHITECTURE
          </p>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.7 }}>
            Chaque pilier se ramifie en sous-systèmes.
            Cliquez sur un nœud pour explorer ses détails et voir ses connexions s'illuminer.
          </p>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div style={{ textAlign: 'center', maxWidth: 380, padding: '0 20px', animation: 'fadeUp 0.4s ease both' }}>
          <p style={{ color: '#34d399', fontSize: 11, letterSpacing: '0.1em', marginBottom: 16 }}>
            INTERDÉPENDANCES
          </p>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.7 }}>
            Les flèches en pointillés révèlent comment les souverainetés se conditionnent mutuellement.
            Aucune n'existe seule.
          </p>
        </div>
      )}

      {/* Step 5 */}
      {step === 5 && (
        <div style={{ textAlign: 'center', animation: 'fadeUp 0.4s ease both' }}>
          <p style={{
            color: '#34d399',
            fontSize: 'clamp(24px, 4vw, 48px)',
            fontWeight: 700,
            letterSpacing: '0.1em',
          }}>
            À vous.
          </p>
        </div>
      )}

      {/* Step indicator */}
      {step < 5 && (
        <div style={{
          position: 'absolute',
          bottom: 24,
          display: 'flex',
          gap: 8,
        }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: i <= step ? '#34d399' : 'rgba(52,211,153,0.25)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: '#34d399', fontSize: 40, fontWeight: 700, fontFamily: 'Georgia, serif', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 }}>{label}</div>
    </div>
  );
}
