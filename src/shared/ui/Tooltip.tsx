import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  disabled?: boolean;
}

/**
 * A lightweight, instant-show tooltip component.
 * Replaces the native 'title' attribute to avoid browser-enforced delays.
 */
export const Tooltip: React.FC<TooltipProps> = ({ text, children, disabled }) => {
  const [visible, setVisible] = useState(false);

  if (!text || disabled) return <>{children}</>;

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block', width: '100%' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(-8px)',
          backgroundColor: '#1e293b',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          zIndex: 1000,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {text}
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            marginLeft: '-5px',
            borderWidth: '5px',
            borderStyle: 'solid',
            borderColor: '#1e293b transparent transparent transparent'
          }} />
        </div>
      )}
    </div>
  );
};
