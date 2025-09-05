import React, { useState, useEffect } from 'react';

const MemberProfile = ({ memberData, apiCall, loadDashboardData }) => {
  const [activeSection, setActiveSection] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileData, setProfileData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    nationality: '',
    
    // Address Information
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    
    // Employment Information
    occupation: '',
    employer: '',
    monthlyIncome: '',
    sourceOfIncome: '',
    
    // Banking Information
    bankName: '',
    accountNumber: '',
    accountName: '',
    bvn: '',
    
    // Next of Kin
    nextOfKinName: '',
    nextOfKinRelationship: '',
    nextOfKinPhone: '',
    nextOfKinAddress: '',
    
    // KYC Documents
    profilePicture: null,
    idDocument: null,
    proofOfAddress: null,
    bankStatement: null,
    
    // Verification Status
    profileComplete: false,
    documentsUploaded: false,
    verified: false
  });

  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/users/profile');
      if (response) {
        setProfileData(prev => ({ ...prev, ...response }));
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }
    
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only JPEG, PNG, and PDF files are allowed' });
      return;
    }

    setUploadProgress(prev => ({ ...prev, [field]: 0 }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', field);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[field] || 0;
          if (currentProgress < 90) {
            return { ...prev, [field]: currentProgress + 10 };
          }
          return prev;
        });
      }, 200);

      const response = await fetch('http://localhost:5000/api/users/upload-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      clearInterval(progressInterval);

      if (response.ok) {
        const result = await response.json();
        setProfileData(prev => ({
          ...prev,
          [field]: result.fileUrl
        }));
        setUploadProgress(prev => ({ ...prev, [field]: 100 }));
        setMessage({ type: 'success', text: 'File uploaded successfully' });
        
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[field];
            return newProgress;
          });
        }, 2000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[field];
        return newProgress;
      });
      setMessage({ type: 'error', text: 'File upload failed. Please try again.' });
    }
  };

  const saveSection = async (section) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await apiCall('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          section,
          data: profileData
        })
      });

      if (response) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        loadDashboardData(); // Refresh dashboard data
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const submitForVerification = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/users/submit-kyc', {
        method: 'POST'
      });

      if (response) {
        setMessage({ 
          type: 'success', 
          text: 'KYC documents submitted for verification. You will be notified once approved.' 
        });
        setProfileData(prev => ({ ...prev, documentsUploaded: true }));
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit for verification' });
    } finally {
      setLoading(false);
    }
  };

  const sectionItems = [
    { id: 'personal', label: 'Personal Info', icon: '👤', color: '#3B82F6' },
    { id: 'address', label: 'Address', icon: '🏠', color: '#10B981' },
    { id: 'employment', label: 'Employment', icon: '💼', color: '#F59E0B' },
    { id: 'banking', icon: '🏦', label: 'Banking', color: '#8B5CF6' },
    { id: 'nextofkin', label: 'Next of Kin', icon: '👨‍👩‍👧‍👦', color: '#EF4444' },
    { id: 'documents', label: 'Documents', icon: '📄', color: '#06B6D4' }
  ];

  const FileUploader = ({ field, label, accept, currentFile }) => (
    <div style={{
      border: '2px dashed #E5E7EB',
      borderRadius: '12px',
      padding: '24px',
      textAlign: 'center',
      backgroundColor: '#F9FAFB',
      position: 'relative'
    }}>
      {uploadProgress[field] !== undefined ? (
        <div style={{ padding: '20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>Uploading {label}...</p>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#E5E7EB',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${uploadProgress[field]}%`,
              height: '100%',
              backgroundColor: '#3B82F6',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6B7280' }}>
            {uploadProgress[field]}%
          </p>
        </div>
      ) : currentFile ? (
        <div style={{ padding: '20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#10B981' }}>
            {label} Uploaded
          </p>
          <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
            File uploaded successfully
          </p>
          <button
            onClick={() => document.getElementById(`file-${field}`).click()}
            style={{
              marginTop: '12px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Replace File
          </button>
        </div>
      ) : (
        <div 
          style={{ padding: '20px', cursor: 'pointer' }}
          onClick={() => document.getElementById(`file-${field}`).click()}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
            Upload {label}
          </p>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6B7280' }}>
            Click to browse or drag and drop
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>
            Max 5MB • JPEG, PNG, PDF
          </p>
        </div>
      )}
      
      <input
        id={`file-${field}`}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(field, e.target.files[0])}
      />
    </div>
  );

  const InputField = ({ label, type = 'text', field, placeholder, required = false, options = null }) => (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '6px'
      }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      {options ? (
        <select
          value={profileData[field] || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #E5E7EB',
            borderRadius: '10px',
            fontSize: '16px',
            backgroundColor: 'white',
            outline: 'none'
          }}
        >
          <option value="">{placeholder}</option>
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={profileData[field] || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #E5E7EB',
            borderRadius: '10px',
            fontSize: '16px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      )}
    </div>
  );

  if (loading && !profileData.fullName) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #E5E7EB',
            borderTop: '4px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: '#6B7280' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#1F2937',
          margin: '0 0 8px 0'
        }}>
          Profile & KYC Verification
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#6B7280',
          margin: 0
        }}>
          Complete your profile and upload required documents for account verification
        </p>
      </div>

      {/* Verification Status */}
      <div style={{
        background: profileData.verified ? 
          'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 
          'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '32px' }}>
            {profileData.verified ? '✅' : '⏳'}
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700' }}>
              {profileData.verified ? 'Account Verified' : 'Verification Pending'}
            </h3>
            <p style={{ margin: 0, opacity: 0.9 }}>
              {profileData.verified ? 
                'Your account has been successfully verified' : 
                'Complete all sections and upload documents to get verified'}
            </p>
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>
              {profileData.profileComplete ? '100%' : '60%'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Profile Complete</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>
              {profileData.documentsUploaded ? '4/4' : '0/4'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Documents Uploaded</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>
              {profileData.verified ? 'Approved' : 'Review'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Verification Status</div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div style={{
          backgroundColor: message.type === 'error' ? '#FEE2E2' : '#D1FAE5',
          color: message.type === 'error' ? '#DC2626' : '#065F46',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: `2px solid ${message.type === 'error' ? '#FECACA' : '#A7F3D0'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Section Navigation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '32px'
      }}>
        {sectionItems.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 12px',
              backgroundColor: activeSection === section.id ? `${section.color}15` : 'white',
              border: `2px solid ${activeSection === section.id ? section.color : '#E5E7EB'}`,
              borderRadius: '12px',
              color: activeSection === section.id ? section.color : '#6B7280',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <span style={{ fontSize: '20px' }}>{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid #E5E7EB'
      }}>
        {activeSection === 'personal' && (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', marginBottom: '24px' }}>
              Personal Information
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              <InputField
                label="Full Name"
                field="fullName"
                placeholder="Enter your full name"
                required
              />
              <InputField
                label="Email Address"
                type="email"
                field="email"
                placeholder="Enter your email"
                required
              />
              <InputField
                label="Phone Number"
                type="tel"
                field="phone"
                placeholder="Enter your phone number"
                required
              />
              <InputField
                label="Date of Birth"
                type="date"
                field="dateOfBirth"
                required
              />
              <InputField
                label="Gender"
                field="gender"
                placeholder="Select gender"
                options={['Male', 'Female', 'Other']}
                required
              />
              <InputField
                label="Marital Status"
                field="maritalStatus"
                placeholder="Select marital status"
                options={['Single', 'Married', 'Divorced', 'Widowed']}
              />
              <InputField
                label="Nationality"
                field="nationality"
                placeholder="Enter your nationality"
                required
              />
            </div>
            <button
              onClick={() => saveSection('personal')}
              disabled={loading}
              style={{
                marginTop: '24px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                color: 'white',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Saving...' : 'Save Personal Info'}
            </button>
          </div>
        )}

        {activeSection === 'address' && (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', marginBottom: '24px' }}>
              Address Information
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <InputField
                  label="Street Address"
                  field="address"
                  placeholder="Enter your street address"
                  required
                />
              </div>
              <InputField
                label="City"
                field="city"
                placeholder="Enter your city"
                required
              />
              <InputField
                label="State/Province"
                field="state"
                placeholder="Enter your state"
                required
              />
              <InputField
                label="Country"
                field="country"
                placeholder="Enter your country"
                required
              />
              <InputField
                label="Postal Code"
                field="postalCode"
                placeholder="Enter postal code"
              />
            </div>
            <button
              onClick={() => saveSection('address')}
              disabled={loading}
              style={{
                marginTop: '24px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Saving...' : 'Save Address Info'}
            </button>
          </div>
        )}

        {activeSection === 'employment' && (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', marginBottom: '24px' }}>
              Employment Information
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              <InputField
                label="Occupation"
                field="occupation"
                placeholder="Enter your occupation"
                required
              />
              <InputField
                label="Employer"
                field="employer"
                placeholder="Enter employer name"
              />
              <InputField
                label="Monthly Income"
                field="monthlyIncome"
                placeholder="Select income range"
                options={[
                  'Below ₦50,000',
                  '₦50,000 - ₦100,000',
                  '₦100,000 - ₦250,000',
                  '₦250,000 - ₦500,000',
                  '₦500,000 - ₦1,000,000',
                  'Above ₦1,000,000'
                ]}
                required
              />
              <InputField
                label="Source of Income"
                field="sourceOfIncome"
                placeholder="Select income source"
                options={[
                  'Salary/Wages',
                  'Business/Self-employed',
                  'Investment Returns',
                  'Freelancing',
                  'Other'
                ]}
                required
              />
            </div>
            <button
              onClick={() => saveSection('employment')}
              disabled={loading}
              style={{
                marginTop: '24px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: 'white',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Saving...' : 'Save Employment Info'}
            </button>
          </div>
        )}

        {activeSection === 'banking' && (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', marginBottom: '24px' }}>
              Banking Information
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              <InputField
                label="Bank Name"
                field="bankName"
                placeholder="Enter your bank name"
                required
              />
              <InputField
                label="Account Number"
                field="accountNumber"
                placeholder="Enter account number"
                required
              />
              <InputField
                label="Account Name"
                field="accountName"
                placeholder="Enter account holder name"
                required
              />
              <InputField
                label="BVN (Bank Verification Number)"
                field="bvn"
                placeholder="Enter your BVN"
                required
              />
            </div>
            <button
              onClick={() => saveSection('banking')}
              disabled={loading}
              style={{
                marginTop: '24px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                color: 'white',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Saving...' : 'Save Banking Info'}
            </button>
          </div>
        )}

        {activeSection === 'nextofkin' && (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', marginBottom: '24px' }}>
              Next of Kin Information
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              <InputField
                label="Next of Kin Full Name"
                field="nextOfKinName"
                placeholder="Enter full name"
                required
              />
              <InputField
                label="Relationship"
                field="nextOfKinRelationship"
                placeholder="Select relationship"
                options={['Spouse', 'Father', 'Mother', 'Sibling', 'Child', 'Friend', 'Other']}
                required
              />
              <InputField
                label="Phone Number"
                type="tel"
                field="nextOfKinPhone"
                placeholder="Enter phone number"
                required
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <InputField
                  label="Address"
                  field="nextOfKinAddress"
                  placeholder="Enter complete address"
                  required
                />
              </div>
            </div>
            <button
              onClick={() => saveSection('nextofkin')}
              disabled={loading}
              style={{
                marginTop: '24px',
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: 'white',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Saving...' : 'Save Next of Kin Info'}
            </button>
          </div>
        )}

        {activeSection === 'documents' && (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', marginBottom: '24px' }}>
              KYC Documents
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginBottom: '32px'
            }}>
              <FileUploader
                field="profilePicture"
                label="Profile Picture"
                accept="image/jpeg,image/png"
                currentFile={profileData.profilePicture}
              />
              <FileUploader
                field="idDocument"
                label="Valid ID Document"
                accept="image/jpeg,image/png,application/pdf"
                currentFile={profileData.idDocument}
              />
              <FileUploader
                field="proofOfAddress"
                label="Proof of Address"
                accept="image/jpeg,image/png,application/pdf"
                currentFile={profileData.proofOfAddress}
              />
              <FileUploader
                field="bankStatement"
                label="Bank Statement"
                accept="application/pdf"
                currentFile={profileData.bankStatement}
              />
            </div>

            <div style={{
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontWeight: '600' }}>Document Requirements:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Profile Picture: Clear headshot photo</li>
                <li>Valid ID: National ID, Driver's License, or Passport</li>
                <li>Proof of Address: Utility bill or bank statement (not older than 3 months)</li>
                <li>Bank Statement: Recent statement showing account details</li>
              </ul>
            </div>

            <button
              onClick={submitForVerification}
              disabled={loading || profileData.documentsUploaded}
              style={{
                background: profileData.documentsUploaded ? 
                  '#9CA3AF' : 
                  'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                color: 'white',
                border: 'none',
                padding: '16px 40px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: profileData.documentsUploaded ? 'not-allowed' : 'pointer',
                boxShadow: profileData.documentsUploaded ? 'none' : '0 4px 14px rgba(6, 182, 212, 0.3)'
              }}
            >
              {loading ? 'Submitting...' : profileData.documentsUploaded ? 'Documents Submitted' : 'Submit for Verification'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberProfile;