import React, { useState, useEffect } from 'react';

const InvestmentModal = ({ campaign, isOpen, onClose, onInvest, userBalance = 0 }) => {
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInvestmentAmount('');
      setError('');
      setSuccess('');
      setIsSubmitting(false);
      setPaymentInstructions(null);
      setCopiedField(null);
    }
  }, [isOpen]);

  if (!isOpen || !campaign) return null;

  // Calculate expected returns
  const amount = parseFloat(investmentAmount) || 0;
  const expectedReturn = amount * (1 + campaign.expectedROI / 100);
  const profit = expectedReturn - amount;

  // Copy to clipboard function
  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Validate investment amount
  const validateAmount = () => {
    if (!investmentAmount) return 'Please enter an investment amount';
    if (amount <= 0) return 'Investment amount must be greater than 0';
    if (amount < 10) return 'Minimum investment is $10';
    if (amount > 100000) return 'Maximum investment is $100,000';
    if (userBalance > 0 && amount > userBalance) return 'Insufficient balance';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateAmount();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Make API call directly here since we need to handle the new response structure
      const response = await fetch('http://localhost:5000/api/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaign.id || campaign._id,
          amount: amount,
          userId: '20a8cff1-8a13-43fa-974f-edad8cd1b45c' // You should get this from auth context
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.requiresPayment && data.paymentInstructions) {
          // Show payment instructions instead of immediate success
          setPaymentInstructions(data.paymentInstructions);
          setSuccess('');
        } else {
          // Fallback to old success message format
          setSuccess(`Successfully invested $${amount.toLocaleString()} in ${campaign.title}!`);
        }
      } else {
        throw new Error(data.message || 'Investment failed');
      }
      
    } catch (error) {
      console.error('Investment error:', error);
      setError(error.message || 'Investment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInvestmentAmount(value);
      setError(''); // Clear error when user starts typing
    }
  };

  const quickAmountButtons = [100, 500, 1000, 5000];

  // Get NOWPayments data from the response
  const nowPaymentData = paymentInstructions?.paymentMethods?.find(
    method => method.method === 'nowpayments_crypto'
  )?.details;

  const hasRealPayment = nowPaymentData && nowPaymentData.pay_address;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: paymentInstructions ? '700px' : '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            color: '#666',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ marginBottom: '25px' }}>
          <h2 style={{ 
            margin: '0 0 10px 0', 
            color: '#333',
            fontSize: '24px',
            fontWeight: '700'
          }}>
            {paymentInstructions ? 'Complete Your Payment' : `Invest in ${campaign.title}`}
          </h2>
          <p style={{ 
            margin: 0, 
            color: '#666',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            {paymentInstructions ? 
              'Your investment has been created. Please complete payment to activate it.' : 
              campaign.description
            }
          </p>
        </div>

        {/* Payment Instructions */}
        {paymentInstructions ? (
          <div>
            {/* Investment Summary */}
            <div style={{
              backgroundColor: '#e8f5e8',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '25px',
              border: '1px solid #c3e6c3'
            }}>
              <h4 style={{ 
                margin: '0 0 15px 0', 
                color: '#2d5a2d',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                Investment Summary
              </h4>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#2d5a2d' }}>Investment Amount:</span>
                  <span style={{ fontWeight: '600', color: '#2d5a2d' }}>
                    ${paymentInstructions.amount.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#2d5a2d' }}>Expected Return:</span>
                  <span style={{ fontWeight: '600', color: '#2d5a2d' }}>
                    ${paymentInstructions.expectedReturn.toLocaleString()}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid #a8d4a8'
                }}>
                  <span style={{ color: '#2d5a2d', fontWeight: '600' }}>Your Profit:</span>
                  <span style={{ fontWeight: '700', color: '#28a745', fontSize: '16px' }}>
                    +${paymentInstructions.profit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            {hasRealPayment ? (
              <div style={{
                backgroundColor: '#d1ecf1',
                border: '1px solid #bee5eb',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '25px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#0c5460', fontSize: '16px' }}>
                  Payment Ready
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#0c5460' }}>
                  Your crypto payment has been generated. Send the exact amount to complete your investment.
                </p>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '25px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '16px' }}>
                  Contact Support Required
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
                  Please contact support to receive your payment instructions.
                </p>
              </div>
            )}

            {/* Real NOWPayments Crypto Details */}
            {hasRealPayment && (
              <div style={{
                border: '2px solid #007bff',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '25px',
                backgroundColor: '#f8f9ff'
              }}>
                <h4 style={{ 
                  margin: '0 0 20px 0', 
                  color: '#007bff',
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  Bitcoin Payment Details
                </h4>
                
                {/* Amount to Send */}
                <div style={{
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#333' }}>Amount to Send:</span>
                    <button
                      onClick={() => copyToClipboard(nowPaymentData.pay_amount.toString(), 'amount')}
                      style={{
                        background: 'none',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        color: '#007bff',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {copiedField === 'amount' ? 'Copied!' : 'Copy Amount'}
                    </button>
                  </div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#007bff',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}>
                    {nowPaymentData.pay_amount} BTC
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    ≈ ${nowPaymentData.price_amount} USD
                  </div>
                </div>

                {/* Bitcoin Address */}
                <div style={{
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#333' }}>Bitcoin Address:</span>
                    <button
                      onClick={() => copyToClipboard(nowPaymentData.pay_address, 'address')}
                      style={{
                        background: 'none',
                        border: '1px solid #28a745',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        color: '#28a745',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {copiedField === 'address' ? 'Copied!' : 'Copy Address'}
                    </button>
                  </div>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #dee2e6',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    wordBreak: 'break-all',
                    color: '#495057'
                  }}>
                    {nowPaymentData.pay_address}
                  </div>
                </div>

                {/* Payment Status */}
                <div style={{
                  backgroundColor: '#fff3cd',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #ffeaa7',
                  marginBottom: '15px'
                }}>
                  <div style={{ fontSize: '14px', color: '#856404' }}>
                    <strong>Status:</strong> {nowPaymentData.payment_status} | 
                    <strong> Payment ID:</strong> {nowPaymentData.payment_id}
                  </div>
                </div>

                {/* NOWPayments URL */}
                {nowPaymentData.payment_url && (
                  <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                    <a
                      href={nowPaymentData.payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        backgroundColor: '#007bff',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}
                    >
                      Pay with NOWPayments
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Manual Crypto Support (Fallback) */}
            {!hasRealPayment && paymentInstructions.paymentMethods?.some(method => method.method === 'crypto_manual') && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '25px',
                border: '1px solid #e9ecef'
              }}>
                <h5 style={{ margin: '0 0 15px 0', color: '#333' }}>
                  Manual Crypto Payment
                </h5>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#666' }}>
                  <p style={{ margin: '0 0 10px 0' }}>
                    <strong>Contact support for payment addresses:</strong>
                  </p>
                  <div style={{ 
                    backgroundColor: 'white',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6',
                    fontFamily: 'monospace'
                  }}>
                    support@elevatenetwork.com
                  </div>
                  <p style={{ margin: '10px 0 0 0', fontSize: '12px' }}>
                    Reference ID: <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                      {paymentInstructions.referenceId}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Step-by-Step Instructions */}
            <div style={{
              backgroundColor: '#e8f5e8',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '25px',
              border: '1px solid #c3e6c3'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2d5a2d', fontSize: '16px' }}>
                Payment Instructions
              </h4>
              {hasRealPayment ? (
                <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', color: '#2d5a2d' }}>
                  <li>Copy the Bitcoin address above</li>
                  <li><strong>Send exactly {nowPaymentData.pay_amount} BTC</strong> to that address</li>
                  <li>Wait for blockchain confirmation (usually 10-60 minutes)</li>
                  <li>Your investment will be activated automatically</li>
                  <li>You'll receive ${paymentInstructions.expectedReturn.toLocaleString()} at maturity</li>
                </ol>
              ) : (
                <div style={{ color: '#2d5a2d', lineHeight: '1.6' }}>
                  <p style={{ margin: '0 0 10px 0' }}>
                    Contact our support team with your reference ID to receive crypto payment instructions.
                  </p>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    You'll receive ${paymentInstructions.expectedReturn.toLocaleString()} at maturity 
                    (${paymentInstructions.profit.toLocaleString()} profit).
                  </p>
                </div>
              )}
            </div>

            {/* Important Warnings */}
            <div style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '25px'
            }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#721c24', fontSize: '14px' }}>
                Important Warnings:
              </h5>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#721c24', lineHeight: '1.6' }}>
                <li>Send the exact amount shown above</li>
                <li>Use Bitcoin network only (not other networks)</li>
                <li>Double-check the address before sending</li>
                <li>Allow up to 1 hour for confirmation</li>
                <li>Contact support if payment is not confirmed after 2 hours</li>
              </ul>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              I Understand - Close
            </button>
          </div>
        ) : (
          /* Investment Form */
          !success ? (
            <div>
              {/* Campaign Info */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '25px'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '15px'
                }}>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Expected ROI</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#28a745' }}>
                      {campaign.expectedROI}%
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Duration</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#333' }}>
                      {campaign.durationMonths} months
                    </p>
                  </div>
                </div>
                
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e9ecef' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
                    Campaign Progress
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      ${(campaign.raisedAmount || 0).toLocaleString()} raised
                    </span>
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      of ${(campaign.targetAmount || 0).toLocaleString()} goal
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Investment Amount ($)
                  </label>
                  <input
                    type="text"
                    value={investmentAmount}
                    onChange={handleAmountChange}
                    disabled={isSubmitting}
                    placeholder="Enter amount (minimum $10)"
                    style={{
                      width: '100%',
                      padding: '15px',
                      border: error ? '2px solid #dc3545' : '2px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: isSubmitting ? '#f5f5f5' : 'white',
                      fontWeight: '500'
                    }}
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '14px', 
                    color: '#666',
                    fontWeight: '500'
                  }}>
                    Quick amounts:
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    {quickAmountButtons.map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setInvestmentAmount(amount.toString())}
                        disabled={isSubmitting}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: investmentAmount === amount.toString() ? '#007bff' : '#f8f9fa',
                          color: investmentAmount === amount.toString() ? 'white' : '#333',
                          border: '1px solid #e9ecef',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          fontWeight: '500',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ${amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Investment Preview */}
                {amount > 0 && (
                  <div style={{
                    backgroundColor: '#e8f5e8',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    border: '1px solid #c3e6c3'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 15px 0', 
                      color: '#2d5a2d',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>
                      Investment Preview
                    </h4>
                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#2d5a2d' }}>Investment Amount:</span>
                        <span style={{ fontWeight: '600', color: '#2d5a2d' }}>
                          ${amount.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#2d5a2d' }}>Expected Return:</span>
                        <span style={{ fontWeight: '600', color: '#2d5a2d' }}>
                          ${expectedReturn.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px solid #a8d4a8'
                      }}>
                        <span style={{ color: '#2d5a2d', fontWeight: '600' }}>Your Profit:</span>
                        <span style={{ fontWeight: '700', color: '#28a745', fontSize: '16px' }}>
                          +${profit.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ 
                        marginTop: '10px',
                        fontSize: '13px',
                        color: '#2d5a2d',
                        fontStyle: 'italic'
                      }}>
                        Maturity: {campaign.durationMonths} months from investment date
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {error}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      padding: '15px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !investmentAmount || validateAmount()}
                    style={{
                      flex: 2,
                      padding: '15px',
                      backgroundColor: isSubmitting ? '#6c757d' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: isSubmitting || !investmentAmount || validateAmount() ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      opacity: isSubmitting || !investmentAmount || validateAmount() ? 0.7 : 1
                    }}
                  >
                    {isSubmitting ? 'Processing Investment...' : `Invest $${amount.toLocaleString() || '0'}`}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Success Message */
            <div style={{
              textAlign: 'center',
              padding: '40px 20px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: '#28a745',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                fontSize: '24px',
                color: 'white'
              }}>
                ✓
              </div>
              <h3 style={{ 
                margin: '0 0 10px 0', 
                color: '#28a745',
                fontSize: '20px'
              }}>
                Investment Successful!
              </h3>
              <p style={{ 
                margin: '0 0 20px 0', 
                color: '#666',
                lineHeight: '1.5'
              }}>
                {success}
              </p>
              <p style={{ 
                margin: 0, 
                color: '#999',
                fontSize: '14px'
              }}>
                This modal will close automatically...
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default InvestmentModal;