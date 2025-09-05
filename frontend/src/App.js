import React, { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import AdminLogin from './components/auth/AdminLogin';
import MemberDashboard from './components/dashboard/MemberDashboard';
import LandingPage from './components/landing/LandingPage';
import AdminPanel from './components/admin/AdminPanel';

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Check authentication status on app load
  useEffect(() => {
    const memberToken = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const adminToken = localStorage.getItem('adminToken');
    const userRole = localStorage.getItem('userRole');

    if (adminToken && userRole === 'admin') {
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      setIsAdminLoggedIn(true);
      setCurrentUser(adminUser);
      setCurrentView('admin');
    } else if (memberToken && user) {
      const userData = JSON.parse(user);
      setIsLoggedIn(true);
      setCurrentUser(userData);
      setCurrentView('dashboard');
    }
    
    setLoading(false);
  }, []);

  const handleMemberLoginSuccess = () => {
    // Get user data from localStorage after login
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUser(userData);
    }
    setIsLoggedIn(true);
    setCurrentView('dashboard');
  };

  const handleAdminLoginSuccess = (adminUser) => {
    setIsAdminLoggedIn(true);
    setCurrentUser(adminUser);
    setCurrentView('admin');
  };

  const handleMemberLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('userRole');
    setIsAdminLoggedIn(false);
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const navigateToMemberLogin = () => {
    setCurrentView('login');
  };

  const navigateToAdminLogin = () => {
    setCurrentView('adminLogin');
  };

  const navigateToLanding = () => {
    setCurrentView('landing');
  };

  // Verify admin authentication before showing admin panel
  const verifyAdminAccess = () => {
    const adminToken = localStorage.getItem('adminToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!adminToken || userRole !== 'admin') {
      handleAdminLogout();
      return false;
    }
    return true;
  };

  // Verify member authentication before showing dashboard
  const verifyMemberAccess = () => {
    const memberToken = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!memberToken || !user) {
      handleMemberLogout();
      return false;
    }
    return true;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔄</div>
          <p>Loading Elevate Network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {currentView === 'landing' && (
        <LandingPage 
          onNavigateToLogin={navigateToMemberLogin}
          onNavigateToAdmin={navigateToAdminLogin}
        />
      )}
      
      {currentView === 'login' && (
        <Login 
          onLoginSuccess={handleMemberLoginSuccess} 
          onBackToLanding={navigateToLanding}
        />
      )}
      
      {currentView === 'adminLogin' && (
        <AdminLogin 
          onAdminLoginSuccess={handleAdminLoginSuccess}
          onBackToLanding={navigateToLanding}
        />
      )}
      
      {currentView === 'admin' && isAdminLoggedIn && verifyAdminAccess() && (
        <AdminPanel 
          onLogout={handleAdminLogout}
          currentUser={currentUser}
        />
      )}
      
      {currentView === 'dashboard' && isLoggedIn && (
        <MemberDashboard onLogout={handleMemberLogout} />
      )}
    </div>
  );
}

export default App;