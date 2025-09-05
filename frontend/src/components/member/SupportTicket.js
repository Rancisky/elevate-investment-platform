import React, { useState, useEffect } from 'react';

const SupportTicket = () => {
  const [activeView, setActiveView] = useState('create');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'General Inquiry',
    priority: 'Medium'
  });

  // Fetch user's tickets
  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/support/my-tickets', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit new ticket
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/support/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert('Support ticket created successfully! We will respond within 24 hours.');
        setFormData({
          subject: '',
          message: '',
          category: 'General Inquiry',
          priority: 'Medium'
        });
        fetchMyTickets();
        setActiveView('my-tickets');
      } else {
        alert('Failed to create ticket. Please try again.');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Error creating ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'my-tickets') {
      fetchMyTickets();
    }
  }, [activeView]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: 0, color: '#333' }}>Support Center</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveView('create')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeView === 'create' ? '#007bff' : 'white',
              color: activeView === 'create' ? 'white' : '#666',
              border: '2px solid #007bff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Create Ticket
          </button>
          <button
            onClick={() => setActiveView('my-tickets')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeView === 'my-tickets' ? '#007bff' : 'white',
              color: activeView === 'my-tickets' ? 'white' : '#666',
              border: '2px solid #007bff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            My Tickets
          </button>
        </div>
      </div>

      {activeView === 'create' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          maxWidth: '600px'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>Create Support Ticket</h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="General Inquiry">General Inquiry</option>
                <option value="Loan Application">Loan Application</option>
                <option value="Campaign Proposal">Campaign Proposal</option>
                <option value="Investment Issue">Investment Issue</option>
                <option value="Payment Issue">Payment Issue</option>
                <option value="Account Access">Account Access</option>
                <option value="Technical Support">Technical Support</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Subject *
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Brief description of your issue"
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Message *
              </label>
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
                placeholder="Please provide detailed information about your inquiry or issue..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: loading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating Ticket...' : 'Create Support Ticket'}
            </button>
          </form>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: '600', color: '#333' }}>
              Response Times:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '14px' }}>
              <li>High Priority: Within 4 hours</li>
              <li>Medium Priority: Within 24 hours</li>
              <li>Low Priority: Within 48 hours</li>
            </ul>
          </div>
        </div>
      )}

      {activeView === 'my-tickets' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>My Support Tickets</h3>
          
          {loading ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
              Loading your tickets...
            </p>
          ) : tickets.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>
                      ID
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>
                      Subject
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>
                      Category
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e9ecef' }}>
                      Priority
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e9ecef' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e9ecef' }}>
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>#{ticket.id}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ maxWidth: '200px' }}>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                            {ticket.subject}
                          </p>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>{ticket.category}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: ticket.priority === 'High' ? '#f8d7da' :
                                          ticket.priority === 'Medium' ? '#fff3cd' : '#d4edda',
                          color: ticket.priority === 'High' ? '#721c24' :
                                 ticket.priority === 'Medium' ? '#856404' : '#155724'
                        }}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: ticket.status === 'Open' ? '#f8d7da' :
                                          ticket.status === 'In Review' ? '#fff3cd' : '#d4edda',
                          color: ticket.status === 'Open' ? '#721c24' :
                                 ticket.status === 'In Review' ? '#856404' : '#155724'
                        }}>
                          {ticket.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                        {ticket.createdAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                You haven't created any support tickets yet.
              </p>
              <button
                onClick={() => setActiveView('create')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Create Your First Ticket
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupportTicket;