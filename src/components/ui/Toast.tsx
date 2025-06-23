import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export const Toast = ({ message, onClose }: ToastProps) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  
  if (!message) return null;
  
  return (
    <div style={{
      position: 'fixed',
      left: '50%',
      bottom: 60,
      transform: 'translateX(-50%)',
      background: '#222',
      color: '#fff',
      padding: '10px 22px',
      borderRadius: 8,
      boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
      fontSize: 15,
      zIndex: 9999,
      pointerEvents: 'auto',
    }}>
      {message}
    </div>
  );
}; 