import React, { useState } from 'react';
import Dashboard from './Dashboard/Dashboard';
import UserManagement from './UserManagement/UserManagement';
import CampaignList from './Campaigns/CampaignList';
import MemberList from '../member/MemberList';
import LoanManagement from './Loans/LoanManagement';
import TabButton from './shared/TabButton';

const AdminPanel = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '20px 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{
              color: '#1a202c',
              fontSize: '28px',
              fontWeight: 'bold',
              margin: '0 0 5px 0'
            }}>
              Admin Control Panel
            </h1>
            <p style={{ color: '#666', margin: 0, fontSize: '16px' }}>
              Manage campaigns, members, and system settings
            </p>
          </div>
          <button
            onClick={onLogout}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '30px 20px'
      }}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          marginBottom: '30px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <TabButton
            tab="dashboard"
            label="📊 Dashboard"
            isActive={activeTab === 'dashboard'}
            onClick={setActiveTab}
          />
          <TabButton
            tab="campaigns"
            label="🎯 Campaigns"
            isActive={activeTab === 'campaigns'}
            onClick={setActiveTab}
          />
          <TabButton
            tab="members"
            label="👥 Members"
            isActive={activeTab === 'members'}
            onClick={setActiveTab}
          />
          <TabButton
            tab="user-management"
            label="🔑 Admin Management"
            isActive={activeTab === 'user-management'}
            onClick={setActiveTab}
          />
          <TabButton
            tab="loans"
            label="🏦 Loans"
            isActive={activeTab === 'loans'}
            onClick={setActiveTab}
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'user-management' && <UserManagement />}
        {activeTab === 'campaigns' && <CampaignList />}
        {activeTab === 'members' && <MemberList />}
        {activeTab === 'loans' && <LoanManagement />}
      </div>
    </div>
  );
};

export default AdminPanel;