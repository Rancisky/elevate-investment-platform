import React, { useState } from 'react';
import StatCard from '../shared/StatCard';

const LoanManagement = () => {
  // Sample loan-eligible members (updated with USD values)
  const members = [
    {
      id: 'ELV10001',
      name: 'John Doe',
      email: 'john@email.com',
      directReferrals: 52,
      totalDonations: 3000,
      loanEligible: true
    },
    {
      id: 'ELV10003',
      name: 'Mike Chen',
      email: 'mike@email.com',
      directReferrals: 67,
      totalDonations: 3750,
      loanEligible: true
    },
    {
      id: 'ELV10004',
      name: 'Grace Adebayo',
      email: 'grace@email.com',
      directReferrals: 78,
      totalDonations: 5250,
      loanEligible: true
    }
  ];

  // Support tickets state
  const [supportTickets, setSupportTickets] = useState([
    {
      id: 1,
      memberId: 'ELV10001',
      memberName: 'John Doe',
      email: 'john@email.com',
      subject: 'Loan Application Inquiry',
      message: 'I would like to know the current interest rates and repayment terms for loans.',
      category: 'Loan Inquiry',
      status: 'Open',
      priority: 'Medium',
      createdAt: '2025-08-25',
      updatedAt: '2025-08-25'
    },
    {
      id: 2,
      memberId: 'ELV10003',
      memberName: 'Mike Chen',
      email: 'mike@email.com',
      subject: 'Campaign Proposal: Tech Startup',
      message: 'I have a proposal for a new tech startup campaign with 150% ROI potential over 8 months.',
      category: 'Campaign Proposal',
      status: 'In Review',
      priority: 'High',
      createdAt: '2025-08-24',
      updatedAt: '2025-08-26'
    },
    {
      id: 3,
      memberId: 'ELV10004',
      memberName: 'Grace Adebayo',
      email: 'grace@email.com',
      subject: 'Account Access Issue',
      message: 'Having trouble accessing my dashboard. Please help resolve this issue.',
      category: 'Technical Support',
      status: 'Resolved',
      priority: 'High',
      createdAt: '2025-08-23',
      updatedAt: '2025-08-27'
    }
  ]);

  const [activeView, setActiveView] = useState('loans');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const stats = {
    eligibleMembers: members.filter(m => m.loanEligible).length,
    pendingApplications: 15,
    activeLoans: 12,
    totalDisbursed: 112500 // $112,500
  };

  // Support ticket stats
  const ticketStats = {
    totalTickets: supportTickets.length,
    openTickets: supportTickets.filter(t => t.status === 'Open').length,
    inReviewTickets: supportTickets.filter(t => t.status === 'In Review').length,
    resolvedTickets: supportTickets.filter(t => t.status === 'Resolved').length
  };

  // Update ticket status
  const updateTicketStatus = (ticketId, newStatus) => {
    setSupportTickets(prev => prev.map(ticket =>
      ticket.id === ticketId
        ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] }
        : ticket
    ));
    setShowTicketModal(false);
    setSelectedTicket(null);
  };

  // Support Ticket Modal
  const TicketModal = () => {
    if (!selectedTicket) return null;

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
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: 0, color: '#333' }}>Support Ticket #{selectedTicket.id}</h2>
            <button
              onClick={() => { setShowTicketModal(false); setSelectedTicket(null); }}
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

          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div>
                <strong>Member:</strong> {selectedTicket.memberName}
              </div>
              <div>
                <strong>Email:</strong> {selectedTicket.email}
              </div>
              <div>
                <strong>Category:</strong> {selectedTicket.category}
              </div>
              <div>
                <strong>Priority:</strong>
                <span style={{
                  marginLeft: '5px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  backgroundColor: selectedTicket.priority === 'High' ? '#f8d7da' :
                                  selectedTicket.priority === 'Medium' ? '#fff3cd' : '#d4edda',
                  color: selectedTicket.priority === 'High' ? '#721c24' :
                         selectedTicket.priority === 'Medium' ? '#856404' : '#155724'
                }}>
                  {selectedTicket.priority}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Subject:</strong> {selectedTicket.subject}
            </div>

            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <strong>Message:</strong>
              <p style={{ margin: '10px 0 0 0' }}>{selectedTicket.message}</p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#666'
            }}>
              <div>Created: {selectedTicket.createdAt}</div>
              <div>Updated: {selectedTicket.updatedAt}</div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end'
          }}>
            {selectedTicket.status !== 'Resolved' && (
              <>
                {selectedTicket.status === 'Open' && (
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, 'In Review')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#ffc107',
                      color: '#212529',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Mark as In Review
                  </button>
                )}
                <button
                  onClick={() => updateTicketStatus(selectedTicket.id, 'Resolved')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Mark as Resolved
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ marginBottom: '30px', color: '#333' }}>Loan Management & Support</h2>
      
      {/* View Toggle */}
      <div style={{
        display: 'flex',
        marginBottom: '30px',
        gap: '10px'
      }}>
        <button
          onClick={() => setActiveView('loans')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeView === 'loans' ? '#007bff' : 'white',
            color: activeView === 'loans' ? 'white' : '#666',
            border: '2px solid #007bff',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Loan Management
        </button>
        <button
          onClick={() => setActiveView('support')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeView === 'support' ? '#007bff' : 'white',
            color: activeView === 'support' ? 'white' : '#666',
            border: '2px solid #007bff',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Support Tickets
        </button>
      </div>

      {activeView === 'loans' && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <StatCard
              title="Eligible Members"
              value={stats.eligibleMembers}
              color="#28a745"
              icon="✅"
            />
            <StatCard
              title="Pending Applications"
              value={stats.pendingApplications}
              color="#fd7e14"
              icon="📋"
            />
            <StatCard
              title="Active Loans"
              value={stats.activeLoans}
              color="#007bff"
              icon="🏦"
            />
            <StatCard
              title="Total Disbursed"
              value={stats.totalDisbursed}
              color="#6f42c1"
              icon="💸"
            />
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Loan Eligible Members</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Member</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Referrals</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Donations</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Max Loan Amount</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e9ecef' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {members.filter(m => m.loanEligible).map((member) => (
                    <tr key={member.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                      <td style={{ padding: '12px' }}>
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>{member.name}</p>
                          <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>{member.id}</p>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ color: '#28a745', fontWeight: '600' }}>
                          {member.directReferrals}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ color: '#28a745', fontWeight: '600' }}>
                          ${member.totalDonations.toLocaleString()}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ color: '#007bff', fontWeight: '600' }}>
                          ${(member.totalDonations * 0.8).toLocaleString()}
                        </span>
                        <div style={{ fontSize: '12px', color: '#666' }}>80% of donations</div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button style={{
                          padding: '6px 12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Updated Loan Requirements</h3>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
                <li style={{ marginBottom: '8px' }}>Member must have 50 direct referrals on first level</li>
                <li style={{ marginBottom: '8px' }}>Member must have donated a total of $1,300 or more</li>
                <li style={{ marginBottom: '8px' }}>Maximum loan amount is 80% of total donations made</li>
                <li style={{ marginBottom: '8px' }}>All loans are subject to admin approval</li>
                <li>Interest rates and repayment terms are determined per application</li>
              </ul>
            </div>
          </div>
        </>
      )}

      {activeView === 'support' && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <StatCard
              title="Total Tickets"
              value={ticketStats.totalTickets}
              color="#007bff"
              icon="🎫"
            />
            <StatCard
              title="Open Tickets"
              value={ticketStats.openTickets}
              color="#dc3545"
              icon="📋"
            />
            <StatCard
              title="In Review"
              value={ticketStats.inReviewTickets}
              color="#ffc107"
              icon="👀"
            />
            <StatCard
              title="Resolved"
              value={ticketStats.resolvedTickets}
              color="#28a745"
              icon="✅"
            />
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Support Tickets</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Member</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Subject</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e9ecef' }}>Priority</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e9ecef' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e9ecef' }}>Created</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e9ecef' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {supportTickets.map((ticket) => (
                    <tr key={ticket.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>#{ticket.id}</td>
                      <td style={{ padding: '12px' }}>
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>{ticket.memberName}</p>
                          <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>{ticket.memberId}</p>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ maxWidth: '200px' }}>
                          <p style={{ margin: 0, fontSize: '14px' }}>{ticket.subject}</p>
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
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowTicketModal(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Support Ticket Modal */}
      {showTicketModal && <TicketModal />}
    </div>
  );
};

export default LoanManagement;