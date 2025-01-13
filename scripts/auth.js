// Auth Modal Controller
const AuthModal = {
    init() {
        this.modal = document.getElementById('auth-modal');
        this.loginContainer = document.getElementById('login-form-container');
        this.registerContainer = document.getElementById('register-form-container');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Toggle form visibility
        document.getElementById('login-btn').addEventListener('click', () => this.showModal('login'));
        document.getElementById('register-btn').addEventListener('click', () => this.showModal('register'));
        
        // Close modal
        document.querySelector('.close-modal').addEventListener('click', () => this.hideModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hideModal();
        });

        // Switch between forms
        document.getElementById('switch-to-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('register');
        });
        document.getElementById('switch-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('login');
        });

        // Form submissions
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    },

    showModal(formType = 'login') {
        this.modal.classList.add('visible');
        this.switchForm(formType);
        document.body.style.overflow = 'hidden';
    },

    hideModal() {
        this.modal.classList.remove('visible');
        document.body.style.overflow = '';
        this.clearMessages();
        this.loginForm.reset();
        this.registerForm.reset();
    },

    switchForm(formType) {
        this.loginContainer.classList.toggle('active', formType === 'login');
        this.registerContainer.classList.toggle('active', formType === 'register');
        this.clearMessages();
    },

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('.submit-btn');
        
        try {
            this.setLoading(submitBtn, true);
            
            const formData = {
                email: form.querySelector('#login-email').value,
                password: form.querySelector('#login-password').value
            };

            // Use your existing login logic here
            const success = await this.loginUser(formData);
            
            if (success) {
                this.showMessage('login-message', 'Login successful!', 'success');
                setTimeout(() => this.hideModal(), 1500);
            } else {
                this.showMessage('login-message', 'Invalid credentials', 'error');
            }
        } catch (error) {
            this.showMessage('login-message', 'An error occurred', 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('.submit-btn');
        
        try {
            this.setLoading(submitBtn, true);
            
            const formData = {
                username: form.querySelector('#register-username').value,
                firstName: form.querySelector('#register-firstname').value,
                lastName: form.querySelector('#register-lastname').value,
                email: form.querySelector('#register-email').value,
                password: form.querySelector('#register-password').value
            };

            // Use your existing register logic here
            const success = await this.registerUser(formData);
            
            if (success) {
                this.showMessage('register-message', 'Registration successful!', 'success');
                setTimeout(() => this.switchForm('login'), 1500);
            } else {
                this.showMessage('register-message', 'Registration failed', 'error');
            }
        } catch (error) {
            this.showMessage('register-message', 'An error occurred', 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    },

    
 
  
  async login(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("https://backend-3mvr.onrender.com/api/auth/login", {
        ...fetchConfig,  // Use the base config
      method: "POST",
      body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        showNotification('Login successful!', 'success');
        uiManager.closeLogin();
        window.location.reload();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      showNotification(error.message, 'error');
    }
  },

  
async register(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const firstname = document.getElementById("firstname").value;
    const lastname = document.getElementById("lastname").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;

    try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/auth/register', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, firstname, lastname, email, password }),
      });

      if (response.ok) {
        showNotification('Registration successful!', 'success');
        uiManager.closeRegister();
        window.location.href = "index.html";
      } else {
        const data = await response.json();
        showNotification(data.message, 'error');
      }
    } catch (error) {
      showNotification(error.message, 'error');
    }
  },

    setLoading(button, isLoading) {
        button.classList.toggle('loading', isLoading);
        button.disabled = isLoading;
    },

    showMessage(elementId, text, type) {
        const messageEl = document.getElementById(elementId);
        messageEl.textContent = text;
        messageEl.className = `message ${type} visible`;
    },

    clearMessages() {
        document.querySelectorAll('.message').forEach(el => {
            el.className = 'message';
            el.textContent = '';
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AuthModal.init();
});