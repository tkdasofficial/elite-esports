import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 400);
    }, 2200);
    return () => clearTimeout(timer);
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
        gap: '40px',
        zIndex: 9999,
        transition: 'opacity 0.4s ease',
        opacity: visible ? 1 : 0,
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

      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        style={{ animation: 'splash-spin 0.9s linear infinite' }}
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

      <style>{`
        @keyframes splash-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
