import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

type Phase = 'logo' | 'loading' | 'exiting';

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [phase, setPhase] = useState<Phase>('logo');

  useEffect(() => {
    const logoTimer = setTimeout(() => {
      setPhase('loading');

      const exitTimer = setTimeout(() => {
        setPhase('exiting');
        setTimeout(onFinish, 380);
      }, 1200);

      return () => clearTimeout(exitTimer);
    }, 2000);

    return () => clearTimeout(logoTimer);
  }, [onFinish]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: phase === 'exiting' ? 0 : 1,
        transition: 'opacity 0.38s ease',
      }}
    >
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: phase === 'logo' ? 1 : 0,
            transform: phase === 'logo' ? 'scale(1)' : 'scale(0.82)',
            transition: 'opacity 0.32s ease, transform 0.32s ease',
          }}
        >
          <svg
            width="48"
            height="76"
            viewBox="0 0 56 88"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="bolt-grad" x1="40" y1="3" x2="16" y2="85" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF6B35" />
                <stop offset="55%" stopColor="#FF4500" />
                <stop offset="100%" stopColor="#CC3700" />
              </linearGradient>
            </defs>
            <path
              d="M 40 3 L 6 52 L 24 52 L 14 85 L 50 36 L 32 36 Z"
              fill="url(#bolt-grad)"
            />
          </svg>
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: phase === 'loading' ? 1 : 0,
            transition: 'opacity 0.32s ease',
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 44 44"
            style={{ animation: phase === 'loading' ? 'splash-spin 0.85s linear infinite' : 'none' }}
          >
            <circle cx="22" cy="22" r="18" fill="none" stroke="#1a1a1a" strokeWidth="3.5" />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke="#FF4500"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="28 84"
              strokeDashoffset="0"
            />
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes splash-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
