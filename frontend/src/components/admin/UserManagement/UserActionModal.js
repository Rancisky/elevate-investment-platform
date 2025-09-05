import React from 'react';

const UserActionModal = ({ selectedUser, userAction, loading, onConfirm, onClose }) => {
  if (!selectedUser) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#333' }}>
            {userAction === 'promote' ? 'Promote to Admin' : 'Demote Admin'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <div>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>{selectedUser.name}</h3>
            <p style={{ margin: '0 0 5px 0', color: '#666' }}>
              <strong>User ID:</strong> {selectedUser.userId}
            </p>
            <p style={{ margin: '0 0 5px 0', color: '#666' }}>
              <strong>Username:</strong> {selectedUser.username}
            </p>
            <p style={{ margin: '0 0 5px 0', color: '#666' }}>
              <strong>Email:</strong> {selectedUser.email}
            </p>
            <p style={{ margin: '0', color: '#666' }}>
              <strong>Current Role:</strong> {selectedUser.role}
            </p>
          </div>

          <div style={{
            backgroundColor: userAction === 'promote' ? '#e8f5e8' : '#f8d7da',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <p style={{ 
              margin: 0, 
              color: userAction === 'promote' ? '#2d5a2d' : '#721c24',
              fontSize: '14px'
            }}>
              {userAction === 'promote' 
                ? `Are you sure you want to promote ${selectedUser.name} to admin? They will have access to all admin features including user management, campaign creation, and system settings.`
                : `Are you sure you want to demote ${selectedUser.name} from admin to regular member? They will lose all admin privileges.`
              }
            </p>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: userAction === 'promote' ? '#28a745' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Processing...' : (userAction === 'promote' ? 'Promote' : 'Demote')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActionModal;