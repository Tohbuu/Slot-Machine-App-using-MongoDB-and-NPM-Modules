// Token management utilities
const auth = {
  // Store JWT token in localStorage
  storeToken(token) {
    localStorage.setItem('token', token);
  },

  // Get stored JWT token
  getToken() {
    return localStorage.getItem('token');
  },

  // Remove JWT token (logout)
  removeToken() {
    localStorage.removeItem('token');
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  },

  // Register new user
  async register(username, email, password) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    if (!response.ok) {
      throw new Error('Registration failed');
    }
    
    const data = await response.json();
    
    if (data.success && data.token) {
      this.storeToken(data.token);
      return data;
    }
    
    throw new Error(data.error || 'Registration failed');
  },

  // Login user
  async login(username, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    
    if (data.success && data.token) {
      this.storeToken(data.token);
      return data;
    }
    
    throw new Error(data.error || 'Login failed');
  },

  // Get current user
  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;
    
    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      this.removeToken();
      return null;
    }
    
    return await response.json();
  }
};

// Form handling utilities
const authForms = {
  // Handle login form submission
  async handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
      const { username, password } = form.elements;
      const data = await auth.login(username.value, password.value);
      
      if (data.success) {
        window.location.href = '/';
      }
    } catch (err) {
      this.showError(err.message || 'Login failed. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  },

  // Handle registration form submission
  async handleRegister(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    try {
      const { username, email, password } = form.elements;
      const data = await auth.register(username.value, email.value, password.value);
      
      if (data.success) {
        window.location.href = '/';
      }
    } catch (err) {
      this.showError(err.message || 'Registration failed. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  },

  // Show error message with fade animation
  showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    errorEl.style.color = '#ff4444';
    errorEl.style.marginTop = '10px';
    errorEl.style.textAlign = 'center';
    errorEl.style.padding = '10px';
    errorEl.style.borderRadius = '5px';
    errorEl.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
    errorEl.style.opacity = '0';
    errorEl.style.transition = 'opacity 0.3s ease';

    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();

    const form = document.querySelector('.auth-card form');
    if (form) {
      form.appendChild(errorEl);
      
      // Trigger fade in
      setTimeout(() => {
        errorEl.style.opacity = '1';
      }, 10);

      // Auto-hide after 5 seconds
      setTimeout(() => {
        errorEl.style.opacity = '0';
        setTimeout(() => {
          errorEl.remove();
        }, 300);
      }, 5000);
    }
  },

  // Initialize auth forms
  init() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    if (registerForm) registerForm.addEventListener('submit', (e) => this.handleRegister(e));
  }
};

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.auth-card')) {
    authForms.init();
  }
});

// Export for module use if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { auth, authForms };
}