import React from 'react';

const UserSearch = ({ 
  filteredUsers, 
  searchTerm, 
  setSearchTerm, 
  loading, 
  onPromoteUser, 
  onDemoteUser, 
  onRefresh 
}) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, color: '#333' }}>Promote Users to Admin</h3>
        <button
          onClick={onRefresh}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Refresh Users
        </button>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search users by name, username, email, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e1e5e9',
            borderRadius: '8px',
            fontSize: '16px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Users List */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
          Loading users...
        </p>
      ) : filteredUsers.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>
                  User
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>
                  User ID
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e9ecef' }}>
                  Role
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e9ecef' }}>
                  Status
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e9ecef' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.slice(0, 50).map((user) => (
                <tr key={user._id} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '12px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>
                        {user.name}
                      </p>
                      <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
                        {user.username} • {user.email}
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: '600' }}>
                    {user.userId}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: user.role === 'admin' ? '#dc3545' : '#28a745',
                      color: 'white'
                    }}>
                      {user.role?.toUpperCase() || 'MEMBER'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: user.isActive ? '#e8f5e8' : '#f8d7da',
                      color: user.isActive ? '#28a745' : '#721c24'
                    }}>
                      {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {user.role === 'admin' ? (
                      <button
                        onClick={() => onDemoteUser(user)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ffc107',
                          color: '#212529',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Demote
                      </button>
                    ) : (
                      <button
                        onClick={() => onPromoteUser(user)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Promote
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length > 50 && (
            <p style={{ textAlign: 'center', color: '#666', padding: '10px', fontSize: '14px' }}>
              Showing first 50 results. Use search to find specific users.
            </p>
          )}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
          {searchTerm ? 'No users found matching your search.' : 'No users available.'}
        </p>
      )}

      <div style={{
        backgroundColor: '#e3f2fd',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: '600', color: '#1976d2' }}>
          Admin Management Security Notes:
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#1976d2', fontSize: '14px' }}>
          <li>Only existing admins can promote or demote users</li>
          <li>You cannot demote yourself from admin</li>
          <li>The system ensures at least one admin always exists</li>
          <li>All admin actions are logged for security</li>
        </ul>
      </div>
    </div>
  );
};

export default UserSearch;