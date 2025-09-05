import React from 'react';

const StatCard = ({ title, value, color = '#007bff', icon }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '30px', marginBottom: '10px' }}>{icon}</div>
    <h3 style={{ 
      color: '#666', 
      fontSize: '12px', 
      fontWeight: '500', 
      margin: '0 0 8px 0',
      textTransform: 'uppercase'
    }}>
      {title}
    </h3>
    <p style={{
      color: color,
      fontSize: '24px',
      fontWeight: 'bold',
      margin: 0
    }}>
      {typeof value === 'number' && (title.includes('Funds') || title.includes('Contributions')) 
        ? `₦${value.toLocaleString()}` 
        : value.toLocaleString()}
    </p>
  </div>
);

export default StatCard;