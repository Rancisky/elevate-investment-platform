import React, { useState } from 'react';

const RegistrationWithPayment = () => {
  const [step, setStep] = useState(1); // 1: Form, 2: Payment, 3: Success
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    occupation: '',
    monthlyIncome: '',
    referralCode: ''
  });
  
  const [referralInfo, setReferralInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('waiting'); // waiting, processing, completed, failed

  // NowPayments API configuration
  const NOWPAYMENTS_API_KEY = 'HV2S6N2-ZAEMEYS-HRN393Z-S9MVWSW';
  const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1';

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Verify referral code
  const verifyReferral = async (code) => {
    if (!code) {
      setReferralInfo(null);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/auth/verify-referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: code })
      });

      if (response.ok) {
        const data = await response.json();
        setReferralInfo(data.referrer);
      } else {
        setReferralInfo(null);
      }
    } catch (error) {
      setReferralInfo(null);
    }
  };

  // Handle form submission - move to payment step
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Move to payment step
    setStep(2);
    setError('');
  };

  // Create NowPayments payment
  const createNowPayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Get minimum payment amount
      const minAmountResponse = await fetch(`${NOWPAYMENTS_BASE_URL}/min-amount?currency_from=usd&currency_to=usdttrc20`, {
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY
        }
      });

      if (!minAmountResponse.ok) {
        throw new Error('Failed to get minimum amount');
      }

      const minAmountData = await minAmountResponse.json();
      console.log('Min amount:', minAmountData);

      // Step 2: Create payment
      const paymentPayload = {
        price_amount: 20,
        price_currency: 'usd',
        pay_currency: 'usdttrc20', // USDT TRC20
        order_id: `order_${Date.now()}_${formData.username}`,
        order_description: `Elevate Network Registration - ${formData.fullName}`
      };

      console.log('Payment payload:', paymentPayload);

      const paymentResponse = await fetch(`${NOWPAYMENTS_BASE_URL}/payment`, {
        method: 'POST',
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentPayload)
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || 'Failed to create payment');
      }

      const paymentResult = await paymentResponse.json();
      console.log('Payment created:', paymentResult);

      setPaymentData(paymentResult);
      // NowPayments usually returns invoice_url for the hosted payment page
      const paymentPageUrl = paymentResult.invoice_url || paymentResult.payment_url || paymentResult.pay_url;
      setPaymentUrl(paymentPageUrl);
      setPaymentStatus('processing');
      
      console.log('Payment URL:', paymentPageUrl);
      
      // Start polling for payment status
      pollPaymentStatus(paymentResult.payment_id);

    } catch (error) {
      console.error('Payment creation error:', error);
      setError('Failed to create payment: ' + error.message);
      setLoading(false);
    }
  };

  // Poll payment status
  const pollPaymentStatus = async (paymentId) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(`${NOWPAYMENTS_BASE_URL}/payment/${paymentId}`, {
          headers: {
            'x-api-key': NOWPAYMENTS_API_KEY
          }
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('Payment status:', statusData);

          if (statusData.payment_status === 'finished' || statusData.payment_status === 'confirmed') {
            clearInterval(pollInterval);
            setPaymentStatus('completed');
            setLoading(false);
            
            // Update payment data with final status
            setPaymentData(prev => ({
              ...prev,
              ...statusData,
              transactionId: statusData.payment_id || statusData.pay_address
            }));
            
            // Create account after successful payment
            await createAccount(statusData);
          } else if (statusData.payment_status === 'failed' || statusData.payment_status === 'expired') {
            clearInterval(pollInterval);
            setPaymentStatus('failed');
            setError('Payment failed or expired. Please try again.');
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 10000); // Check every 10 seconds

    // Stop polling after 30 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentStatus === 'processing') {
        setError('Payment timeout. Please contact support if you made the payment.');
        setLoading(false);
      }
    }, 30 * 60 * 1000);
  };

  // Create account after successful payment
  const createAccount = async (paymentResult = null) => {
    try {
      const finalPaymentData = paymentResult || paymentData;
      
      if (!finalPaymentData || !finalPaymentData.payment_id) {
        throw new Error('Payment data is missing');
      }

      const registrationData = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        occupation: formData.occupation,
        monthlyIncome: formData.monthlyIncome,
        referralCode: formData.referralCode,
        paymentConfirmed: true,
        transactionId: finalPaymentData.payment_id,
        paymentDetails: {
          orderId: finalPaymentData.order_id,
          payAmount: finalPaymentData.pay_amount,
          payCurrency: finalPaymentData.pay_currency,
          paymentStatus: finalPaymentData.payment_status
        }
      };

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      setStep(3); // Success step
      
    } catch (error) {
      console.error('Registration error:', error);
      setError('Account creation failed: ' + error.message);
      setLoading(false);
    }
  };

  // Handle manual payment verification
  const handleManualVerification = async () => {
    if (!paymentData?.payment_id) {
      setError('No payment ID found');
      return;
    }

    setLoading(true);
    try {
      const statusResponse = await fetch(`${NOWPAYMENTS_BASE_URL}/payment/${paymentData.payment_id}`, {
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.payment_status === 'finished' || statusData.payment_status === 'confirmed') {
          setPaymentStatus('completed');
          await createAccount(statusData);
        } else {
          setError(`Payment status: ${statusData.payment_status}`);
        }
      }
    } catch (error) {
      setError('Verification failed: ' + error.message);
    }
    setLoading(false);
  };

  // Form Step
  if (step === 1) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#333', fontSize: '28px', margin: '0 0 10px 0' }}>
              Join Elevate Network
            </h1>
            <p style={{ color: '#666', margin: 0 }}>
              Step 1: Fill your details (Payment required: $20 USDT)
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Referral Code (Optional)
              </label>
              <input
                type="text"
                name="referralCode"
                value={formData.referralCode}
                onChange={(e) => {
                  handleInputChange(e);
                  verifyReferral(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${referralInfo ? '#28a745' : '#e1e5e9'}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {referralInfo && (
                <p style={{ color: '#28a745', fontSize: '14px', margin: '5px 0 0 0' }}>
                  ✓ Valid referral from {referralInfo.fullName} ({referralInfo.userId})
                </p>
              )}
            </div>

            <div style={{
              backgroundColor: '#fff3cd',
              color: '#856404',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <strong>Registration Fee: $20 USDT</strong>
              <br />
              Payment is required to activate your account
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Proceed to Payment ($20 USDT)
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Payment Step
  if (step === 2) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>Complete Payment</h2>
          
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Registration Fee</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745', margin: 0 }}>
              $20 USDT
            </p>
          </div>

          <div style={{
            backgroundColor: '#e8f5e8',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <strong>Account Details:</strong>
            <br />Name: {formData.fullName}
            <br />Username: {formData.username}
            <br />Email: {formData.email}
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          {/* Payment Status Display */}
          {paymentStatus === 'processing' && paymentData && (
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <strong>Payment Created Successfully!</strong>
              <br />Payment ID: {paymentData.payment_id}
              <br />Amount: {paymentData.pay_amount} {paymentData.pay_currency?.toUpperCase()}
              <br />Status: Waiting for payment...
            </div>
          )}

          {/* Payment URL Link OR Wallet Address */}
          {paymentData && paymentStatus === 'processing' && (
            <div style={{ marginBottom: '20px' }}>
              {paymentUrl ? (
                // If payment URL exists, show button to open hosted page
                <a 
                  href={paymentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    width: '100%',
                    padding: '15px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  Open Payment Page - Pay Now
                </a>
              ) : paymentData.pay_address ? (
                // If no payment URL but wallet address exists, show manual payment instructions
                <div style={{
                  backgroundColor: '#d4edda',
                  border: '1px solid #c3e6cb',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'left'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#155724' }}>Send USDT Payment To:</h4>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Wallet Address:</strong>
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      wordBreak: 'break-all',
                      marginTop: '5px'
                    }}>
                      {paymentData.pay_address}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(paymentData.pay_address)}
                      style={{
                        marginTop: '5px',
                        padding: '5px 10px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Copy Address
                    </button>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong>Amount to Send:</strong>
                    <div style={{
                      backgroundColor: '#fff3cd',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ffeaa7',
                      marginTop: '5px',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      {paymentData.pay_amount} {paymentData.pay_currency?.toUpperCase()}
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong>Network:</strong> TRC20 (Tron)
                    <br />
                    <strong>Payment ID:</strong> {paymentData.payment_id}
                  </div>

                  {/* QR Code for the wallet address */}
                  <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${paymentData.pay_address}`}
                      alt="Wallet QR Code"
                      style={{
                        border: '1px solid #dee2e6',
                        borderRadius: '8px'
                      }}
                    />
                    <p style={{ fontSize: '12px', color: '#6c757d', margin: '5px 0 0 0' }}>
                      Scan QR code with your wallet app
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginTop: '15px'
                  }}>
                    <strong>Important:</strong> Send exactly the amount shown above to the wallet address. 
                    Payment will be automatically detected within 10 minutes.
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#fff3cd',
                  color: '#856404',
                  padding: '15px',
                  borderRadius: '8px',
                  textAlign: 'left'
                }}>
                  <strong>Manual Payment Instructions:</strong>
                  <br />Send exactly <strong>{paymentData.pay_amount} {paymentData.pay_currency?.toUpperCase()}</strong>
                  <br />Payment ID: <strong>{paymentData.payment_id}</strong>
                  <br /><em>Contact support for wallet address</em>
                </div>
              )}
              
              {paymentUrl && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                  Click above to open the NowPayments page with wallet address, QR code, and payment instructions
                </p>
              )}
            </div>
          )}

          {/* Main Payment Button */}
          {!paymentData && (
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={createNowPayment}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: loading ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating Payment...' : 'Pay $20 USDT'}
              </button>
            </div>
          )}

          {/* Manual Verification Button */}
          {paymentData && paymentStatus === 'processing' && (
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={handleManualVerification}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Verifying Payment...' : 'Check Payment Status'}
              </button>
            </div>
          )}

          <button
            onClick={() => setStep(1)}
            disabled={loading}
            style={{
              backgroundColor: 'transparent',
              color: '#666',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              textDecoration: 'underline'
            }}
          >
            Back to Form
          </button>
        </div>
      </div>
    );
  }

  // Success Step
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
        <h2 style={{ color: '#28a745', marginBottom: '20px' }}>Registration Successful!</h2>
        
        <div style={{
          backgroundColor: '#e8f5e8',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          <strong>Account Created:</strong>
          <br />Name: {formData.fullName}
          <br />Username: {formData.username}
          <br />Email: {formData.email}
          <br />Transaction ID: {paymentData?.payment_id || paymentData?.transactionId}
        </div>

        <p style={{ color: '#666', marginBottom: '20px' }}>
          Your account has been successfully created and activated. You can now log in to your dashboard.
        </p>

        <button
          onClick={() => window.location.href = '/login'}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default RegistrationWithPayment;