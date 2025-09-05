import React from 'react';
import StatCard from './StatCard';

const Dashboard = () => {
  // Sample data - in production, this would come from props or API
  const stats = {
    totalMembers: 1247,
    activeCampaigns: 2,
    totalCampaignFunds: 10700000,
    loanEligibleMembers: 3
  };

  const campaigns = [
    {
      id: 1,
      title: 'Poultry Farm Investment',
      targetAmount: 5000000,
      raisedAmount: 3200000,
      expectedROI: 100,
      durationMonths: 3,
      participants: 64
    },
    {
      id: 2,
      title: 'Real Estate Development',
      targetAmount: 10000000,
      raisedAmount: 7500000,
      expectedROI: 80,
      durationMonths: 6,
      participants: 89
    },
    {
      id: 3,
      title: 'Fish Farm Project',
      targetAmount: 3000000,
      raisedAmount: 3000000,
      expectedROI: 120,
      durationMonths: 4,
      participants: 45
    }
  ];

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          color="#28a745"
          icon="👥"
        />
        <StatCard
          title="Active Campaigns"
          value={stats.activeCampaigns}
          color="#007bff"
          icon="🎯"
        />
        <StatCard
          title="Campaign Funds"
          value={stats.totalCampaignFunds}
          color="#fd7e14"
          icon="💰"
        />
        <StatCard
          title="Loan Eligible"
          value={stats.loanEligibleMembers}
          color="#6f42c1"
          icon="🏦"
        />
      </div>

      {/* Recent Campaign Performance */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{
          color: '#1a202c',
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}>
          Campaign Performance
        </h2>
        {campaigns.slice(0, 3).map((campaign) => (
          <div key={campaign.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 0',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <div>
              <p style={{ margin: '0 0 5px 0', fontWeight: '600' }}>
                {campaign.title}
              </p>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                {campaign.expectedROI}% ROI • {campaign.durationMonths} months • {campaign.participants} participants
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: '600' }}>
                ₦{campaign.raisedAmount.toLocaleString()} / ₦{campaign.targetAmount.toLocaleString()}
              </p>
              <div style={{ 
                width: '100px', 
                backgroundColor: '#e2e8f0', 
                borderRadius: '10px', 
                height: '6px' 
              }}>
                <div style={{
                  width: `${Math.min((campaign.raisedAmount / campaign.targetAmount) * 100, 100)}%`,
                  backgroundColor: '#007bff',
                  height: '6px',
                  borderRadius: '10px'
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;