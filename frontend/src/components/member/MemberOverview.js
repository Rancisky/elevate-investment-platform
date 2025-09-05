import React from 'react';

const StatCard = ({ title, value, color = '#007bff', prefix = '₦' }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #f0f0f0'
  }}>
    <h3 style={{ 
      color: '#666', 
      fontSize: '14px', 
      fontWeight: '500', 
      margin: '0 0 8px 0',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {title}
    </h3>
    <p style={{
      color: color,
      fontSize: '28px',
      fontWeight: 'bold',
      margin: 0
    }}>
      {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
    </p>
  </div>
);

const MemberOverview = ({ referralStats, investments, walletData, transactions }) => {
  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <StatCard
          title="Total Referrals"
          value={referralStats?.totalReferrals || 0}
          color="#007bff"
          prefix=""
        />
        <StatCard
          title="Active Investments"
          value={investments.filter(i => i.status === 'Active').length}
          color="#28a745"
          prefix=""
        />
        <StatCard
          title="Referral Earnings"
          value={referralStats?.totalEarned || 0}
          color="#28a745"
        />
        <StatCard
          title="Available Withdrawal"
          value={walletData?.availableWithdrawal || 0}
          color="#fd7e14"
        />
      </div>

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
          Recent Transactions
        </h2>
        <div style={{ overflowX: 'auto' }}>
          {transactions.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((transaction, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px' }}>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px' }}>{transaction.type}</td>
                    <td style={{
                      padding: '12px',
                      color: transaction.amount > 0 ? '#28a745' : '#dc3545',
                      fontWeight: '600'
                    }}>
                      {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        backgroundColor: transaction.status === 'completed' ? '#d4edda' : '#fff3cd',
                        color: transaction.status === 'completed' ? '#155724' : '#856404',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#666' }}>No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberOverview;