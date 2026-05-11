import React from 'react';

export const AlertBanner = ({ type = "warning", message }: { type?: "warning" | "danger", message: string }) => (
  <div className={`alert-banner ${type}`}>
    <span style={{ fontSize: '1.2rem' }}>{type === 'warning' ? '⚠️' : '🚨'}</span>
    {message}
  </div>
);