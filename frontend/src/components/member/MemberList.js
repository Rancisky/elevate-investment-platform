import React, { useState, useEffect } from 'react';

const MemberList = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sample member data - replace with API call in production
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMembers([
        {
          id: 1,
          userId: 'ELV00001',
          fullName: 'John Smith',
          email: 'john@email.com',
          phone: '+1234567890',
          status: 'Active',
          totalInvestments: 2500,
          referralCount: 12,
          joinedDate: '2024-11-15',
          lastActive: '2025-01-02',
          walletBalance: 450
        },
        {
          id: 2,
          userId: 'ELV00002',
          fullName: 'Sarah Johnson',
          email: 'sarah@email.com',
          phone: '+1234567891',
          status: 'Active',
          totalInvestments: 5000,
          referralCount: 8,
          joinedDate: '2024-10-22',
          lastActive: '2025-01-01',
          walletBalance: 1200
        },
        {
          id: 3,
          userId: 'ELV00003',
          fullName: 'Mike Wilson',
          email: 'mike@email.com',
          phone: '+1234567892',
          status: 'Inactive',
          totalInvestments: 1000,
          referralCount: 3,
          joinedDate: '2024-12-01',
          lastActive: '2024-12-20',
          walletBalance: 75
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || member.status.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (memberId, newStatus) => {
    setMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, status: newStatus }
        : member
    ));
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: '#666' }}>Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#333' }}>Member Management</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Total Members: {members.length} | Active: {members.filter(m => m.status === 'Active').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500',
              color: '#333'
            }}>
              Search Members
            </label>
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e1e5e9',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: '500',
              color: '#333'
            }}>
              Status Filter
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e1e5e9',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Member</th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Contact</th>
                <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Investments</th>
                <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Referrals</th>
                <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Wallet</th>
                <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, index) => (
                <tr key={member.id} style={{
                  borderBottom: '1px solid #e9ecef',
                  backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                }}>
                  <td style={{ padding: '15px' }}>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                        {member.fullName}
                      </div>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        ID: {member.userId}
                      </div>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        Joined: {new Date(member.joinedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  
                  <td style={{ padding: '15px' }}>
                    <div>
                      <div style={{ marginBottom: '2px' }}>{member.email}</div>
                      <div style={{ color: '#666', fontSize: '12px' }}>{member.phone}</div>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        Last active: {new Date(member.lastActive).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontWeight: '600', color: '#28a745' }}>
                      ${member.totalInvestments.toLocaleString()}
                    </div>
                  </td>
                  
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontWeight: '600', color: '#007bff' }}>
                      {member.referralCount}
                    </div>
                  </td>
                  
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontWeight: '600', color: '#fd7e14' }}>
                      ${member.walletBalance.toLocaleString()}
                    </div>
                  </td>
                  
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: member.status === 'Active' ? '#d4edda' : '#f8d7da',
                      color: member.status === 'Active' ? '#155724' : '#721c24'
                    }}>
                      {member.status}
                    </span>
                  </td>
                  
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <select
                      value={member.status}
                      onChange={(e) => handleStatusChange(member.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>👥</div>
            <h3 style={{ margin: '0 0 10px 0' }}>No Members Found</h3>
            <p style={{ margin: 0 }}>
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No members have joined yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginTop: '30px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            ${members.reduce((sum, m) => sum + m.totalInvestments, 0).toLocaleString()}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>Total Investments</div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
            {members.reduce((sum, m) => sum + m.referralCount, 0)}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>Total Referrals</div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fd7e14' }}>
            ${members.reduce((sum, m) => sum + m.walletBalance, 0).toLocaleString()}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>Total Wallet Balance</div>
        </div>
      </div>
    </div>
  );
};

export default MemberList;