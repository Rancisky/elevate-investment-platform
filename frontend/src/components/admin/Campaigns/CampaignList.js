import React, { useState, useEffect } from 'react';
import InvestmentModal from '../shared/InvestmentModal';
import { API_URL, apiRequest } from '../../api/api';

const CampaignList = ({ 
  campaigns: propCampaigns = null,
  viewMode = "admin",
  onInvest = null,
  showInvestButton = false
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});
  
  // Investment Modal State
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [selectedInvestmentCampaign, setSelectedInvestmentCampaign] = useState(null);

  // Load campaigns with proper admin endpoint
  useEffect(() => {
    if (viewMode === "admin" && !propCampaigns) {
      loadCampaignsFromBackend();
    } else if (propCampaigns) {
      setCampaigns(propCampaigns);
      setLoading(false);
    }
  }, [viewMode, propCampaigns]);

  const loadCampaignsFromBackend = async () => {
    setLoading(true);
    try {
      console.log('Loading campaigns from backend...');
      
      let response;
      if (viewMode === "admin") {
        // Use admin endpoint for full campaign data including all statuses
        response = await apiRequest('/campaigns/admin');
      } else {
        // Members use public endpoint (only active campaigns)
        response = await apiRequest('/campaigns/public');
      }

      if (response) {
        console.log('Backend response:', response);
        
        let campaignsList = [];
        if (response.campaigns) {
          campaignsList = response.campaigns;
        } else if (Array.isArray(response)) {
          campaignsList = response;
        } else if (response.data) {
          campaignsList = response.data;
        }
        
        setCampaigns(campaignsList);
      } else {
        console.error('Failed to load campaigns');
        // Fallback to public endpoint if admin fails
        if (viewMode === "admin") {
          const fallbackResponse = await apiRequest('/campaigns/public');
          if (fallbackResponse) {
            setCampaigns(fallbackResponse.campaigns || fallbackResponse || []);
          } else {
            setCampaigns([]);
          }
        } else {
          setCampaigns([]);
        }
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  // Status management function
  const updateCampaignStatus = async (campaignId, newStatus) => {
    setActionLoading(prev => ({ ...prev, [campaignId]: true }));
    
    try {
      const response = await apiRequest(`/campaigns/${campaignId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      if (response && response.success) {
        // Update local state
        setCampaigns(prev => prev.map(campaign => 
          (campaign.id || campaign._id) === campaignId 
            ? { ...campaign, status: newStatus }
            : campaign
        ));
        
        alert(`Campaign status updated to ${newStatus}!`);
      } else {
        throw new Error(response?.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('Failed to update campaign status: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  // Check if campaign is expired
  const isExpired = (campaign) => {
    if (!campaign.endDate) return false;
    return new Date(campaign.endDate) < new Date();
  };

  // Get status badge styling
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return { bg: '#e8f5e8', color: '#28a745' };
      case 'paused': return { bg: '#fff3cd', color: '#856404' };
      case 'closed': return { bg: '#f8d7da', color: '#721c24' };
      case 'completed': return { bg: '#e3f2fd', color: '#1976d2' };
      default: return { bg: '#e9ecef', color: '#6c757d' };
    }
  };

  // Status Badge Component
  const StatusBadge = ({ status, isExpired = false }) => {
    const statusColor = getStatusColor(status);
    const displayText = isExpired && status?.toLowerCase() === 'active' ? 'EXPIRED' : status?.toUpperCase() || 'UNKNOWN';
    const finalColor = isExpired && status?.toLowerCase() === 'active' 
      ? { bg: '#fff3cd', color: '#856404' } 
      : statusColor;
    
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '700',
        backgroundColor: finalColor.bg,
        color: finalColor.color,
        border: `1px solid ${finalColor.color}`,
        display: 'inline-block'
      }}>
        {displayText}
      </span>
    );
  };

  // Filter campaigns based on status
  const filteredCampaigns = campaigns.filter(campaign => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'expired') return isExpired(campaign);
    return campaign.status?.toLowerCase() === statusFilter;
  });

  // Status filter counts
  const statusCounts = {
    all: campaigns.length,
    active: campaigns.filter(c => c.status?.toLowerCase() === 'active').length,
    paused: campaigns.filter(c => c.status?.toLowerCase() === 'paused').length,
    closed: campaigns.filter(c => c.status?.toLowerCase() === 'closed').length,
    expired: campaigns.filter(c => isExpired(c)).length
  };

  // Handle investment modal
  const handleInvestmentClick = (campaign) => {
    setSelectedInvestmentCampaign(campaign);
    setShowInvestmentModal(true);
  };

  const handleInvestmentSubmit = async (campaignId, amount) => {
    console.log(`Investment submitted: Campaign ${campaignId}, Amount: $${amount}`);
    
    try {
      if (onInvest) {
        await onInvest(campaignId, amount);
      }
      
      setShowInvestmentModal(false);
      setSelectedInvestmentCampaign(null);
      
      if (viewMode === "admin") {
        loadCampaignsFromBackend();
      }
      
    } catch (error) {
      console.error('Investment failed:', error);
      throw error;
    }
  };

  // Member view rendering
  const renderMemberView = (campaign) => {
    const progress = Math.min((campaign.raisedAmount / campaign.targetAmount) * 100, 100);
    
    return (
      <div key={campaign.id || campaign._id} style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{campaign.title}</h3>
        <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
          {campaign.description}
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '15px'
        }}>
          <div>
            <p style={{ margin: '0 0 2px 0', color: '#666', fontSize: '12px' }}>Expected ROI</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#28a745' }}>{campaign.expectedROI}%</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px 0', color: '#666', fontSize: '12px' }}>Duration</p>
            <p style={{ margin: 0, fontWeight: '600' }}>{campaign.durationMonths} months</p>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px'
          }}>
            <span style={{ fontSize: '12px', color: '#666' }}>Progress</span>
            <span style={{ fontSize: '12px', fontWeight: '600' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{
            width: '100%',
            backgroundColor: '#e2e8f0',
            borderRadius: '6px',
            height: '6px'
          }}>
            <div style={{
              width: `${progress}%`,
              backgroundColor: '#007bff',
              height: '6px',
              borderRadius: '6px'
            }} />
          </div>
        </div>

        {showInvestButton && campaign.status && campaign.status.toLowerCase() === 'active' && (
          <button
            onClick={() => handleInvestmentClick(campaign)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Invest Now
          </button>
        )}
      </div>
    );
  };

  // Return member view if in member mode
  if (viewMode === "member") {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p>Loading campaigns...</p>
        </div>
      );
    }

    return (
      <div>
        {campaigns.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {campaigns.map(campaign => renderMemberView(campaign))}
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>📭</div>
            <h2 style={{ color: '#333', marginBottom: '15px' }}>No Active Campaigns</h2>
            <p style={{ color: '#666' }}>
              There are currently no investment campaigns available.
            </p>
          </div>
        )}

        {showInvestmentModal && selectedInvestmentCampaign && (
          <InvestmentModal
            campaign={selectedInvestmentCampaign}
            isOpen={showInvestmentModal}
            onClose={() => {
              setShowInvestmentModal(false);
              setSelectedInvestmentCampaign(null);
            }}
            onInvest={handleInvestmentSubmit}
            userBalance={0}
          />
        )}
      </div>
    );
  }

  // Campaign Creation Modal
  const CreateCampaignModal = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      targetAmount: '',
      expectedROI: '',
      durationMonths: '',
      category: 'Agriculture'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      try {
        const response = await apiRequest('/campaigns', {
          method: 'POST',
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            targetAmount: parseInt(formData.targetAmount),
            expectedROI: parseInt(formData.expectedROI),
            durationMonths: parseInt(formData.durationMonths),
            category: formData.category
          })
        });

        if (response && response.success) {
          alert(`Campaign "${formData.title}" created successfully!`);
          setFormData({
            title: '',
            description: '',
            targetAmount: '',
            expectedROI: '',
            durationMonths: '',
            category: 'Agriculture'
          });
          setShowModal(false);
          loadCampaignsFromBackend();
        } else {
          throw new Error(response?.message || 'Campaign creation failed');
        }
      } catch (error) {
        console.error('Campaign creation error:', error);
        alert('Failed to create campaign: ' + error.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '30px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: 0, color: '#333' }}>Create New Campaign</h2>
            <button
              onClick={() => setShowModal(false)}
              disabled={isSubmitting}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Campaign Title *
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: isSubmitting ? '#f5f5f5' : 'white'
                }}
                placeholder="e.g., Tech Startup Investment"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Description *
              </label>
              <textarea
                required
                disabled={isSubmitting}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  backgroundColor: isSubmitting ? '#f5f5f5' : 'white'
                }}
                placeholder="Describe the investment opportunity..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Target Amount ($) *
                </label>
                <input
                  type="number"
                  required
                  min="10000"
                  disabled={isSubmitting}
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: isSubmitting ? '#f5f5f5' : 'white'
                  }}
                  placeholder="50000"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Category *
                </label>
                <select
                  required
                  disabled={isSubmitting}
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: isSubmitting ? '#f5f5f5' : 'white'
                  }}
                >
                  <option value="Agriculture">Agriculture</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Technology">Technology</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Trade">Trade</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Expected ROI (%) *
                </label>
                <input
                  type="number"
                  required
                  min="5"
                  max="500"
                  disabled={isSubmitting}
                  value={formData.expectedROI}
                  onChange={(e) => setFormData({...formData, expectedROI: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: isSubmitting ? '#f5f5f5' : 'white'
                  }}
                  placeholder="30"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Duration (Months) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="60"
                  disabled={isSubmitting}
                  value={formData.durationMonths}
                  onChange={(e) => setFormData({...formData, durationMonths: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: isSubmitting ? '#f5f5f5' : 'white'
                  }}
                  placeholder="6"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  padding: '12px',
                  backgroundColor: isSubmitting ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Enhanced Campaign Details Modal
  const CampaignDetailsModal = () => {
    const [activeTab, setActiveTab] = useState('details');
    const [modalInvestors] = useState([
      { id: 1, name: 'John Smith', amount: 25000, date: '2025-01-15' },
      { id: 2, name: 'Sarah Johnson', amount: 45000, date: '2025-01-16' },
      { id: 3, name: 'Michael Brown', amount: 30000, date: '2025-01-17' }
    ]);

    const expired = isExpired(selectedCampaign);
    const campaignId = selectedCampaign?.id || selectedCampaign?._id;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '30px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: 0, color: '#333' }}>Campaign Management</h2>
            <button
              onClick={() => { setShowModal(false); setSelectedCampaign(null); }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>

          {/* Expiration Warning */}
          {expired && (
            <div style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#721c24' }}>
                ⚠️ Campaign Expired
              </h4>
              <p style={{ margin: 0, color: '#721c24', fontSize: '14px' }}>
                This campaign ended on {new Date(selectedCampaign.endDate).toLocaleDateString()}. 
                Consider closing it if investments are complete.
              </p>
            </div>
          )}

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            borderBottom: '2px solid #f1f1f1'
          }}>
            <button
              onClick={() => setActiveTab('details')}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: activeTab === 'details' ? '#007bff' : '#f8f9fa',
                color: activeTab === 'details' ? 'white' : '#666',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Details & Actions
            </button>
            <button
              onClick={() => setActiveTab('investors')}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: activeTab === 'investors' ? '#007bff' : '#f8f9fa',
                color: activeTab === 'investors' ? 'white' : '#666',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Investors ({modalInvestors.length})
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ minHeight: '300px' }}>
            {activeTab === 'details' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#333' }}>{selectedCampaign?.title}</h3>
                  <StatusBadge 
                    status={selectedCampaign?.status} 
                    isExpired={expired}
                  />
                </div>
                
                {/* Campaign Details */}
                <div style={{ marginBottom: '30px', lineHeight: '1.6' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <p><strong>Target Amount:</strong> ${selectedCampaign?.targetAmount?.toLocaleString()}</p>
                      <p><strong>Raised Amount:</strong> ${selectedCampaign?.raisedAmount?.toLocaleString()}</p>
                      <p><strong>Expected ROI:</strong> {selectedCampaign?.expectedROI}%</p>
                    </div>
                    <div>
                      <p><strong>Duration:</strong> {selectedCampaign?.durationMonths} months</p>
                      <p><strong>Participants:</strong> {selectedCampaign?.participants || 0}</p>
                      <p><strong>Category:</strong> {selectedCampaign?.category}</p>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <p><strong>Description:</strong></p>
                    <p style={{ color: '#666', lineHeight: '1.6' }}>{selectedCampaign?.description}</p>
                  </div>
                </div>

                {/* Status Management Actions */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Status Management</h4>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                    gap: '15px' 
                  }}>
                    {/* Activate Button */}
                    {selectedCampaign?.status?.toLowerCase() !== 'active' && (
                      <button
                        onClick={() => updateCampaignStatus(campaignId, 'Active')}
                        disabled={actionLoading[campaignId]}
                        style={{
                          padding: '12px 16px',
                          backgroundColor: actionLoading[campaignId] ? '#6c757d' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          cursor: actionLoading[campaignId] ? 'not-allowed' : 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {actionLoading[campaignId] ? 'Updating...' : '▶️ Activate'}
                      </button>
                    )}

                    {/* Pause Button */}
                    {selectedCampaign?.status?.toLowerCase() === 'active' && (
                      <button
                        onClick={() => updateCampaignStatus(campaignId, 'Paused')}
                        disabled={actionLoading[campaignId]}
                        style={{
                          padding: '12px 16px',
                          backgroundColor: actionLoading[campaignId] ? '#6c757d' : '#ffc107',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          cursor: actionLoading[campaignId] ? 'not-allowed' : 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {actionLoading[campaignId] ? 'Updating...' : '⏸️ Pause'}
                      </button>
                    )}

                    {/* Close Button */}
                    {['active', 'paused'].includes(selectedCampaign?.status?.toLowerCase()) && (
                      <button
                        onClick={() => updateCampaignStatus(campaignId, 'Closed')}
                        disabled={actionLoading[campaignId]}
                        style={{
                          padding: '12px 16px',
                          backgroundColor: actionLoading[campaignId] ? '#6c757d' : '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          cursor: actionLoading[campaignId] ? 'not-allowed' : 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {actionLoading[campaignId] ? 'Updating...' : '🔒 Close'}
                      </button>
                    )}

                    {/* Complete Button */}
                    {selectedCampaign?.status?.toLowerCase() === 'active' && (
                      <button
                        onClick={() => updateCampaignStatus(campaignId, 'Completed')}
                        disabled={actionLoading[campaignId]}
                        style={{
                          padding: '12px 16px',
                          backgroundColor: actionLoading[campaignId] ? '#6c757d' : '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          cursor: actionLoading[campaignId] ? 'not-allowed' : 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {actionLoading[campaignId] ? 'Updating...' : '✅ Complete'}
                      </button>
                    )}
                  </div>

                  <div style={{
                    marginTop: '15px',
                    padding: '12px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#1565c0'
                  }}>
                    <strong>Status Guide:</strong> Active = accepting investments | Paused = temporarily stopped | Closed = permanently ended | Completed = successfully finished
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ marginBottom: '20px', color: '#333' }}>Campaign Investors</h3>
                
                {modalInvestors.length > 0 ? (
                  <div>
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '15px', 
                      borderRadius: '8px',
                      marginBottom: '20px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span><strong>Total Investors:</strong> {modalInvestors.length}</span>
                      <span><strong>Total Invested:</strong> ${modalInvestors.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}</span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        backgroundColor: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
                            <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                            <th style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                            <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                            <th style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>Expected Return</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modalInvestors.map((investor, index) => {
                            const expectedReturn = investor.amount * (1 + (selectedCampaign?.expectedROI || 0) / 100);
                            return (
                              <tr key={investor.id} style={{ 
                                borderBottom: index < modalInvestors.length - 1 ? '1px solid #e9ecef' : 'none',
                                backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa'
                              }}>
                                <td style={{ padding: '15px', fontWeight: '500' }}>
                                  {investor.name}
                                </td>
                                <td style={{ 
                                  padding: '15px', 
                                  textAlign: 'right', 
                                  fontWeight: '600', 
                                  color: '#28a745' 
                                }}>
                                  ${investor.amount.toLocaleString()}
                                </td>
                                <td style={{ padding: '15px', color: '#666' }}>
                                  {new Date(investor.date).toLocaleDateString()}
                                </td>
                                <td style={{ 
                                  padding: '15px', 
                                  textAlign: 'right', 
                                  fontWeight: '600', 
                                  color: '#17a2b8' 
                                }}>
                                  ${expectedReturn.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px',
                    border: '2px dashed #dee2e6'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>No Investors Yet</h4>
                    <p style={{ margin: 0, color: '#6c757d' }}>
                      Investors will appear here once they start investing in this campaign.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Loading state for admin view
  if (loading && viewMode === "admin") {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <p>Loading campaigns from database...</p>
      </div>
    );
  }

  // Admin view with enhanced status management
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: 0, color: '#333' }}>Investment Campaigns</h2>
        <button
          onClick={() => {
            setModalType('create');
            setShowModal(true);
          }}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          + Create Campaign
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '25px',
        flexWrap: 'wrap'
      }}>
        {[
          { key: 'all', label: 'All', count: statusCounts.all },
          { key: 'active', label: 'Active', count: statusCounts.active },
          { key: 'paused', label: 'Paused', count: statusCounts.paused },
          { key: 'closed', label: 'Closed', count: statusCounts.closed },
          { key: 'expired', label: 'Expired', count: statusCounts.expired }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: '8px 16px',
              backgroundColor: statusFilter === tab.key ? '#007bff' : '#f8f9fa',
              color: statusFilter === tab.key ? 'white' : '#666',
              border: '1px solid #e9ecef',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {filteredCampaigns.length === 0 && !loading ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>📋</div>
          <h3 style={{ color: '#64748B', marginBottom: '16px' }}>
            No {statusFilter === 'all' ? '' : statusFilter} Campaigns Found
          </h3>
          <p style={{ color: '#94A3B8', marginBottom: '24px' }}>
            {statusFilter === 'all' 
              ? 'Create your first investment campaign to get started.'
              : `No campaigns with status "${statusFilter}" found.`
            }
          </p>
          {statusFilter === 'all' && (
            <button
              onClick={() => {
                setModalType('create');
                setShowModal(true);
              }}
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
              Create First Campaign
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {filteredCampaigns.map((campaign) => {
            const expired = isExpired(campaign);
            const campaignId = campaign.id || campaign._id;
            
            return (
              <div key={campaignId} style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: expired ? '2px solid #f8d7da' : '1px solid #e9ecef'
              }}>
                {/* Header with Title and Status */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '15px'
                }}>
                  <h3 style={{ margin: 0, color: '#333', flex: 1 }}>{campaign.title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                    <StatusBadge status={campaign.status} isExpired={expired} />
                  </div>
                </div>
                
                <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
                  {campaign.description}
                </p>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Expected ROI</p>
                    <p style={{ margin: 0, fontWeight: '600', color: '#28a745' }}>{campaign.expectedROI}%</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Duration</p>
                    <p style={{ margin: 0, fontWeight: '600' }}>{campaign.durationMonths} months</p>
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px'
                  }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>Progress</span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                      ${(campaign.raisedAmount || 0).toLocaleString()} / ${(campaign.targetAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '10px',
                    height: '8px'
                  }}>
                    <div style={{
                      width: `${Math.min(((campaign.raisedAmount || 0) / (campaign.targetAmount || 1)) * 100, 100)}%`,
                      backgroundColor: '#007bff',
                      height: '8px',
                      borderRadius: '10px'
                    }} />
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '15px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px' }}>Participants</p>
                    <p style={{ margin: 0, fontWeight: '600' }}>{campaign.participants || 0}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px' }}>Category</p>
                    <p style={{ margin: 0, fontWeight: '600' }}>{campaign.category}</p>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '15px',
                  flexWrap: 'wrap'
                }}>
                  {campaign.status?.toLowerCase() === 'active' && (
                    <button
                      onClick={() => updateCampaignStatus(campaignId, 'Paused')}
                      disabled={actionLoading[campaignId]}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: actionLoading[campaignId] ? '#6c757d' : '#ffc107',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: actionLoading[campaignId] ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Pause
                    </button>
                  )}
                  
                  {campaign.status?.toLowerCase() === 'paused' && (
                    <button
                      onClick={() => updateCampaignStatus(campaignId, 'Active')}
                      disabled={actionLoading[campaignId]}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: actionLoading[campaignId] ? '#6c757d' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: actionLoading[campaignId] ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Activate
                    </button>
                  )}

                  {['active', 'paused'].includes(campaign.status?.toLowerCase()) && (
                    <button
                      onClick={() => updateCampaignStatus(campaignId, 'Closed')}
                      disabled={actionLoading[campaignId]}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: actionLoading[campaignId] ? '#6c757d' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: actionLoading[campaignId] ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Close
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedCampaign(campaign);
                    setModalType('details');
                    setShowModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Manage Campaign
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showModal && modalType === 'create' && <CreateCampaignModal />}
      {showModal && modalType === 'details' && <CampaignDetailsModal />}
    </div>
  );
};

export default CampaignList;