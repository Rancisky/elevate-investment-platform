import React from 'react';

const MemberWallet = ({ walletData, apiCall, loadDashboardData }) => {

  const handleWithdrawal = async (amount) => {
    if (amount < 25) {
      alert('Minimum withdrawal amount is $25');
      return;
    }
    
    if (amount > walletData.availableWithdrawal) {
      alert('Insufficient funds for withdrawal');
      return;
    }

    try {
      const response = await apiCall('/users/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount })
      });

      if (response && response.success) {
        alert(`Withdrawal of $${amount.toLocaleString()} initiated. Funds will be transferred to your account within 24 hours.`);
        loadDashboardData();
      } else {
        throw new Error(response?.message || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Withdrawal failed: ' + error.message);
    }
  };

  if (!walletData) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <p style={{ color: '#666' }}>Loading wallet data...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '30px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#333' }}>Earnings Breakdown</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#666' }}>Level 1 Referrals (10%)</span>
            <span style={{ color: '#1976d2', fontWeight: '600' }}>
              ${(walletData.level1Earnings || 0).toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#666' }}>Level 2 Referrals (5%)</span>
            <span style={{ color: '#388e3c', fontWeight: '600' }}>
              ${(walletData.level2Earnings || 0).toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#666' }}>Level 3 Referrals (2%)</span>
            <span style={{ color: '#f57c00', fontWeight: '600' }}>
              ${(walletData.level3Earnings || 0).toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#666' }}>Investment Profits</span>
            <span style={{ color: '#007bff', fontWeight: '600' }}>
              ${(walletData.investmentProfits || walletData.donationProfits || 0).toLocaleString()}
            </span>
          </div>
          <div style={{ 
            borderTop: '2px solid #eee', 
            paddingTop: '10px', 
            display: 'flex', 
            justifyContent: 'space-between',
            marginTop: '15px'
          }}>
            <span style={{ fontWeight: '600', fontSize: '16px' }}>Available for Withdrawal</span>
            <span style={{ color: '#fd7e14', fontWeight: '700', fontSize: '20px' }}>
              ${(walletData.availableWithdrawal || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#fff3cd', 
          color: '#856404', 
          padding: '10px', 
          borderRadius: '8px', 
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          Minimum withdrawal: $25
        </div>

        <button
          onClick={() => {
            const amount = prompt('Enter withdrawal amount (minimum $25):');
            if (amount && !isNaN(amount)) {
              handleWithdrawal(parseInt(amount));
            }
          }}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Withdraw Funds
        </button>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#333' }}>Withdrawal History</h3>
        
        <div style={{ fontSize: '14px' }}>
          {walletData.withdrawalHistory && walletData.withdrawalHistory.length > 0 ? (
            walletData.withdrawalHistory.slice(0, 5).map((withdrawal, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                <div>
                  <p style={{ margin: '0 0 2px 0' }}>
                    {new Date(withdrawal.date || withdrawal.createdAt).toLocaleDateString()}
                  </p>
                  <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
                    {withdrawal.method || 'Bank Transfer'}
                  </p>
                </div>
                <span style={{ color: '#28a745', fontWeight: '600' }}>
                  ${withdrawal.amount.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: '#666' }}>No withdrawals yet</p>
            </div>
          )}
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Total Withdrawn: ${(walletData.totalWithdrawn || 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemberWallet;