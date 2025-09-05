import React from 'react';

const MemberInvestments = ({ investments, apiCall, loadDashboardData, setActiveTab }) => {

  const handleEarlyWithdrawal = async (investmentId) => {
    const investment = investments.find(i => i._id === investmentId);
    if (!investment || !investment.canWithdrawEarly) return;

    const penalty = investment.currentProfit * 0.3;
    const withdrawableProfit = investment.currentProfit - penalty;
    const totalWithdrawal = investment.amount + withdrawableProfit;

    if (window.confirm(
      `Early withdrawal will incur a 30% penalty on profits.\n\n` +
      `Original Investment: ₦${investment.amount.toLocaleString()}\n` +
      `Current Profit: ₦${investment.currentProfit.toLocaleString()}\n` +
      `Penalty (30%): ₦${penalty.toLocaleString()}\n` +
      `You will receive: ₦${totalWithdrawal.toLocaleString()}\n\n` +
      `Continue with early withdrawal?`
    )) {
      try {
        const response = await apiCall(`/investments/${investmentId}/withdraw-early`, {
          method: 'POST'
        });

        if (response && response.success) {
          alert(`Early withdrawal processed! ₦${response.withdrawalAmount.toLocaleString()} will be transferred to your wallet.`);
          loadDashboardData();
        } else {
          throw new Error(response?.message || 'Withdrawal failed');
        }
      } catch (error) {
        console.error('Early withdrawal failed:', error);
        alert('Withdrawal failed: ' + error.message);
      }
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    }}>
      <h2 style={{ marginBottom: '30px', color: '#333' }}>My Investments</h2>
      
      {investments && investments.length > 0 ? (
        investments.map((investment) => (
          <div key={investment._id} style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <h3 style={{ color: '#333', margin: 0 }}>
                {investment.campaign?.title || investment.campaignTitle || 'Investment'}
              </h3>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                backgroundColor: investment.status === 'matured' ? '#d4edda' : '#fff3cd',
                color: investment.status === 'matured' ? '#155724' : '#856404'
              }}>
                {investment.status}
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <div>
                <p style={{ color: '#666', margin: '0 0 5px 0', fontSize: '14px' }}>Amount Invested</p>
                <p style={{ color: '#333', margin: 0, fontWeight: '600' }}>₦{investment.amount.toLocaleString()}</p>
              </div>
              <div>
                <p style={{ color: '#666', margin: '0 0 5px 0', fontSize: '14px' }}>Expected Return</p>
                <p style={{ color: '#28a745', margin: 0, fontWeight: '600' }}>₦{investment.expectedReturn.toLocaleString()}</p>
              </div>
              <div>
                <p style={{ color: '#666', margin: '0 0 5px 0', fontSize: '14px' }}>Current Profit</p>
                <p style={{ color: '#007bff', margin: 0, fontWeight: '600' }}>₦{(investment.currentProfit || 0).toLocaleString()}</p>
              </div>
              <div>
                <p style={{ color: '#666', margin: '0 0 5px 0', fontSize: '14px' }}>Maturity Date</p>
                <p style={{ color: '#333', margin: 0, fontWeight: '600' }}>
                  {new Date(investment.maturityDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Progress</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{investment.progress || 0}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '10px', height: '8px' }}>
                <div style={{
                  width: `${investment.progress || 0}%`,
                  backgroundColor: investment.status === 'matured' ? '#28a745' : '#007bff',
                  height: '8px',
                  borderRadius: '10px'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {investment.status === 'matured' && (
                <button
                  onClick={async () => {
                    try {
                      const response = await apiCall(`/investments/${investment._id}/claim-profit`, {
                        method: 'POST'
                      });
                      
                      if (response && response.success) {
                        alert(`Profit of ₦${response.profit.toLocaleString()} has been added to your wallet!`);
                        loadDashboardData();
                      }
                    } catch (error) {
                      alert('Failed to claim profit. Please try again.');
                    }
                  }}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Claim Profit (₦{(investment.expectedReturn - investment.amount).toLocaleString()})
                </button>
              )}
              
              {investment.canWithdrawEarly && investment.status === 'active' && (
                <button
                  onClick={() => handleEarlyWithdrawal(investment._id)}
                  style={{
                    backgroundColor: '#fd7e14',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Early Withdrawal (30% penalty)
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>💎</div>
          <h3 style={{ color: '#666', marginBottom: '15px' }}>No Investments Yet</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Start investing in campaigns to grow your wealth
          </p>
          <button
            onClick={() => setActiveTab('invest')}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Browse Campaigns
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberInvestments;