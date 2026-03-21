import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

type Phase = 'logo' | 'loading' | 'exiting';

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [phase, setPhase] = useState<Phase>('logo');

  useEffect(() => {
    const LOGO_DURATION = 1000;
    const LOADING_DURATION = 1800;
    const POLL_INTERVAL = 300;

    let pollCount = 0;
    let pollTimer: ReturnType<typeof setInterval>;

    const logoTimer = setTimeout(() => {
      setPhase('loading');

      pollTimer = setInterval(() => {
        pollCount++;
        const ready = document.getElementById('root')?.children.length > 0;
        if (ready || pollCount >= Math.floor(LOADING_DURATION / POLL_INTERVAL)) {
          clearInterval(pollTimer);
          setPhase('exiting');
          setTimeout(onFinish, 400);
        }
      }, POLL_INTERVAL);
    }, LOGO_DURATION);

    return () => {
      clearTimeout(logoTimer);
      clearInterval(pollTimer);
    };
  }, [onFinish]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'opacity 0.4s ease',
        opacity: phase === 'exiting' ? 0 : 1,
      }}
    >
      <img
        src="/logo.png"
        alt="Elite Esports"
        style={{
          width: '70px',
          height: '70px',
          objectFit: 'contain',
          borderRadius: '16px',
        }}
      />

      <div
        style={{
          marginTop: '40px',
          transition: 'opacity 0.5s ease',
          opacity: phase === 'loading' ? 1 : 0,
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          style={{ animation: phase === 'loading' ? 'splash-spin 0.9s linear infinite' : 'none' }}
        >
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="#FF4500"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="22 66"
            strokeDashoffset="0"
          />
        </svg>
      </div>

      <style>{`
        @keyframes splash-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
