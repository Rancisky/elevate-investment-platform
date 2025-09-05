import React, { useState, useEffect } from 'react';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  // Fetch user notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/notifications/my-notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      setNotifications(prev => prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      
      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true; // 'all'
  });

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'donation_success': return '💰';
      case 'loan_eligible': return '✅';
      case 'campaign_update': return '📈';
      case 'referral_bonus': return '👥';
      case 'system_announcement': return '📢';
      case 'investment_matured': return '🎯';
      default: return '📄';
    }
  };

  // Get time ago string
  const getTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInHours = (now - notificationDate) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return notificationDate.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#333' }}>Notifications</h2>
          {unreadCount > 0 && (
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '2px solid #e1e5e9',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            Loading notifications...
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div>
            {filteredNotifications.map((notification, index) => (
              <div
                key={notification.id}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
                style={{
                  padding: '20px',
                  borderBottom: index < filteredNotifications.length - 1 ? '1px solid #e9ecef' : 'none',
                  backgroundColor: notification.isRead ? 'white' : '#f8f9ff',
                  cursor: notification.isRead ? 'default' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                  <div style={{ fontSize: '24px', flexShrink: 0 }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <h4 style={{
                        margin: 0,
                        color: '#333',
                        fontSize: '16px',
                        fontWeight: notification.isRead ? '500' : '600'
                      }}>
                        {notification.title}
                      </h4>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontSize: '12px',
                          color: '#999'
                        }}>
                          {getTimeAgo(notification.createdAt)}
                        </span>
                        
                        {!notification.isRead && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#007bff',
                            borderRadius: '50%'
                          }} />
                        )}
                      </div>
                    </div>
                    
                    <p style={{
                      margin: 0,
                      color: '#666',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {notification.message}
                    </p>
                    
                    {notification.actionUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = notification.actionUrl;
                        }}
                        style={{
                          marginTop: '10px',
                          padding: '6px 12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {notification.actionText || 'View Details'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
            <p style={{ margin: 0, fontSize: '16px' }}>
              {filter === 'unread' ? 'No unread notifications' :
               filter === 'read' ? 'No read notifications' :
               'No notifications yet'}
            </p>
            <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
              You'll see updates about your investments, referrals, and account activities here.
            </p>
          </div>
        )}
      </div>

      {/* Sample notifications for development/testing */}
      {notifications.length === 0 && !loading && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginTop: '20px'
        }}>
          <h4 style={{ marginBottom: '15px', color: '#333' }}>Sample Notifications</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ padding: '15px', backgroundColor: '#f8f9ff', borderRadius: '8px', border: '1px solid #e1e5ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                <span>💰</span>
                <strong>Investment Confirmed</strong>
                <span style={{ fontSize: '12px', color: '#999', marginLeft: 'auto' }}>2 hours ago</span>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Your $500 investment in Poultry Farm Investment was confirmed. Expected return: $1,000 in 3 months.
              </p>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px', border: '1px solid #b3d9ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                <span>✅</span>
                <strong>Loan Eligibility Achieved</strong>
                <span style={{ fontSize: '12px', color: '#999', marginLeft: 'auto' }}>1 day ago</span>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Congratulations! You now qualify for loans up to $2,400. Apply now in the Loans section.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;