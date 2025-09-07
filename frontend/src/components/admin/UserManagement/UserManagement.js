import React, { useState, useEffect } from 'react';
import StatCard from '../shared/StatCard';
import AdminList from './AdminList';
import UserSearch from './UserSearch';
import UserActionModal from './UserActionModal';
import { API_URL, apiRequest } from '../../../api/api';

const UserManagement = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userAction, setUserAction] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      
      const data = await apiRequest('/auth/users');
      
      if (data) {
        setAllUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch admin users
  const fetchAdminUsers = async () => {
    try {
      const data = await apiRequest('/auth/admin/list');
      
      if (data) {
        setAdminUsers(data.admins || []);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  // Promote user to admin
  const promoteToAdmin = async (user) => {
    try {
      setLoading(true);
      
      const data = await apiRequest('/auth/promote-to-admin', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.userId,
          username: user.username,
          email: user.email
        })
      });
      
      if (data && data.success) {
        alert(`${user.name} has been promoted to admin successfully!`);
        fetchAllUsers();
        fetchAdminUsers();
        setShowModal(false);
        setSelectedUser(null);
        setUserAction('');
      } else {
        alert(`Error: ${data?.message || 'Promotion failed'}`);
      }
    } catch (error) {
      alert('Error promoting user. Please try again.');
      console.error('Error promoting user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Demote admin to member
  const demoteAdmin = async (user) => {
    try {
      setLoading(true);
      
      const data = await apiRequest('/auth/demote-admin', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.userId,
          username: user.username,
          email: user.email
        })
      });
      
      if (data && data.success) {
        alert(`${user.name} has been demoted to member successfully!`);
        fetchAllUsers();
        fetchAdminUsers();
        setShowModal(false);
        setSelectedUser(null);
        setUserAction('');
      } else {
        alert(`Error: ${data?.message || 'Demotion failed'}`);
      }
    } catch (error) {
      alert('Error demoting admin. Please try again.');
      console.error('Error demoting admin:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchAllUsers();
    fetchAdminUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = allUsers.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserAction = (user, action) => {
    setSelectedUser(user);
    setUserAction(action);
    setShowModal(true);
  };

  const handleConfirmAction = () => {
    if (userAction === 'promote') {
      promoteToAdmin(selectedUser);
    } else if (userAction === 'demote') {
      demoteAdmin(selectedUser);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setUserAction('');
  };

  const refreshData = () => {
    fetchAllUsers();
    fetchAdminUsers();
  };

  return (
    <div>
      <h2 style={{ marginBottom: '30px', color: '#333' }}>Admin User Management</h2>

      {/* Admin Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <StatCard
          title="Total Admins"
          value={adminUsers.length}
          color="#dc3545"
          icon="🔑"
        />
        <StatCard
          title="Regular Members"
          value={allUsers.filter(u => u.role === 'member').length}
          color="#28a745"
          icon="👤"
        />
        <StatCard
          title="Total Users"
          value={allUsers.length}
          color="#007bff"
          icon="👥"
        />
      </div>

      {/* Current Admins Section */}
      <AdminList 
        adminUsers={adminUsers}
        loading={loading}
        onDemoteAdmin={(admin) => handleUserAction(admin, 'demote')}
      />

      {/* User Search and Promotion Section */}
      <UserSearch
        filteredUsers={filteredUsers}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        loading={loading}
        onPromoteUser={(user) => handleUserAction(user, 'promote')}
        onDemoteUser={(user) => handleUserAction(user, 'demote')}
        onRefresh={refreshData}
      />

      {/* User Action Modal */}
      {showModal && (
        <UserActionModal
          selectedUser={selectedUser}
          userAction={userAction}
          loading={loading}
          onConfirm={handleConfirmAction}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default UserManagement;