import React from 'react';

interface PalSliderProps {
  value: number;
  onChange: (val: number) => void;
}

const PAL_MAPPING = [
  { min: 1.20, max: 1.25, label: "Sedentary Baseline", desc: "Desk job, driving commute, minimal intentional movement" },
  { min: 1.30, max: 1.40, label: "Lightly Active", desc: "Mostly sitting, 1–3 days/week of light casual exercise or walking" },
  { min: 1.45, max: 1.55, label: "Moderately Active", desc: "Active job like retail/teaching, or 3–5 days/week of moderate exercise" },
  { min: 1.60, max: 1.70, label: "Very Active", desc: "Heavy physical job, or 6–7 days/week of vigorous gym training/sports" },
  { min: 1.75, max: 1.85, label: "Extremely Active", desc: "Highly physical labor combined with daily moderate training" },
  { min: 1.90, max: 2.10, label: "High-Volume Endurance", desc: "Marathon prep, long-distance cycling, non-mechanized agricultural labor" },
  { min: 2.15, max: 2.40, label: "Elite Endurance", desc: "Professional athletes in multi-hour daily training blocks" },
  { min: 2.45, max: 2.50, label: "Physiological Ceiling", desc: "Maximum sustainable human output; e.g., Tour de France, multi-week hyperexertion" },
];

export const PalSlider: React.FC<PalSliderProps> = ({ value, onChange }) => {
  const currentMapping = PAL_MAPPING.find(m => value >= m.min && value <= m.max) || { label: "Standard Activity", desc: "Variable intensity" };

  return (
    <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)' }}>PAL: {value.toFixed(2)}</span>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Physical Activity Level</span>
      </div>

      <div style={{ position: 'relative', height: '24px', display: 'flex', alignItems: 'center' }}>
        <input
          type="range"
          min={1.2}
          max={2.5}
          step={0.05}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            cursor: 'pointer',
            accentColor: 'var(--accent)',
            zIndex: 2,
            position: 'relative'
          }}
        />
        {/* Tick mark at 2.0 */}
        <div style={{
          position: 'absolute',
          left: `${((2.0 - 1.2) / (2.5 - 1.2)) * 100}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '2px',
          height: '14px',
          background: '#64748b',
          pointerEvents: 'none',
          zIndex: 1
        }} />
        <span style={{
          position: 'absolute',
          left: `${((2.0 - 1.2) / (2.5 - 1.2)) * 100}%`,
          top: '100%',
          transform: 'translateX(-50%)',
          fontSize: '0.6rem',
          fontWeight: 800,
          color: '#64748b',
          marginTop: '2px'
        }}>2.0</span>
      </div>

      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>{currentMapping.label}</div>
        <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.4 }}>{currentMapping.desc}</div>
      </div>
    </div>
  );
};
