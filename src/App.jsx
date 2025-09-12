import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, LogOut, Plus, Trash2, Edit } from 'lucide-react';
import './index.css';

// The main App component that controls the application's state and views.
const App = () => {
  const [view, setView] = useState('auth'); // 'auth' or 'dashboard'
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isModalOpen, setIsModalOpen] = useState(false); const [currentPayment, setCurrentPayment] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const API_URL = 'http://localhost:5000/api';

  // Custom function to handle API calls with authorization
  const apiCall = async (endpoint, method, body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || 'An error occurred';
      throw new Error(errorMessage);
    }
    return data;
  };

  // Effect to fetch payments when the component mounts or the token changes
  useEffect(() => {
    if (token) {
      setView('dashboard');
      fetchPayments();
    } else {
      setView('auth');
    }
  }, [token]);

  // Handler for login and registration
  const handleAuth = async (endpoint, formData) => {
    setIsAuthLoading(true);
    try {
      const data = await apiCall(`/users/${endpoint}`, 'POST', formData);
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        showMessage('Login successful!', 'success');
      } else {
        showMessage('Registration successful! Please log in.', 'success');
      }
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setPayments([]);
    showMessage('You have been logged out.', 'success');
    setView('auth');
  };

  // Payment CRUD handlers
  const fetchPayments = async () => {
    try {
      const data = await apiCall('/payments', 'GET');
      setPayments(data);
    } catch (error) {
      showMessage(`Failed to fetch payments: ${error.message}`, 'error');
    }
  };

  const addPayment = async (formData) => {
    try {
      await apiCall('/payments', 'POST', formData);
      showMessage('Payment added successfully!', 'success');
      fetchPayments();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const updatePayment = async (id, formData) => {
    try {
      await apiCall(`/payments/${id}`, 'PUT', formData);
      showMessage('Payment updated successfully!', 'success');
      setIsModalOpen(false);
      fetchPayments();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const deletePayment = async (id) => {
    try {
      await apiCall(`/payments/${id}`, 'DELETE');
      showMessage('Payment deleted successfully!', 'success');
      fetchPayments();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  // Utility to show messages
  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Components for different views
  const AuthView = ({ onLogin, onRegister, isLoading }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({});

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (isLogin) {
        onLogin(formData);
      } else {
        onRegister(formData);
      }
    };

    return (
      <div className="auth-container">
        <h1 className="title">{isLogin ? 'Login' : 'Register'}</h1>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="form-label">First Name</label>
                  <input type="text" name="firstName" className="form-input" required onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="lastName" className="form-label">Last Name</label>
                  <input type="text" name="lastName" className="form-input" required onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="dateOfBirth" className="form-label">Date of Birth</label>
                <input type="date" name="dateOfBirth" className="form-input" required onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                <input type="tel" name="phoneNumber" className="form-input" required onChange={handleChange} />
              </div>
            </>
          )}
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input type="email" name="email" className="form-input" required onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input type="password" name="password" className="form-input" required onChange={handleChange} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              <>
                {isLogin ? <><LogIn size={18} /> Login</> : <><UserPlus size={18} /> Register</>}
              </>
            )}
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <a href="#" className="text-indigo-600 font-medium hover:underline" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Register here.' : 'Login here.'}
          </a>
        </p>
      </div>
    );
  };

  const DashboardView = ({ payments, onAddPayment, onUpdatePayment, onDeletePayment, onLogout }) => {
    const [formData, setFormData] = useState({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState(null);

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddSubmit = (e) => {
      e.preventDefault();
      onAddPayment(formData);
      setFormData({});
    };

    const openDeleteModal = (paymentId) => {
      setPaymentToDelete(paymentId);
      setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
      if (paymentToDelete) {
        onDeletePayment(paymentToDelete);
        setIsDeleteModalOpen(false);
        setPaymentToDelete(null);
      }
    };
    
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h2 className="title">Payments Dashboard</h2>
          <button className="btn btn-secondary btn-icon" onClick={onLogout}>
            <LogOut size={18} /> Logout
          </button>
        </header>

        <div className="form-section">
          <h3 className="section-title">Add New Payment</h3>
          <form onSubmit={handleAddSubmit} className="grid-cols-2">
            <div>
              <label className="form-label">Card Number</label>
              <input type="text" name="cardNumber" value={formData.cardNumber || ''} className="form-input" required onChange={handleChange} />
            </div>
            <div>
              <label className="form-label">Card Holder Name</label>
              <input type="text" name="cardHolderName" value={formData.cardHolderName || ''} className="form-input" required onChange={handleChange} />
            </div>
            <div>
              <label className="form-label">Expiry Date (MM/YY)</label>
              <input type="text" name="expiryDate" value={formData.expiryDate || ''} className="form-input" required onChange={handleChange} />
            </div>
            <div>
              <label className="form-label">CVV</label>
              <input type="text" name="cvv" value={formData.cvv || ''} className="form-input" required onChange={handleChange} />
            </div>
            <div className="col-span-2">
              <button type="submit" className="btn btn-primary btn-icon">
                <Plus size={18} /> Add Payment
              </button>
            </div>
          </form>
        </div>

        <div className="payments-list-section">
          <h3 className="section-title">Your Payments</h3>
          <div className="payments-list">
            {payments.length > 0 ? (
              payments.map(payment => (
                <div key={payment._id} className="payment-item">
                  <div className="payment-info">
                    <p className="payment-card-number">{payment.cardHolderName}</p>
                    <p>Card: **** **** **** {payment.cardNumber.slice(-4)}</p>
                    <p>Expires: {payment.expiryDate}</p>
                  </div>
                  <div className="payment-actions">
                    <button className="btn btn-edit" onClick={() => onUpdatePayment(payment)}>
                      <Edit size={16} /> Edit
                    </button>
                    <button className="btn btn-delete" onClick={() => openDeleteModal(payment._id)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-payments-message">No payments found.</p>
            )}
          </div>
        </div>
        
        {isDeleteModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">Confirm Deletion</h3>
              <p className="modal-text">Are you sure you want to delete this payment record? This action cannot be undone.</p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                <button className="btn btn-delete" onClick={handleDeleteConfirm}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const UpdatePaymentModal = ({ isOpen, payment, onClose, onUpdate }) => {
    const [formData, setFormData] = useState(payment || {});

    useEffect(() => {
      setFormData(payment || {});
    }, [payment]);

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onUpdate(formData._id, formData);
    };

    if (!isOpen || !payment) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3 className="modal-title">Update Payment</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Card Number</label>
              <input type="text" name="cardNumber" value={formData.cardNumber} className="form-input" required onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Card Holder Name</label>
              <input type="text" name="cardHolderName" value={formData.cardHolderName} className="form-input" required onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date (MM/YY)</label>
              <input type="text" name="expiryDate" value={formData.expiryDate} className="form-input" required onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">CVV</label>
              <input type="text" name="cvv" value={formData.cvv} className="form-input" required onChange={handleChange} />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Update</button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const MessageToast = ({ text, type }) => {
    if (!text) return null;
    return (
      <div className={`message-toast ${type} show-toast`}>
        {text}
      </div>
    );
  };

  return (
    <div className="app">
      <MessageToast text={message.text} type={message.type} />
      {view === 'auth' ? (
        <AuthView
          onLogin={(data) => handleAuth('login', data)}
          onRegister={(data) => handleAuth('register', data)}
          isLoading={isAuthLoading}
        />
      ) : (
        <DashboardView
          payments={payments}
          onAddPayment={addPayment}
          onUpdatePayment={(payment) => {
            setCurrentPayment(payment);
            setIsModalOpen(true);
          }}
          onDeletePayment={deletePayment}
          onLogout={handleLogout}
        />
      )}
      <UpdatePaymentModal
        isOpen={isModalOpen}
        payment={currentPayment}
        onClose={() => setIsModalOpen(false)}
        onUpdate={updatePayment}
      />
    </div>
  );
};

export default App;
