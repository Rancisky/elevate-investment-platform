import React from 'react';

const AdminList = ({ adminUsers, loading, onDemoteAdmin }) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      marginBottom: '30px'
    }}>
      <h3 style={{ marginBottom: '20px', color: '#333' }}>Current Administrators</h3>
      {adminUsers.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {adminUsers.map((admin) => (
            <div key={admin._id} style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              padding: '20px',
              border: '2px solid #dc3545'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '15px'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{admin.name}</h4>
                  <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                    {admin.username} • {admin.userId}
                  </p>
                  <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                    {admin.email}
                  </p>
                </div>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: '#dc3545',
                  color: 'white'
                }}>
                  ADMIN
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => onDemoteAdmin(admin)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#ffc107',
                    color: '#212529',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Demote to Member
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
          {loading ? 'Loading administrators...' : 'No administrators found.'}
        </p>
      )}
    </div>
  );
};

export default AdminList;