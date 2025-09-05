import React, { useState, useEffect } from 'react';
import SupportTicket from '../member/SupportTicket';
import NotificationCenter from '../member/NotificationCenter';
import MemberOverview from '../member/MemberOverview';
import MemberInvestments from '../member/MemberInvestments';
import MemberReferrals from '../member/MemberReferrals';
import MemberWallet from '../member/MemberWallet';
import MemberProfile from '../member/MemberProfile';
import CampaignList from '../admin/Campaigns/CampaignList';

const MemberDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showDonationInterface, setShowDonationInterface] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State for all data from backend
  const [memberData, setMemberData] = useState(null);
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const [walletData, setWalletData] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [recentReferrals, setRecentReferrals] = useState([]);

  const API_BASE = 'http://localhost:5000/api';

  // API call helper with fixed authentication
  const apiCall = async (endpoint, options = {}) => {
    console.log(`Making API call to: ${API_BASE}${endpoint}`);

    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found - logging out');
      onLogout();
      return null;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        },
        ...options
      };

      const response = await fetch(`${API_BASE}${endpoint}`, config);
      console.log(`Response status for ${endpoint}:`, response.status);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log('Authentication failed - logging out');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userRole');
          // onLogout();  // Temporarily disabled for debugging
          return null;
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Response data for ${endpoint}:`, data);
      return data;

    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      
      // Don't set error state for authentication failures
      if (!error.message.includes('401') && !error.message.includes('403')) {
        setError('Failed to connect to server. Please try again.');
      }
      
      return null;
    }
  };

  // Load all dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    console.log('Loading dashboard data...');

    try {
      // Try multiple campaign endpoints to find working one
      console.log('Fetching campaigns...');
      
      let campaignsResponse = null;
      
      // Try the public endpoint first
      try {
        console.log('Trying /campaigns/public...');
        campaignsResponse = await apiCall('/campaigns/public');
      } catch (error) {
        console.log('/campaigns/public failed:', error.message);
      }
      
      // If public endpoint failed, try regular campaigns endpoint
      if (!campaignsResponse) {
        try {
          console.log('Trying /campaigns...');
          campaignsResponse = await apiCall('/campaigns');
        } catch (error) {
          console.log('/campaigns failed:', error.message);
        }
      }

      // Load other data in parallel
      const [
        userResponse,
        walletResponse,
        referralStatsResponse,
        investmentsResponse,
        transactionsResponse,
        referralsResponse
      ] = await Promise.all([
        apiCall('/auth/me'),
        apiCall('/users/wallet'),
        apiCall('/referrals/stats'),
        apiCall('/investments'),
        apiCall('/users/transactions'),
        apiCall('/referrals/recent')
      ]);

      // Process user data
      if (userResponse) {
        console.log('User data loaded:', userResponse);
        setMemberData({
          name: userResponse.fullName || userResponse.name || 'Unknown User',
          userId: userResponse.userId || userResponse.id || 'N/A',
          memberSince: userResponse.createdAt,
          totalContributions: userResponse.totalContributions || 0,
          availableLoan: userResponse.availableLoan || 0,
          nextContribution: userResponse.nextContribution || null
        });
      }

      // Process campaigns data with enhanced debugging
      if (campaignsResponse) {
        console.log('Raw campaigns response:', campaignsResponse);
        
        let campaigns = [];
        
        // Handle different response formats
        if (campaignsResponse.campaigns) {
          campaigns = campaignsResponse.campaigns;
        } else if (Array.isArray(campaignsResponse)) {
          campaigns = campaignsResponse;
        } else if (campaignsResponse.data) {
          campaigns = campaignsResponse.data;
        }
        
        console.log('Processed campaigns array:', campaigns);
        console.log('Number of campaigns:', campaigns.length);
        
        if (campaigns.length > 0) {
          console.log('Sample campaign:', campaigns[0]);
          console.log('Campaign statuses:', campaigns.map(c => `${c.title || 'Untitled'}: ${c.status || 'No status'}`));
        } else {
          console.log('No campaigns found in response');
        }
        
        setAvailableCampaigns(campaigns || []);
      } else {
        console.log('No campaigns response received');
        setAvailableCampaigns([]);
      }

      // Process other data
      if (walletResponse) {
        setWalletData(walletResponse);
      }

      if (referralStatsResponse) {
        setReferralStats({
          ...referralStatsResponse,
          referralCode: userResponse?.userId || 'N/A',
          referralLink: `https://elevate-network.com/register?ref=${userResponse?.userId || ''}`
        });
      }

      if (investmentsResponse) {
        setInvestments(investmentsResponse.investments || []);
      }

      if (transactionsResponse) {
        setTransactions(transactionsResponse.transactions || []);
      }

      if (referralsResponse) {
        setRecentReferrals(referralsResponse.referrals || []);
      }

      console.log('Dashboard data loaded successfully');

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle investment creation
  const handleCampaignInvest = async (campaignId, amount) => {
    console.log(`Attempting investment: Campaign ${campaignId}, Amount: $${amount}`);
    
    try {
      const response = await apiCall('/investments', {
        method: 'POST',
        body: JSON.stringify({ campaignId, amount })
      });

      if (response && response.success) {
        alert(`Investment successful! You will receive $${response.investment.expectedReturn.toLocaleString()} at maturity.`);
        setShowDonationInterface(false);
        loadDashboardData();
      } else {
        throw new Error(response?.message || 'Investment failed');
      }
    } catch (error) {
      console.error('Investment failed:', error);
      alert('Investment failed: ' + error.message);
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Dashboard', icon: '🏠', color: '#3B82F6' },
    { id: 'profile', label: 'Profile & KYC', icon: '👤', color: '#10B981' },
    { id: 'invest', label: 'Investments', icon: '💎', color: '#10B981' },
    { id: 'wallet', label: 'My Wallet', icon: '💳', color: '#F59E0B' },
    { id: 'referrals', label: 'Referrals', icon: '👥', color: '#8B5CF6' },
    { id: 'loans', label: 'Loans', icon: '🏦', color: '#EF4444' },
    { id: 'investments', label: 'My Portfolio', icon: '📊', color: '#06B6D4' },
    { id: 'support', label: 'Support', icon: '🎧', color: '#84CC16' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', color: '#F97316' }
  ];

  // Debug: Log campaigns whenever they change
  useEffect(() => {
    console.log('Available campaigns updated:', availableCampaigns);
    console.log('Number of available campaigns:', availableCampaigns.length);
    
    if (availableCampaigns.length > 0) {
      const activeCampaigns = availableCampaigns.filter(c => 
        c.status && c.status.toLowerCase() === 'active'
      );
      console.log('Active campaigns:', activeCampaigns.length);
      console.log('Active campaigns list:', activeCampaigns);
    }
  }, [availableCampaigns]);

  // Mobile Stats Card
  const MobileStatsCard = ({ title, value, change, icon, color }) => (
    <div style={{
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      borderRadius: '20px',
      padding: '20px',
      border: `2px solid ${color}20`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: `${color}10`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px'
      }}>
        {icon}
      </div>
      
      <div style={{ position: 'relative', zIndex: 2 }}>
        <p style={{
          fontSize: '14px',
          color: '#64748B',
          fontWeight: '600',
          margin: '0 0 8px 0',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {title}
        </p>
        <h3 style={{
          fontSize: '28px',
          fontWeight: '800',
          color: '#1E293B',
          margin: '0 0 6px 0',
          lineHeight: '1'
        }}>
          {title.includes('Balance') && !balanceVisible ? '••••••' : value}
        </h3>
        <p style={{
          fontSize: '12px',
          color: color,
          fontWeight: '600',
          margin: 0
        }}>
          {change}
        </p>
      </div>
    </div>
  );

  // Sidebar Navigation Item
  const SidebarItem = ({ item, isActive, onClick }) => (
    <button
      onClick={() => {
        onClick(item.id);
        setSidebarOpen(false);
      }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 20px',
        backgroundColor: isActive ? `${item.color}15` : 'transparent',
        border: isActive ? `2px solid ${item.color}30` : '2px solid transparent',
        borderRadius: '16px',
        color: isActive ? item.color : '#64748B',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        marginBottom: '8px',
        textAlign: 'left'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.target.style.backgroundColor = '#F8FAFC';
          e.target.style.transform = 'translateX(4px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.transform = 'translateX(0)';
        }
      }}
    >
      <span style={{ 
        fontSize: '20px',
        minWidth: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {item.icon}
      </span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {isActive && (
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: item.color
        }} />
      )}
    </button>
  );

  // Loading screen
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #E5E7EB',
            borderTop: '4px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }} />
          <h3 style={{ color: '#1E293B', fontSize: '20px', margin: '0 0 8px 0' }}>Loading Your Dashboard</h3>
          <p style={{ color: '#64748B', margin: 0 }}>Setting up your personalized experience...</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚠️</div>
          <h2 style={{ color: '#DC2626', marginBottom: '16px', fontSize: '24px' }}>Connection Error</h2>
          <p style={{ color: '#64748B', marginBottom: '32px', lineHeight: '1.5' }}>{error}</p>
          <button
            onClick={loadDashboardData}
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '16px',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If showing investment interface
  if (showDonationInterface) {
    console.log('Showing investment interface with campaigns:', availableCampaigns);
    
    // Filter active campaigns for investment interface
    const activeCampaigns = availableCampaigns.filter(c => {
      const isActive = c.status && c.status.toLowerCase() === 'active';
      console.log(`Campaign "${c.title || 'Untitled'}" status: ${c.status}, isActive: ${isActive}`);
      return isActive;
    });
    
    console.log('Active campaigns for investment:', activeCampaigns);
    
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
          color: 'white',
          padding: '24px'
        }}>
          <button
            onClick={() => setShowDonationInterface(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              marginBottom: '16px'
            }}
          >
            ← Back to Dashboard
          </button>
          <h1 style={{ 
            margin: 0, 
            fontSize: '32px',
            fontWeight: '800' 
          }}>
            Investment Opportunities
          </h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
            Choose from our curated investment campaigns ({activeCampaigns.length} available)
          </p>
        </div>
        
        <div style={{ padding: '24px' }}>
          {activeCampaigns.length > 0 ? (
            <CampaignList
              campaigns={activeCampaigns}
              viewMode="member"
              onInvest={handleCampaignInvest}
              showInvestButton={true}
            />
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>📈</div>
              <h3 style={{ color: '#64748B', marginBottom: '16px' }}>No Active Campaigns</h3>
              <p style={{ color: '#94A3B8', marginBottom: '24px' }}>
                There are currently no investment campaigns available.
              </p>
              <p style={{ color: '#94A3B8', fontSize: '14px' }}>
                Total campaigns loaded: {availableCampaigns.length}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!memberData) {
    return null;
  }

  const stats = [
    {
      title: "Total Balance",
      value: `$${(walletData?.balance || 0).toLocaleString()}`,
      change: "+0% this month",
      icon: "💰",
      color: "#10B981"
    },
    {
      title: "Active Investments",
      value: investments.length.toString(),
      change: `${investments.length} campaigns`,
      icon: "📈",
      color: "#3B82F6"
    },
    {
      title: "Total Referrals",
      value: (referralStats?.totalReferrals || 0).toString(),
      change: `$${(referralStats?.totalEarnings || 0).toLocaleString()} earned`,
      icon: "👥",
      color: "#8B5CF6"
    },
    {
      title: "Available Funds",
      value: `$${(walletData?.availableBalance || 0).toLocaleString()}`,
      change: "Ready to withdraw",
      icon: "💳",
      color: "#F59E0B"
    }
  ];

  const sharedProps = {
    memberData,
    apiCall,
    loadDashboardData,
    setActiveTab
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
      display: 'flex'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600;700;800&display=swap');
      `}</style>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: window.innerWidth <= 768 ? 'block' : 'none'
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: window.innerWidth <= 768 ? (sidebarOpen ? '280px' : '0px') : '280px',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)',
        borderRight: '1px solid #E5E7EB',
        position: window.innerWidth <= 768 ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        zIndex: 1000,
        transform: window.innerWidth <= 768 ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowY: 'auto',
        boxShadow: window.innerWidth <= 768 ? '4px 0 20px rgba(0,0,0,0.1)' : 'none'
      }}>
        {/* Logo Section */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid #F1F5F9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '800',
              fontSize: '20px'
            }}>
              E
            </div>
            <div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '800',
                color: '#1E293B',
                margin: 0,
                lineHeight: '1.2'
              }}>
                Elevate Network
              </h2>
              <p style={{
                fontSize: '12px',
                color: '#64748B',
                margin: 0,
                fontWeight: '600'
              }}>
                Investment Platform
              </p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #F1F5F9'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #3B82F620 0%, #8B5CF620 100%)',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid #3B82F630'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '700',
                fontSize: '16px'
              }}>
                {memberData.name.charAt(0)}
              </div>
              <div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#1E293B',
                  margin: 0,
                  lineHeight: '1.2'
                }}>
                  {memberData.name.split(' ')[0]}
                </p>
                <p style={{
                  fontSize: '12px',
                  color: '#64748B',
                  margin: 0,
                  lineHeight: '1.2'
                }}>
                  ID: {memberData.userId}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ padding: '20px' }}>
          <p style={{
            fontSize: '12px',
            color: '#94A3B8',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '16px'
          }}>
            NAVIGATION
          </p>
          {sidebarItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              onClick={setActiveTab}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        minHeight: '100vh',
        marginLeft: window.innerWidth <= 768 ? '0px' : '0px'
      }}>
        {/* Mobile Header */}
        <div style={{
          background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '10px',
                padding: '10px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px',
                display: window.innerWidth <= 768 ? 'block' : 'none'
              }}
            >
              ☰
            </button>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '800',
                margin: 0,
                lineHeight: '1.2'
              }}>
                {sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
              <p style={{
                fontSize: '14px',
                opacity: 0.9,
                margin: 0,
                fontWeight: '500'
              }}>
                Welcome back, {memberData.name.split(' ')[0]}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '10px',
              padding: '10px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              position: 'relative'
                          }}>
              🔔
              <span style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '8px',
                height: '8px',
                backgroundColor: '#EF4444',
                borderRadius: '50%'
              }} />
            </button>
            <button
              onClick={loadDashboardData}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '10px',
                padding: '10px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🔄
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: '24px' }}>
          {/* Stats Grid - Only show on overview */}
          {activeTab === 'overview' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              {stats.map((stat, index) => (
                <MobileStatsCard key={index} {...stat} />
              ))}
            </div>
          )}

          {/* Tab Content */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '32px 24px',
            minHeight: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #F1F5F9'
          }}>
            {activeTab === 'overview' && (
              <MemberOverview
                {...sharedProps}
                referralStats={referralStats}
                investments={investments}
                walletData={walletData}
                transactions={transactions}
              />
            )}

            {activeTab === 'profile' && (
              <MemberProfile
                memberData={memberData}
                apiCall={apiCall}
                loadDashboardData={loadDashboardData}
              />
            )}

            {activeTab === 'invest' && (
              <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  borderRadius: '24px',
                  padding: '40px 24px',
                  color: 'white',
                  marginBottom: '32px'
                }}>
                  <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 16px 0' }}>
                    Start Investing Today
                  </h2>
                  <p style={{ fontSize: '16px', margin: '0 0 24px 0', opacity: 0.9 }}>
                    Join thousands of investors growing their wealth
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '20px',
                    marginBottom: '24px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0' }}>
                        {availableCampaigns.filter(c => c.status && c.status.toLowerCase() === 'active').length}
                      </h4>
                      <p style={{ fontSize: '12px', margin: 0, opacity: 0.9 }}>Live Campaigns</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0' }}>120%</h4>
                      <p style={{ fontSize: '12px', margin: 0, opacity: 0.9 }}>Max ROI</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0' }}>$10</h4>
                      <p style={{ fontSize: '12px', margin: 0, opacity: 0.9 }}>Min Amount</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowDonationInterface(true)}
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '18px 40px',
                    borderRadius: '16px',
                    fontSize: '18px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                    transform: 'translateY(0)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 35px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  Browse Investment Campaigns
                </button>
              </div>
            )}

            {activeTab === 'wallet' && (
              <MemberWallet
                {...sharedProps}
                walletData={walletData}
              />
            )}

            {activeTab === 'referrals' && (
              <MemberReferrals
                {...sharedProps}
                referralStats={referralStats}
                recentReferrals={recentReferrals}
              />
            )}

            {activeTab === 'loans' && (
              <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  borderRadius: '24px',
                  padding: '40px 24px',
                  color: 'white',
                  marginBottom: '32px'
                }}>
                  <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 16px 0' }}>
                    Quick Loans
                  </h2>
                  <p style={{ fontSize: '16px', margin: '0 0 24px 0', opacity: 0.9 }}>
                    Get instant access to funds with flexible terms
                  </p>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '20px',
                    marginBottom: '24px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0' }}>
                        50+
                      </h4>
                      <p style={{ fontSize: '12px', margin: 0, opacity: 0.9 }}>Refs Required</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0' }}>5%</h4>
                      <p style={{ fontSize: '12px', margin: 0, opacity: 0.9 }}>Interest</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0' }}>24h</h4>
                      <p style={{ fontSize: '12px', margin: 0, opacity: 0.9 }}>Approval</p>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '16px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
                  }}>
                    Apply for Loan
                  </button>
                  <button style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '16px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                  }}>
                    Loan History
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'investments' && (
              <MemberInvestments
                {...sharedProps}
                investments={investments}
              />
            )}

            {activeTab === 'support' && <SupportTicket />}

            {activeTab === 'notifications' && <NotificationCenter />}

            {activeTab === 'contributions' && (
              <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  borderRadius: '24px',
                  padding: '40px 24px',
                  color: 'white',
                  marginBottom: '32px'
                }}>
                  <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 16px 0' }}>
                    Contributions
                  </h2>
                  <p style={{ fontSize: '16px', margin: '0 0 24px 0', opacity: 0.9 }}>
                    Track and manage your platform contributions
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '16px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                  }}>
                    Make Contribution
                  </button>
                  <button style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '16px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
                  }}>
                    View History
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;