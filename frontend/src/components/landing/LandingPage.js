import React, { useState, useEffect } from 'react';
import RegistrationWithPayment from './RegistrationWithPayment';

const LandingPage = ({ onNavigateToLogin, onNavigateToAdmin }) => {
  const [showRegistration, setShowRegistration] = useState(false);
  const [animatedNumber, setAnimatedNumber] = useState(0);

  // Animate member count
  useEffect(() => {
    const target = 15000;
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedNumber(target);
        clearInterval(timer);
      } else {
        setAnimatedNumber(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, []);

  if (showRegistration) {
    return (
      <RegistrationWithPayment 
        onBackToLanding={() => setShowRegistration(false)}
        onRegistrationSuccess={() => {
          alert('Registration successful! Please join our Telegram community and login with your credentials.');
          setShowRegistration(false);
        }}
      />
    );
  }

  const floatingAnimation = {
    animation: 'float 6s ease-in-out infinite',
  };

  const pulseAnimation = {
    animation: 'pulse 2s ease-in-out infinite alternate',
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', overflow: 'hidden' }}>
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            100% { transform: scale(1.05); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-50px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .slide-in { animation: slideIn 0.8s ease-out; }
        `}
      </style>

      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Floating Background Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '100px',
          height: '100px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          ...floatingAnimation
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '5%',
          width: '60px',
          height: '60px',
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          ...floatingAnimation,
          animationDelay: '2s'
        }} />
        
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ color: 'white' }} className="slide-in">
            <div style={{
              backgroundColor: 'rgba(40, 167, 69, 0.2)',
              padding: '8px 16px',
              borderRadius: '20px',
              display: 'inline-block',
              marginBottom: '20px',
              border: '1px solid rgba(40, 167, 69, 0.3)'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>🚀 Join {animatedNumber.toLocaleString()}+ Active Members</span>
            </div>
            
            <h1 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              margin: '0 0 20px 0',
              lineHeight: '1.2'
            }}>
              Welcome to <span style={{ color: '#28a745' }}>Elevate Network</span>
            </h1>
            <p style={{
              fontSize: '20px',
              margin: '0 0 30px 0',
              opacity: 0.9,
              lineHeight: '1.6'
            }}>
              Nigeria's premier cooperative society for collective growth and financial empowerment. 
              Together we build wealth, share knowledge, and create lasting prosperity.
            </p>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowRegistration(true)}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(40, 167, 69, 0.3)',
                  ...pulseAnimation
                }}
              >
                Join Now - Only $20 USDT!
              </button>
              <button
                onClick={onNavigateToLogin}
                style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: '2px solid white',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = '#667eea';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = 'white';
                }}
              >
                Member Login
              </button>
              <button
                onClick={onNavigateToAdmin}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Admin Portal
              </button>
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '40px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            ...floatingAnimation,
            animationDelay: '1s'
          }}>
            <h3 style={{ color: 'white', fontSize: '24px', margin: '0 0 20px 0' }}>
              Why Choose Elevate Network?
            </h3>
            <div style={{ color: 'white', opacity: 0.9 }}>
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '12px', fontSize: '20px' }}>💰</span>
                <span>High-yield investment opportunities with guaranteed returns</span>
              </div>
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '12px', fontSize: '20px' }}>🏦</span>
                <span>Interest-free loans up to 3x your contributions</span>
              </div>
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '12px', fontSize: '20px' }}>🛡️</span>
                <span>Secure crypto payment integration</span>
              </div>
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '12px', fontSize: '20px' }}>📱</span>
                <span>Easy mobile access and instant payments</span>
              </div>
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '12px', fontSize: '20px' }}>🌍</span>
                <span>Global accessibility with local expertise</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '12px', fontSize: '20px' }}>🎓</span>
                <span>Free Web3 education and financial literacy training</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Benefits Section */}
      <div style={{ padding: '80px 20px', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', color: '#333', margin: '0 0 20px 0' }}>
            Collective Growth Through Community Power
          </h2>
          <p style={{ fontSize: '18px', color: '#666', margin: '0 0 50px 0', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            Experience the power of collective decision-making where every member contributes to our success
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              textAlign: 'center',
              transition: 'transform 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤝</div>
              <h3 style={{ color: '#333', fontSize: '20px', margin: '0 0 15px 0' }}>Democratic Decision Making</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Every investment campaign is voted on by our community. Your voice matters in shaping our collective future.
              </p>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              textAlign: 'center',
              transition: 'transform 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
              <h3 style={{ color: '#333', fontSize: '20px', margin: '0 0 15px 0' }}>Transparent Operations</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Full transparency with documented processes, real-time updates, and community oversight on all activities.
              </p>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              textAlign: 'center',
              transition: 'transform 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎯</div>
              <h3 style={{ color: '#333', fontSize: '20px', margin: '0 0 15px 0' }}>Proven Leadership</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Led by founders with over 10 years of financial expertise in profit generation and risk management.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap Section */}
      <div style={{ padding: '80px 20px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '36px', color: '#333', margin: '0 0 20px 0' }}>
              Our Strategic Roadmap
            </h2>
            <p style={{ fontSize: '18px', color: '#666', margin: '0', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
              A clear path to collective prosperity and sustainable growth
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            {/* Timeline Line */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '0',
              bottom: '0',
              width: '4px',
              backgroundColor: '#28a745',
              transform: 'translateX(-50%)',
              zIndex: 1
            }} />

            {/* Roadmap Items */}
            {[
              {
                phase: 'Phase 1',
                timeline: 'Q2 2025',
                title: 'Community Foundation & Education',
                description: 'Launch comprehensive Web3 education programs and establish permanent farming operations with strategic partnerships.',
                status: 'active'
              },
              {
                phase: 'Phase 2',
                timeline: 'Q4 2025',
                title: 'Strategic Partnerships & Expansion',
                description: 'Build alliances with verified businesses across renewable energy, fintech, and franchise sectors for diversified campaigns.',
                status: 'upcoming'
              },
              {
                phase: 'Phase 3',
                timeline: 'Q2 2026',
                title: 'Real Estate & Asset Development',
                description: 'Enable members to acquire landed properties through affordable payment plans and smart investment strategies.',
                status: 'upcoming'
              },
              {
                phase: 'Phase 4',
                timeline: 'Q4 2026',
                title: 'Global Community & Token Launch',
                description: 'Achieve 100,000+ active members worldwide and launch our unique decentralized utility token.',
                status: 'future'
              }
            ].map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '60px',
                flexDirection: index % 2 === 0 ? 'row' : 'row-reverse'
              }}>
                <div style={{
                  flex: 1,
                  padding: index % 2 === 0 ? '0 60px 0 0' : '0 0 0 60px',
                  textAlign: index % 2 === 0 ? 'right' : 'left'
                }}>
                  <div style={{
                    backgroundColor: item.status === 'active' ? '#28a745' : item.status === 'upcoming' ? '#ffc107' : '#6c757d',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'inline-block',
                    marginBottom: '10px'
                  }}>
                    {item.phase} • {item.timeline}
                  </div>
                  <h3 style={{ fontSize: '24px', color: '#333', margin: '0 0 15px 0' }}>
                    {item.title}
                  </h3>
                  <p style={{ color: '#666', lineHeight: '1.6', fontSize: '16px' }}>
                    {item.description}
                  </p>
                </div>
                
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: item.status === 'active' ? '#28a745' : '#fff',
                  border: `4px solid ${item.status === 'active' ? '#28a745' : item.status === 'upcoming' ? '#ffc107' : '#6c757d'}`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 2,
                  fontSize: '24px'
                }}>
                  {item.status === 'active' ? '🚀' : item.status === 'upcoming' ? '⭐' : '🎯'}
                </div>
                
                <div style={{ flex: 1 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: '80px 20px', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', color: '#333', margin: '0 0 20px 0' }}>
            Comprehensive Member Benefits
          </h2>
          <p style={{ fontSize: '18px', color: '#666', margin: '0 0 50px 0', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            Everything you need for financial growth and community engagement
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
            {[
              { icon: '💎', title: 'High-ROI Investment Campaigns', desc: 'Participate in vetted campaigns with guaranteed returns up to 120%' },
              { icon: '⚡', title: '3-Level Referral System', desc: 'Earn up to 10% commission across three referral levels' },
              { icon: '🏠', title: 'Real Estate Opportunities', desc: 'Access affordable property acquisition with flexible payment plans' },
              { icon: '🎓', title: 'Free Education Programs', desc: 'Learn Web3, forex, stocks, crypto, and essential financial skills' },
              { icon: '💳', title: 'Interest-Free Loans', desc: 'Access loans up to 3x your contributions with 6-month repayment' },
              { icon: '🎊', title: 'Community Celebrations', desc: 'Birthday celebrations, games, and special member recognition events' }
            ].map((feature, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '30px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
              }}
              >
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>{feature.icon}</div>
                <h3 style={{ color: '#333', fontSize: '20px', margin: '0 0 15px 0' }}>{feature.title}</h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div style={{ padding: '80px 20px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', color: '#333', margin: '0 0 20px 0' }}>
            Simple, Transparent Membership
          </h2>
          <p style={{ fontSize: '18px', color: '#666', margin: '0 0 50px 0' }}>
            One-time registration grants lifetime access to our comprehensive platform
          </p>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            border: '3px solid #28a745',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#28a745',
              color: 'white',
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              LIFETIME ACCESS
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '24px', color: '#333', margin: '0 0 10px 0' }}>Premium Membership</h3>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#28a745', margin: '0 0 10px 0' }}>
                $20 <span style={{ fontSize: '18px', color: '#666', fontWeight: 'normal' }}>USDT</span>
              </div>
              <p style={{ color: '#666', margin: 0 }}>One-time payment • Lifetime benefits • Telegram community access</p>
            </div>
            
            <div style={{ textAlign: 'left', marginBottom: '30px' }}>
              {[
                'Access to all investment campaigns and voting rights',
                '3-level referral commission system',
                'Interest-free loans up to 3x contributions',
                'Free Web3 and financial education programs',
                'Real estate investment opportunities',
                'Community celebrations and networking events',
                'Premium Telegram community membership',
                '24/7 customer support and guidance'
              ].map((benefit, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: '#28a745', marginRight: '10px', fontSize: '18px' }}>✓</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setShowRegistration(true)}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '18px 40px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(40, 167, 69, 0.3)',
                width: '100%',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
            >
              Join Our Community Now
            </button>
          </div>
        </div>
      </div>

      {/* Telegram Community CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #0088cc 0%, #005599 100%)',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: 'white', fontSize: '32px', margin: '0 0 20px 0' }}>
            Join Our Active Telegram Community
          </h2>
          <p style={{ color: 'white', fontSize: '18px', margin: '0 0 30px 0', opacity: 0.9 }}>
            Connect with fellow members, participate in discussions, and stay updated on all community activities
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              style={{
                backgroundColor: 'white',
                color: '#0088cc',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              📱 Join Telegram Community
            </button>
          </div>
          <p style={{ color: 'white', fontSize: '14px', margin: '20px 0 0 0', opacity: 0.8 }}>
            *Available after successful registration and login
          </p>
        </div>
      </div>

      {/* Social Media & Final CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: 'white', fontSize: '32px', margin: '0 0 20px 0' }}>
            Ready to Elevate Your Financial Future?
          </h2>
          <p style={{ color: 'white', fontSize: '18px', margin: '0 0 30px 0', opacity: 0.9 }}>
            Join thousands who are building wealth through collective growth
          </p>
          
          <div style={{ marginBottom: '30px' }}>
            <p style={{ color: 'white', fontSize: '16px', margin: '0 0 15px 0', opacity: 0.9 }}>
              Follow us on social media:
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <span style={{ color: 'white', fontSize: '14px' }}>📘 Facebook: @ElevateNetworks</span>
              <span style={{ color: 'white', fontSize: '14px' }}>📷 Instagram: @ElevateNetworks</span>
              <span style={{ color: 'white', fontSize: '14px' }}>🐦 Twitter: @ElevateNetworks</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowRegistration(true)}
            style={{
              backgroundColor: 'white',
              color: '#28a745',
              border: 'none',
              padding: '18px 40px',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              ...pulseAnimation
            }}
          >
            Register Now - $20 USDT
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#333', color: 'white', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
          © 2025 Elevate Network. All rights reserved. | Secure crypto payments • Global community • Transparent operations
        </p>
      </div>
    </div>
  );
};

export default LandingPage;