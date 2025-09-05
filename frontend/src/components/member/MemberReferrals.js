import React from 'react';

const MemberReferrals = ({ referralStats, recentReferrals }) => {
  
  const copyReferralLink = () => {
    if (!referralStats) return;
    
    navigator.clipboard.writeText(referralStats.referralLink).then(() => {
      alert('Referral link copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy link. Please copy manually: ' + referralStats.referralLink);
    });
  };

  if (!referralStats) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <p style={{ color: '#666' }}>Loading referral data...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '30px' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#333' }}>Share Your Referral Link</h3>
        
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '15px',
          border: '1px solid #dee2e6'
        }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Your Referral Code:</p>
          <p style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
            {referralStats.referralCode}
          </p>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>Your Referral Link:</p>
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            color: '#007bff', 
            wordBreak: 'break-all',
            fontFamily: 'monospace'
          }}>
            {referralStats.referralLink}
          </p>
        </div>
        
        <button
          onClick={copyReferralLink}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Copy Link
        </button>
        
        <button
          onClick={() => {
            const message = `Join Elevate Network with my referral code: ${referralStats.referralCode} or use this link: ${referralStats.referralLink}`;
            if (navigator.share) {
              navigator.share({ text: message });
            } else {
              alert('Share this message:\n\n' + message);
            }
          }}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Share
        </button>
      </div>

      {/* Commission Structure */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#333' }}>Commission Structure</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Level 1 (Direct)</h4>
            <p style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>10%</p>
            <p style={{ margin: '0 0 5px 0', color: '#666' }}>$12 per referral</p>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{referralStats.level1Count || 0} Referrals</p>
          </div>
          
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#388e3c' }}>Level 2</h4>
            <p style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>5%</p>
            <p style={{ margin: '0 0 5px 0', color: '#666' }}>$6 per referral</p>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{referralStats.level2Count || 0} Referrals</p>
          </div>
          
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff3e0', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>Level 3</h4>
            <p style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>2%</p>
            <p style={{ margin: '0 0 5px 0', color: '#666' }}>$2.40 per referral</p>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{referralStats.level3Count || 0} Referrals</p>
          </div>
        </div>
      </div>

      {/* Recent Referral Activity */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#333' }}>Recent Referral Activity</h3>
        
        {recentReferrals && recentReferrals.length > 0 ? (
          recentReferrals.map((referral, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px 0',
              borderBottom: index < recentReferrals.length - 1 ? '1px solid #f0f0f0' : 'none'
            }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontWeight: '600' }}>{referral.name || referral.fullName}</p>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  Level {referral.level} • {new Date(referral.createdAt || referral.date).toLocaleDateString()}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 5px 0', color: '#28a745', fontWeight: '600' }}>
                  +${(referral.commission || 0).toLocaleString()}
                </p>
                <span style={{
                  backgroundColor: (referral.status === 'Paid' || referral.status === 'paid') ? '#d4edda' : '#fff3cd',
                  color: (referral.status === 'Paid' || referral.status === 'paid') ? '#155724' : '#856404',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  {referral.status || 'Pending'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#666' }}>No referrals yet. Share your link to start earning!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberReferrals;