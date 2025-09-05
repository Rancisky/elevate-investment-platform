import React from 'react';

const TabButton = ({ tab, label, isActive, onClick }) => (
  <button
    onClick={() => onClick(tab)}
    style={{
      padding: '10px 20px',
      backgroundColor: isActive ? '#007bff' : 'white',
      color: isActive ? 'white' : '#666',
      border: '2px solid #007bff',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '500',
      margin: '0 5px 5px 5px',
      fontSize: '14px'
    }}
  >
    {label}
  </button>
);

export default TabButton;