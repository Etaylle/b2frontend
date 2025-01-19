// Global state
const DEFAULT_USER_ID = '999999';
const BACKEND_URL = '';
let currentUser;
let cart = {};
let products = [];
//let categories = [];
let productStocks = {};
let logo2;
let data = {};
let cryptoPricesEnabled = false;
let cryptoRates = {
  BTC: 0,
  ETH: 0
};
const fetchConfig = {
  credentials: 'include',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  mode: 'cors' 
};
// Updated post config
const createPostConfig = (data) => ({
  ...fetchConfig,
  method: 'POST',
  body: JSON.stringify(data)
});
async function ensureGuestSession() {
  try {
    const response = await fetch('https://backend-3mvr.onrender.com/api/guest-login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'guest@example.com',
        password: 'not_accessible'
      })
    });
    return response.ok;
  } catch (error) {
    console.error('Error ensuring guest session:', error);
    return false;
  }
};

//CartManager
const CartEnhancements = {
  initializeGuestMode() {
    // Set guest user ID in localStorage for persistence
    if (!localStorage.getItem('guestId')) {
      localStorage.setItem('guestId', '999999');
    }
    
    // Enhance all fetch requests with guest header
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      if (args[0].includes('backend-3mvr.onrender.com/api/')) {
        const options = args[1] || {};
        options.headers = {
          ...options.headers,
          'X-Guest-User': localStorage.getItem('guestId')
        };
        args[1] = options;
      }
      return originalFetch.apply(this, args);
    };
  },

  async setupGuestSession() {
    try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/guest-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          username: 'guest_user',
          password: 'not_accessible'
        })
      });
      
      if (response.ok) {
        localStorage.setItem('isGuest', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Guest session setup failed:', error);
      return false;
    }
  }
};

// Initialize guest mode
document.addEventListener('DOMContentLoaded', () => {
  CartEnhancements.initializeGuestMode();
  
  // Modify checkout button behavior
  const checkoutBtn = document.getElementById('checkout-button');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!currentUser) {
        await enhancedPaymentManager.initiateGuestCheckout();
      } else {
        await paymentManager.initiateCheckout();
      }
    });
  }
});
// Cart state management
const cartManager = {

  async fetchCart() {
    if (!currentUser) {
    await ensureGuestSession();
  }
    try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/cart', {
        ...fetchConfig,
        credentials: 'include',
        headers: {
          ...fetchConfig.headers,
          'X-Guest-User': !currentUser ? DEFAULT_USER_ID : undefined
        }
      });
      
      if (!response.ok) {
        return { items: [], total: 0 };
      }
      const data = await response.json();
      return data.cart;
    } catch (error) {
      console.error('Error fetching cart:', error);
      return { items: [], total: 0 };
    }
  },

  // async addItem(productId) {
  //   if (!currentUser) {
  //   await ensureGuestSession();
  // }try {
  //     const response = await fetch('https://backend-3mvr.onrender.com/api/cart/add', {
  //       method: 'POST',
  //       credentials: 'include',
  //       headers: {
  //         ...fetchConfig.headers,
  //         'X-Guest-User': !currentUser ? DEFAULT_USER_ID : undefined
  //       },
  //       body: JSON.stringify({ productId, quantity: 1 })
  //     });

  //     if (!response.ok) throw new Error('Failed to add to cart');
  //     await this.updateDisplay();
  //     showNotification('Added to cart!', 'success');
  //   } catch (error) {
  //     console.error('Error:', error);
  //     showNotification('Out of stock!', 'error');
  //   }
  // },
async addItem(productId) {
  try {
    // First ensure guest session
    if (!currentUser) {
      const guestLoginResponse = await fetch('https://backend-3mvr.onrender.com/api/guest-login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'guest@example.com',
          password: 'not_accessible'
        })
        
      });
      
      if (!guestLoginResponse.ok) {
        throw new Error('Guest login failed');
      }
    }

    // Then try to add to cart
    const response = await fetch('https://backend-3mvr.onrender.com/api/cart/add', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-User': !currentUser ? '999999' : undefined
      },
      body: JSON.stringify({ productId, quantity: 1 })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add to cart');
    }

    await this.updateDisplay();
    showNotification('Added to cart!', 'success');
  } catch (error) {
    console.error('Error:', error);
    showNotification(error.message || 'Out of stock!', 'error');
  }
},
  async removeItem(productId) {
    if (!currentUser) {
    await ensureGuestSession();
  }try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/cart/remove', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'X-Guest-User': !currentUser ? DEFAULT_USER_ID : undefined
        },
        body: JSON.stringify({ productId }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to remove item');
      await this.updateDisplay();
      showNotification('Item removed from cart', 'success');
    } catch (error) {
      console.error('Error:', error);
      showNotification('Failed to remove item', 'error');
    }
  },

  async completePurchase() {
    if (!currentUser) {
    await ensureGuestSession();
  }try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/cart/complete-purchase', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-User': !currentUser ? DEFAULT_USER_ID : undefined
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      await this.clearCart(true);
      return true;
    } catch (error) {
      console.error('Error completing purchase:', error);
      showNotification(error.message || 'Failed to complete purchase', 'error');
      return false;
    }
  
  },
  async updateQuantity(productId, quantity) {

    if (!currentUser) {
    await ensureGuestSession();
  }try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to update quantity');
      await this.updateDisplay();
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification('Failed to update quantity', 'error');
    }
  },
    async clearCart(afterPurchase = false) {
      if (!currentUser) {
    await ensureGuestSession();
  }try {
        const response = await fetch('https://backend-3mvr.onrender.com/api/cart/clear', {
          method: 'DELETE',
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ afterPurchase })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message);
        }

        const result = await response.json();

        // Update the UI
        const cartContainer = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');

        if (cartContainer) {
          cartContainer.innerHTML = '<li>Your cart is empty</li>';
          cartContainer.classList.add('hidden');
        }

        if (cartTotal) {
          cartTotal.textContent = 'Total: 0';
        }

        showNotification(afterPurchase ? 'Purchase completed successfully!' : 'Cart cleared successfully!', 'success');
      } catch (error) {
        console.error('Error clearing cart:', error);
        showNotification(error.message || 'Failed to clear cart', 'error');
      }
    },
    async updateDisplay() {
    const cart = await this.fetchCart();
    const cartContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    cartContainer.innerHTML = '';

    if (!cart.items || cart.items.length === 0) {
      cartContainer.innerHTML = '<li>Your cart is empty</li>';
      cartTotal.textContent = 'Total: 0';
      cartContainer.classList.add('hidden');
      return;
    }

    cartContainer.classList.remove('hidden');
    let total = 0;

    cart.items.forEach(item => {
      const listItem = document.createElement('li');
      listItem.className = 'cart-item';

      const imageUrl = item.images?.[0] || item.image_url || '/images/1.jpg';
      const productName = item.name || 'Unknown Product';
      const productPrice = item.price || 0;
      const productId = item.product_id;

      listItem.innerHTML = `
      <img src="${imageUrl}" alt="${productName}" class="cart-item-image">
      <div class="cart-item-details">
        <span class="item-name">${productName} | </span>
        <span class="item-price">${parseFloat(productPrice).toFixed(2)} $ |</span>
        <span class="item-quantity">${i18nManager.translate('ui.labels.quantity')}: ${item.quantity}</span>
      </div>
      <div class="cart-item-controls">
        <button class="quantity-btn minus" data-id="${productId}" title="${i18nManager.translate('ui.tooltips.decreaseQuantity')}" aria-label="${i18nManager.translate('ui.ariaLabels.decreaseQuantity')}">-</button>
        <button class="quantity-btn plus" data-id="${productId}" title="${i18nManager.translate('ui.tooltips.increaseQuantity')}" aria-label="${i18nManager.translate('ui.ariaLabels.increaseQuantity')}">+</button>
        <button class="remove-btn" data-id="${productId}" title="${i18nManager.translate('ui.tooltips.removeItem')}" aria-label="${i18nManager.translate('ui.ariaLabels.removeItem')}">${i18nManager.translate('ui.buttons.removeItem')}</button>
      </div>
    `;


      cartContainer.appendChild(listItem);
      total += productPrice * item.quantity;
    });

    cartTotal.textContent = `Total: ${total.toFixed(2)}`;
    this.attachEventListeners();
  },

  attachEventListeners() {
    document.querySelectorAll('.quantity-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.target.getAttribute('data-id');
        const listItem = e.target.closest('.cart-item');
        const quantityElement = listItem.querySelector('.item-quantity');
        let currentQuantity = parseInt(quantityElement.textContent.replace('Quantity: ', ''));
        
        if (e.target.classList.contains('plus')) {
          currentQuantity += 1;
        } else {
          currentQuantity = Math.max(1, currentQuantity - 1);
        }
        
        this.updateQuantity(productId, currentQuantity);
      });
    });

// Then append this button to your cart item or wherever it belongs
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.target.getAttribute('data-id');
        this.removeItem(productId);
      });
    });
  }
};

// UI Management
const uiManager = {
  // Modal functions
  openLogin: () => {
    const loginContainer = document.querySelector("#login");
    loginContainer.style.display = "grid";
  },

  closeLogin: () => {
    const loginContainer = document.querySelector("#login");
    loginContainer.style.display = "none";
  },

  openRegister: () => {
    const registerContainer = document.querySelector("#register");
    registerContainer.style.display = "grid";
  },

  closeRegister: () => {
    const registerContainer = document.querySelector("#register");
    registerContainer.style.display = "none";
  },
updateButtonVisibility: function(currentUser) {
  const elements = {
    loginBtn: document.getElementById("login-btn"),
    registerBtn: document.getElementById("register-btn"),
    logoutButton: document.getElementById("logout-button"),
    userAvatarDisplay: document.getElementById("user-avatar-display"),
    navbar: document.querySelector('.navbar')
  };

  elements.loginBtn.style.display = currentUser ? "none" : "block";
  elements.registerBtn.style.display = currentUser ? "none" : "block";
  elements.logoutButton.style.display = currentUser ? "block" : "none";

  if (currentUser) {
    const isAdmin = currentUser.role === 'admin';
    console.log('User is admin:', isAdmin);
    
    // Clear existing content before adding new
    elements.userAvatarDisplay.innerHTML = `
      <img src="/images/avatar.jpg" alt="User Avatar">
    `;

    if (isAdmin) {
      // Add admin link dynamically
      const adminLink = document.createElement('a');
      adminLink.href = '/admin';
      adminLink.className = 'admin-link';
      adminLink.textContent = i18nManager.translate('ui.buttons.adminPanel');
      adminLink.setAttribute('aria-label', i18nManager.translate('ui.ariaLabels.adminPanel'));
      
      // Append the admin link to userAvatarDisplay
      elements.userAvatarDisplay.appendChild(adminLink);
    }
  } else {
    // Clear the content if no user is logged in
    elements.userAvatarDisplay.innerHTML = '';
  }
}
//   updateButtonVisibility: (currentUser) => {
//     const loginBtn = document.getElementById("login-btn");
//     const registerBtn = document.getElementById("register-btn");
//     const logoutBtn = document.getElementById("logout-button");
//     const logo2 = document.querySelector(".credit-info");
//     const userAvatar = document.querySelector(".user-avatar-display");
//     const navLinks = document.querySelector('.navbar');
//     const adminLink = document.getElementById("admin-link");
//     if (currentUser) {
//       // Hide login and register buttons
//       if (loginBtn) loginBtn.style.display = "none";
//       if (registerBtn) registerBtn.style.display = "none";
  
//       // Show elements like logout and avatars
//       if (logoutBtn) logoutBtn.style.display = "block";
//       if (logo2) logo2.style.display = "flex";
//       if (userAvatar) userAvatar.style.display = "flex";
    

  
//       // Handle admin link visibility
//       if (currentUser.role === 'admin') {
//         if (adminLink) {
//             adminLink.style.display = "block";
//         } else if (navLinks) {
//             const newAdminLink = document.createElement('a');
//             newAdminLink.href = '/admin';
//             newAdminLink.textContent = i18nManager.translate('ui.buttons.adminPanel');
//             newAdminLink.id = 'admin-link';
//             navLinks.appendChild(newAdminLink);
//         }
//     } else if (adminLink) {
//         adminLink.style.display = 'none';
//     }
// } else {
//     // Show login and register buttons
//     if (loginBtn) loginBtn.style.display = "block";
//     if (registerBtn) registerBtn.style.display = "block";

//     // Hide logout button and credit info
//     if (logoutBtn) logoutBtn.style.display = "none";
//     if (logo2) logo2.style.display = "none";
//     if (userAvatar) userAvatar.style.display = "none";
//     // Hide admin link if it exists
//     if (adminLink) adminLink.style.display = 'none';
// }
    
//   }
};

// Auth Management
const authManager = {
async fetchCurrentUser() {
    try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/users/current', {
        ...fetchConfig,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Auth failed');
      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  },

async login(formData) {
  try {
    const response = await fetch("https://backend-3mvr.onrender.com/api/auth/login", {
      ...fetchConfig,
      method: "POST",
      body: JSON.stringify({
        email: formData.email,
        password: formData.password
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      showNotification('Login successful!', 'success');
      return true;  // Remove window.location.reload() from here
    } else {
      showNotification(data.message, 'error');
      return false;
    }
  } catch (error) {
    showNotification(error.message, 'error');
    return false;
  }
},

// In AuthModal's handleLogin
if (success) {
    this.showMessage('login-message', 'Login successful!', 'success');
    setTimeout(() => {
        this.hideModal();
        window.location.reload();  // Move it here
    }, 1500);
},

  async register(formData) {
    try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/auth/register', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          firstname: formData.firstName,
          lastname: formData.lastName,
          email: formData.email,
          password: formData.password
        }),
      });

      if (response.ok) {
        showNotification('Registration successful!', 'success');
        return true;
      } else {
        const data = await response.json();
        showNotification(data.message, 'error');
        return false;
      }
    } catch (error) {
      showNotification(error.message, 'error');
      return false;
    }
  },async logout() {
    try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/auth/logout', {
        method: "POST",
        credentials: 'include',
        headers: fetchConfig.headers
      });

      if (response.ok) {
        localStorage.clear();
        window.location.reload();
      } else {
        showNotification('Failed to log out', 'error');
      }
    } catch (error) {
      showNotification('Error logging out', 'error');
    }
  },
  async displayUserInfo() {
    const userInfoDisplay = document.getElementById("user-info-display");
    const currentUser = await this.fetchCurrentUser();

    if (currentUser) {
      userInfoDisplay.textContent = `Logged in as: ${currentUser.firstname} ${currentUser.lastname}`;
    } else {
      userInfoDisplay.textContent = "Not logged in";
    }
  },
  
  async checkAdminAccess() {
    const user = await authManager.fetchCurrentUser();
    return user && user.role === 'admin';
  },

  async displayUserAvatar() {
    const currentUser = await this.fetchCurrentUser();
    if (!currentUser || !currentUser.firstname) {
      console.error('User data is missing or invalid');
      return;
    }

    const userAvatarDisplay = document.getElementById("user-avatar-display");
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.firstname)}+${encodeURIComponent(currentUser.lastname)}`;

    userAvatarDisplay.innerHTML = `
      <img src="${avatarUrl}" alt="${currentUser.firstname}'s avatar" />
    `;
  }
};
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
                 setTimeout(() => {
                this.hideModal();
                window.location.reload();
            }, 1500);
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

  async loginUser(data) {
    return await authManager.login(data);
  },

  async registerUser(data) {
    return await authManager.register(data);
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

const paymentManager = {
  stripe: null,

  initialize(publicKey) {
    this.stripe = Stripe(publicKey);
  },

  async initiateCheckout() {
    try {
      if (!currentUser) {
        await this.setupGuestSession();
      }

      const response = await fetch('https://backend-3mvr.onrender.com/api/create-checkout-session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-User': !currentUser ? '999999' : undefined
        }
      });
      
      const data = await response.json();
      const result = await this.stripe.redirectToCheckout({ sessionId: data.id });
      
      if (result.error) {
        showNotification(result.error.message, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Failed to start checkout process', 'error');
    }
  },

  async setupGuestSession() {
    try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/guest-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: 'guest@example.com',
          password: 'not_accessible'
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Guest session setup failed:', error);
      return false;
    }
  }
};
// RATING MANAGER
const ratingManager = {
  state: {
    userRatings: new Map(),
    modalContainer: null, 
    products: new Map(), 
  },
setProductData(products) {
    products.forEach(product => {
      this.state.products.set(product.product_id.toString(), {
        name: product.name,
        average_rating: product.average_rating || 0,
        total_ratings: product.total_ratings || 0
      });
    });
  },

  findProduct(productId) {
    return this.state.products.get(productId.toString()) || {
      name: 'Product',
      average_rating: 0,
      total_ratings: 0
    };
  },
  processRatingDistribution(ratings) {
    console.log('Processing ratings:', ratings);
    
    // Initialize array with zeros for all possible ratings (1-5)
    const distribution = [0, 0, 0, 0, 0];
    
    if (Array.isArray(ratings)) {
      ratings.forEach(ratingObj => {
        console.log('Processing rating:', ratingObj);
        // Assuming the rating object has a 'rating' property
        const rating = parseInt(ratingObj.rating);
        if (rating >= 1 && rating <= 5) {
          distribution[rating - 1]++;
          console.log(`Incremented count for rating ${rating}`);
        }
      });
    }
    
    console.log('Final processed distribution:', distribution);
    return distribution;
  },

    async fetchUserRatings() {
    try {
      // Using the same format as the submit endpoint
      const response = await fetch('https://backend-3mvr.onrender.com/api/ratings/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add any other headers your backend might need
        },
        credentials: 'include'  // Important for sending cookies
      });
      
      if (!response.ok) {
        console.error('Response status:', response.status);
        throw new Error('Failed to fetch user ratings');
      }
      
      const data = await response.json();
      console.log('Fetched user ratings response:', data);
      
      // Clear existing ratings
      this.state.userRatings.clear();
      
      // Handle potential null/undefined response
      if (data && data.ratings && Array.isArray(data.ratings)) {
        data.ratings.forEach(rating => {
          if (rating && rating.productId) {
            this.state.userRatings.set(rating.productId.toString(), rating.rating);
            console.log(`Stored rating for product ${rating.productId}: ${rating.rating}`);
          }
        });
      } else {
        console.log('No ratings found in response:', data);
      }
      
      // Update all visible product ratings
      this.updateAllProductRatings();
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      // Don't show notification to user since this is background loading
    }
  },

  
  hasUserRatings() {
    return this.state.userRatings.size > 0;
  },
   updateAllProductRatings() {
    document.querySelectorAll('.rating-summary').forEach(container => {
      const productId = container.dataset.productId;
      const product = this.findProduct(productId);
      if (product) {
        this.updateProductRatingDisplay(
          productId,
          product.average_rating,
          product.total_ratings
        );
      }
    });
  },
  // Core rating management functions
  async submitRating(productId, rating) {
    try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/ratings/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, rating })
      });

      if (!response.ok) throw new Error('Failed to submit rating');
      const result = await response.json();
      
      this.state.userRatings.set(productId.toString(), rating);
      this.updateProductRatingDisplay(productId, result.averageRating, result.totalRatings);
      showNotification('Rating submitted successfully!', 'success');
      return result;
    } catch (error) {
      console.error('Error submitting rating:', error);
      showNotification('Failed to submit rating', 'error');
      throw error;
    }
  },
    attachModalEventListeners(productId) {
    const modalContent = this.state.modalContainer.querySelector('.modal-content');
    
    // Handle star rating clicks
    const stars = modalContent.querySelectorAll('.star interactive');
    stars.forEach(star => {
      star.addEventListener('click', async () => {
        const rating = parseInt(star.dataset.rating);
        if (!isNaN(rating)) {
          await this.submitRating(productId, rating);
        }
      });

      // Handle hover effects
      star.addEventListener('mouseover', () => {
        const rating = parseInt(star.dataset.rating);
        stars.forEach((s, index) => {
          s.classList.toggle('hover', index < rating);
        });
      });

      star.addEventListener('mouseout', () => {
        stars.forEach(s => s.classList.remove('hover'));
      });
    });

    // Handle remove rating button
    const removeButton = modalContent.querySelector('.remove-rating-btn');
    if (removeButton) {
      removeButton.addEventListener('click', async () => {
        await this.removeRating(productId);
        this.closeRatingModal();
      });
    }

    // Handle modal close
    const closeButton = modalContent.querySelector('.close-modal');
    const backdrop = this.state.modalContainer.querySelector('.modal-backdrop');
    
    closeButton.addEventListener('click', () => this.closeRatingModal());
    backdrop.addEventListener('click', () => this.closeRatingModal());
  },

  async removeRating(productId) {
    try {
      const response = await fetch(`https://backend-3mvr.onrender.com/api/ratings/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to remove rating');
      const result = await response.json();
      
      // Remove from userRatings Map
      this.state.userRatings.delete(productId.toString());
      this.updateProductRatingDisplay(productId, result.averageRating, result.totalRatings);
      showNotification('Rating removed successfully', 'success');
      return result;
    } catch (error) {
      console.error('Error removing rating:', error);
      showNotification('Failed to remove rating', 'error');
      throw error;
    }
  },
 async openRatingModal(productId) {
    try {
      console.log('Opening rating modal for product:', productId);
      
      const response = await fetch(`https://backend-3mvr.onrender.com/api/ratings/${productId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        throw new Error('Failed to fetch ratings');
      }
      
      const data = await response.json();
      console.log('Raw API response:', data);

      const product = this.findProduct(productId);
      console.log('Found product:', product);

      if (!product) {
        console.error('Product not found for ID:', productId);
        throw new Error('Product not found');
      }

      if (!this.state.modalContainer) {
        this.state.modalContainer = document.createElement('div');
        this.state.modalContainer.className = 'rating-modal-container';
        document.body.appendChild(this.state.modalContainer);
        console.log('Created new modal container');
      }

      // Use the ratings array instead of looking for distribution
      console.log('Processing ratings array:', data.ratings);
      const distribution = data.ratings ? 
        this.processRatingDistribution(data.ratings) : 
        [0, 0, 0, 0, 0];

      console.log('Final distribution array:', distribution);
      
      this.state.modalContainer.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
          <button class="close-modal">×</button>
          ${this.createRatingModal(
            productId,
            product.name,
            data.averageRating || 0,
            data.totalRatings || distribution.reduce((a, b) => a + b, 0),
            distribution
          )}
        </div>
      `;

      this.state.modalContainer.classList.add('active');
      this.attachModalEventListeners(productId);
      
    } catch (error) {
      console.error('Error in openRatingModal:', error);
      showNotification('Failed to load rating details', 'error');
    }
  },
  closeRatingModal() {
    if (this.state.modalContainer) {
      this.state.modalContainer.classList.remove('active');
    }
  },

  // Helper function to find product details
  findProduct(productId) {
    // You'll need to adapt this based on how you store your products
    const products = document.querySelectorAll('.grid-item');
    for (const product of products) {
      if (product.dataset.productId === productId) {
        return {
          name: product.querySelector('.overlay').textContent.split('|')[0].trim(),
          product_id: productId
        };
      }
    }
    return null;
  },

  // UI Components
  createProductRating(productId, averageRating, totalRatings) {
    const rating = this.state.userRatings.get(productId);
    return `
      <div class="rating-summary" data-product-id="${productId}">
        <div class="rating-stars">
          ${this.createStars(averageRating)}
        </div>
        <div class="rating-count">${totalRatings} ${totalRatings === 1 ? 'rating' : 'ratings'}</div>
      </div>
    `;
  },
 createRatingModal(productId, productName, averageRating, totalRatings, distribution) {
    const userRating = this.state.userRatings.get(productId);
    return `
      <div class="rating-modal">
        <h3>${productName}</h3>
        <div class="rating-overview">
          <div class="average-rating">
            <span class="big-number">${averageRating.toFixed(1)}</span>
            <div class="rating-stars large">
              ${this.createStars(averageRating)}
            </div>
            <div class="total-ratings">${totalRatings} total ratings</div>
          </div>
          <div class="rating-breakdown">
            ${this.createRatingBreakdown(distribution)}
          </div>
        </div>
        <div class="user-rating-section">
          <h4>${userRating ? 'Your Rating' : 'Rate this Product'}</h4>
          <div class="interactive-stars" data-product-id="${productId}">
            ${this.createInteractiveStars(userRating)}
          </div>
        </div>
      </div>
    `;
  },
  updateProductRatingDisplay(productId, averageRating, totalRatings) {
    const container = document.querySelector(`.rating-summary[data-product-id="${productId}"]`);
    if (container) {
      container.innerHTML = this.createProductRating(productId, averageRating, totalRatings);
    }
  },

  // Helper functions
  createStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars += '<span class="star full">★</span>';
      } else if (i === fullStars && hasHalfStar) {
        stars += '<span class="star half">★</span>';
      } else {
        stars += '<span class="star empty">★</span>';
      }
    }
    return stars;
  },


  getRatingLabel(rating) {
    return ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1] || '';
  },

  
  async initialize() {
    try {
      await this.fetchUserRatings();
      console.log('User ratings initialized:', 
        Array.from(this.state.userRatings.entries()));
    } catch (error) {
      console.error('Failed to initialize user ratings:', error);
    }
    
    this.attachEventListeners();
    this.injectStyles();
  },

  attachEventListeners() {
  // Global event listener for product cards
  document.addEventListener('click', async (e) => {
    

    // Check if the clicked element is the rate button
    const rateBtn = e.target.closest('.rate-btn');
    if (rateBtn && !e.target.closest('.rating-modal')) {
      // Get the product ID from the parent grid item
      const gridItem = rateBtn.closest('.grid-item');
      if (gridItem) {
        const productId = gridItem.dataset.productId;
        console.log("Product ID:", productId); // Debugging
        await this.openRatingModal(productId);
      }
      return;
    }
    // Handle star rating click
    if (e.target.matches('.star.interactive')) {  // Fixed selector
      const productId = e.target.closest('[data-product-id]').dataset.productId;
      const rating = parseInt(e.target.dataset.rating);
      if (!isNaN(rating)) {
        await this.submitRating(productId, rating);
        this.closeRatingModal();
      }
      return;
    }

    // Handle remove rating button
    if (e.target.classList.contains('remove-rating-btn')) {
      const productId = e.target.closest('[data-product-id]').dataset.productId;
      await this.removeRating(productId);
      this.closeRatingModal();
      return;
    }

    // Handle modal close
    if (e.target.classList.contains('close-modal') || e.target.classList.contains('modal-backdrop')) {
      this.closeRatingModal();
    }
  });

  // Star hover effects
  document.addEventListener('mouseover', (e) => {
    if (e.target.matches('.star.interactive')) {
      const stars = e.target.closest('.stars-container').querySelectorAll('.star.interactive');
      const rating = parseInt(e.target.dataset.rating);
      stars.forEach((star, index) => {
        star.classList.toggle('hover', index < rating);
      });
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.matches('.star.interactive')) {
      const stars = e.target.closest('.stars-container').querySelectorAll('.star.interactive');
      stars.forEach(star => star.classList.remove('hover'));
    }
  });
},
// Modify the createInteractiveStars method
createInteractiveStars(userRating = null) {
  return `
    <div class="stars-container">
      ${Array.from({ length: 5 }, (_, i) => `
        <span class="star interactive ${userRating && userRating >= i + 1 ? 'selected' : ''}"
              data-rating="${i + 1}"
              title="${this.getRatingLabel(i + 1)}">★</span>
      `).join('')}
    </div>
  `;
},
  createRatingBreakdown(distribution) {
    console.log('Creating breakdown with distribution:', distribution);
    const total = distribution.reduce((a, b) => a + b, 0);
    console.log('Total ratings:', total);
    
    return Array.from({ length: 5 }, (_, i) => {
      const starCount = 5 - i;
      const count = distribution[starCount - 1];
      const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
      
      console.log(`Star ${starCount}: count=${count}, percentage=${percentage}%`);
      
      return `
        <div class="breakdown-row">
          <span class="star-label">${starCount} stars</span>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${percentage}%"></div>
          </div>
          <span class="count">${count}</span>
        </div>
      `;
    }).join('');
  },


  // Styles
  injectStyles() {
    const styles = `
      .rating-summary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 4px;
      }
 .stars-container {
        display: flex;
        gap: 4px;
      }

      .star.interactive {
        cursor: pointer;
        transition: color 0.2s, transform 0.1s;
        font-size: 1.5rem;
      }

      .star.interactive:hover {
        color: #ffd700;
        transform: scale(1.1);
      }

      .star.interactive.hover {
        color: #ffd700;
      }

      .star.interactive.selected {
        color: #ffd700;
      }

      /* Make modal content more prominent */
      .modal-content {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 24px;
        min-width: 320px;
      }

      .rating-modal h3 {
        margin: 0 0 20px 0;
        font-size: 1.5rem;
        color: #333;
      }

      .user-rating-section {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #eee;
      }

      .user-rating-section h4 {
        margin: 0 0 12px 0;
        color: #666;
      }
      .rating-stars {
        display: flex;
        gap: 2px;
      }

      .star {
        font-size: 1rem;
        color: #ddd;
      }

      .star.full, .star.selected {
        color: #ffd700;
      }

      .star.half {
        position: relative;
        background: linear-gradient(90deg, #ffd700 50%, #ddd 50%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .star.interactive {
        cursor: pointer;
        transition: color 0.2s;
      }

      .star.interactive:hover {
        color: #ffd700;
      }

      .rating-modal-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .rating-modal-container.active {
        display: flex;
      }

      .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
      }

      .modal-content {
        position: relative;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        max-width: 90%;
        max-height: 90%;
        overflow-y: auto;
        z-index: 1;
      }

      .close-modal {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 24px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
        line-height: 1;
      }

      .rating-modal {
        padding: 1.5rem;
        max-width: 500px;
        margin: 0 auto;
      }

      .rating-overview {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 2rem;
        margin: 1.5rem 0;
      }

      .average-rating {
        text-align: center;
      }

      .big-number {
        font-size: 2.5rem;
        font-weight: bold;
      }

      .rating-stars.large .star {
        font-size: 1.5rem;
      }

      .breakdown-row {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 1rem;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .bar-container {
        height: 8px;
        background: #eee;
        border-radius: 4px;
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        background: #ffd700;
        transition: width 0.3s ease;
      }

      .remove-rating-btn {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .remove-rating-btn:hover {
        background: #cc0000;
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
};
const cryptoManager = {
  state: {
    cryptoPricesEnabled: false,
    cryptoRates: { BTC: 0, ETH: 0 },
    updateInterval: null,
    lastFetchTime: null,
    rateFetchInterval: 300000, 
  },

  
  formatCryptoPrice(usdPrice) {
    if (!this.state.cryptoPricesEnabled || !usdPrice) return `$${usdPrice}`;

    try {
      const btcPrice = (usdPrice * this.state.cryptoRates.BTC).toFixed(8);
      const ethPrice = (usdPrice * this.state.cryptoRates.ETH).toFixed(6);
      return `$${usdPrice} | ₿ ${btcPrice} | Ξ ${ethPrice}`;
    } catch (error) {
      console.error('Error formatting crypto price:', error);
      return `$${usdPrice}`;
    }
  },

  async fetchCryptoRates() {
    if (this.state.lastFetchTime && 
        Date.now() - this.state.lastFetchTime < 60000) {
      return;
    }

    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.bitcoin?.usd || !data.ethereum?.usd) {
        throw new Error('Invalid cryptocurrency data received');
      }

      this.state.cryptoRates.BTC = 1 / data.bitcoin.usd;
      this.state.cryptoRates.ETH = 1 / data.ethereum.usd;
      this.state.lastFetchTime = Date.now();

      // Important: Update prices whenever we get new rates
      if (this.state.cryptoPricesEnabled) {
        this.updateAllProductPrices();
      }
    } catch (error) {
      console.error("Error fetching crypto rates:", error);
      showNotification("Failed to fetch crypto rates. Retrying in 1 minute...", "error");
      setTimeout(() => this.fetchCryptoRates(), 60000);
    }
  },

  createCryptoToggle() {
    const navbarRight = document.querySelector(".navbar-right");
    if (!navbarRight) return;

    // Remove existing toggle if present
    const existingToggle = document.querySelector(".crypto-toggle-container");
    if (existingToggle) {
      existingToggle.remove();
    }

    const toggleContainer = document.createElement("div");
    toggleContainer.className = "crypto-toggle-container";
    toggleContainer.innerHTML = `
      <label class="crypto-switch">
        <input type="checkbox" id="crypto-toggle">
        <span class="slider round"></span>
      </label>
      <span class="crypto-label">
  <a href="#" aria-label="${i18nManager.translate('ui.ariaLabels.showCryptoPrices')}">${i18nManager.translate('ui.labels.showCryptoPrices')}</a>
</span>
      
    `;

    navbarRight.insertBefore(toggleContainer, navbarRight.firstChild);

    const toggle = document.getElementById("crypto-toggle");
    if (toggle) {
      // Set initial state
      toggle.checked = this.state.cryptoPricesEnabled;
      
      // Add event listener
      toggle.addEventListener("change", async (e) => {
        this.state.cryptoPricesEnabled = e.target.checked;
        localStorage.setItem("cryptoPricesEnabled", this.state.cryptoPricesEnabled);
        
        // Fetch fresh rates if enabled
        if (this.state.cryptoPricesEnabled) {
          await this.fetchCryptoRates();
        }
        console.log("update ALL PRODUCT PRICES CALL");
        this.updateAllProductPrices();
      });
    }
  },

  updateAllProductPrices() {
    const priceSpans = document.querySelectorAll(".price-span");
    
    priceSpans.forEach((priceSpan) => {
      const usdPrice = parseFloat(priceSpan.getAttribute("data-usd-price"));
      
      if (!isNaN(usdPrice)) {
        priceSpan.textContent = this.formatCryptoPrice(usdPrice);
      }
    });
  }
,

  async initialize() {
    try {
      // Load saved preference
      const savedPreference = localStorage.getItem("cryptoPricesEnabled");
      this.state.cryptoPricesEnabled = savedPreference === "true";
      
      // Create UI elements
      this.createCryptoToggle();
      
      // Fetch initial rates if enabled
      if (this.state.cryptoPricesEnabled) {
        await this.fetchCryptoRates();
      }
      
      // Start update interval
      this.startUpdateInterval();
      
      // Update initial prices
      this.updateAllProductPrices();
    } catch (error) {
      console.error("Error initializing crypto manager:", error);
      showNotification("Failed to initialize cryptocurrency features", "error");
    }
  },

  startUpdateInterval() {
    if (this.state.updateInterval) {
      clearInterval(this.state.updateInterval);
    }
    this.state.updateInterval = setInterval(
      () => this.fetchCryptoRates(),
      this.state.rateFetchInterval
    );
  },

  stopUpdateInterval() {
    if (this.state.updateInterval) {
      clearInterval(this.state.updateInterval);
      this.state.updateInterval = null;
    }
  }
};


window.addEventListener('unload', () => {
  if (cryptoManager.state.updateInterval) {
    cryptoManager.stopUpdateInterval();
  }
});
const recommendationManager = {
  state: {
    currentProduct: null,
    recommendedProducts: []
  },

  // Get recommendations based on current product's category
  async getRecommendations(productId) {
    try {
      // First get all products
      const response = await fetch('https://backend-3mvr.onrender.com/api/products');
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      const products = data.success ? data.products : data;

      // Find the current product
      // Convert productId to string to match ratingManager's approach
      const currentProduct = products.find(p => p.product_id.toString() === productId.toString());
      if (!currentProduct) {
        console.log('Available products:', products);
        console.log('Looking for product ID:', productId);
        throw new Error("Product not found");
      }
      
      this.state.currentProduct = currentProduct;

      // Get products from the same category
      const categoryResponse = await fetch(`https://backend-3mvr.onrender.com/api/products/category/${currentProduct.category_id}`);
      if (!categoryResponse.ok) throw new Error("Failed to fetch recommendations");
      const categoryData = await categoryResponse.json();
      let recommendations = categoryData.success ? categoryData.products : categoryData;

      // Filter out the current product and limit to 4 recommendations
      recommendations = recommendations
        .filter(p => p.product_id.toString() !== productId.toString())
        .slice(0, 4);

      this.state.recommendedProducts = recommendations;
      await this.renderRecommendations();
    } catch (error) {
      console.error("Error getting recommendations:", error);
      showNotification(error.message, "error");
    }
  },

  // Render recommendations in the UI
  async renderRecommendations() {
    const container = document.createElement('div');
    container.className = 'recommendations-container';
    container.innerHTML = `
      <h3>${i18nManager.translate('ui.labels.youMightAlsoLike')}</h3>
      <div class="recommendations-grid"></div>
    `;

    const grid = container.querySelector('.recommendations-grid');

    this.state.recommendedProducts.forEach(product => {
      const productElement = document.createElement('div');
      productElement.className = 'recommended-product';
      
      // Create rating HTML using ratingManager
      const ratingHTML = ratingManager.createProductRating(
        product.product_id,
        product.average_rating || 0,
        product.total_ratings || 0
      );

      productElement.innerHTML = `
        <img src="${product.image_url || '/images/default-product-image.jpg'}" alt="${product.name}">
        <h4>${product.name}</h4>
        <p>${cryptoManager.formatCryptoPrice(product.price)}</p>
        ${ratingHTML}
        <button class="recommend-add-to-cart">Add to the cart</button>
      `;

      // Add click handler for cart button
      const addButton = productElement.querySelector('.recommend-add-to-cart');
      addButton.onclick = () => cartManager.addItem(product.product_id);

      grid.appendChild(productElement);
    });

    // Find and update the recommendations section
    const existingRecommendations = document.querySelector('.recommendations-container');
    if (existingRecommendations) {
      existingRecommendations.replaceWith(container);
    } else {
      document.querySelector('.grid-container').after(container);
    }
  },

  initialize() {
    // Add click handlers to product grid items to show recommendations
    document.querySelector('.grid-container').addEventListener('click', (e) => {
      const gridItem = e.target.closest('.grid-item');
      if (gridItem) {
        const productId = gridItem.getAttribute('data-product-id');
        if (productId) {
          this.getRecommendations(productId);
        }
      }
    });
  }
}
;

const productPageManager = {
  state: {
    products: [],
    currentProduct: null,
    modalContainer: null,
    pendingProductId: null 
  },

  updateProducts(products) {
    this.state.products = products;
    // Check if we have a pending product to display
    if (this.state.pendingProductId) {
      const product = products.find(p => p.product_id.toString() === this.state.pendingProductId.toString());
      if (product) {
        this.openProductPage(product);
        this.state.pendingProductId = null;
      }
    }
  },

  getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');
    if (productId) return productId;
    
    const hashMatch = window.location.hash.match(/product-(\d+)/);
    if (hashMatch) return hashMatch[1];
    
    return null;
  },

  handleNavigation() {
    const productId = this.getProductIdFromUrl();
    if (productId) {
      // If we already have products loaded
      if (this.state.products.length > 0) {
        const product = this.state.products.find(p => p.product_id.toString() === productId.toString());
        if (product) {
          this.openProductPage(product);
        }
      } else {
        // Store the product ID to show after products are loaded
        this.state.pendingProductId = productId;
      }
    } else {
      this.closeProductPage();
    }
  },
openProductPage(product) {
    this.state.currentProduct = product;
    
    // Update URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('product', product.product_id);
    window.history.pushState({}, '', newUrl.toString());
    
    // Create image slider HTML
    let imageSliderHtml = '<div class="product-image-slider">';
    if (product.images?.length > 0) {
      product.images.forEach((img, index) => {
        imageSliderHtml += `<img src="${img}" alt="${product.name} - Image ${index + 1}" ${index === 0 ? 'class="active"' : ''}>`;
      });
    } else if (product.image_url) {
      imageSliderHtml += `<img src="${product.image_url}" alt="${product.name}" class="active">`;
    }
    imageSliderHtml += '</div>';

    // Create modal content
    this.state.modalContainer.innerHTML = `
      <div class="modal-content">
        <button class="close-btn" onclick="productPageManager.closeProductPage()">&times;</button>
        <div class="product-page-content">
          ${imageSliderHtml}
          <h1>${product.name}</h1>
          <div class="product-price">
            Price: <span class="price-span" data-usd-price="${product.price}">
              ${cryptoManager.formatCryptoPrice(product.price)}
            </span>
          </div>
          <div class="product-stock">Stock: ${product.stock}</div>
          </div>
        </div>
      </div>
    `;

    this.state.modalContainer.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  },closeProductPage() {
    if (this.state.modalContainer) {
      this.state.modalContainer.style.display = 'none';
      document.body.style.overflow = '';
      this.state.currentProduct = null;
      
      // Update URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('product');
      window.history.pushState({}, '', newUrl.toString());
    }
  },
  initialize() {
    // Create modal container
    if (!this.state.modalContainer) {
      this.state.modalContainer = document.createElement('div');
      this.state.modalContainer.id = 'product-page-modal';
      this.state.modalContainer.className = 'modal-container';
      this.state.modalContainer.style.display = 'none';
      document.body.appendChild(this.state.modalContainer);
    }

    // Store initial product ID
    const initialProductId = this.getProductIdFromUrl();
    if (initialProductId) {
      this.state.pendingProductId = initialProductId;
    }

    // Handle browser navigation
    window.addEventListener('popstate', () => {
      this.handleNavigation();
    });

    // Add styles
    if (!document.getElementById('product-modal-styles')) {
      const styles = document.createElement('style');
      styles.id = 'product-modal-styles';
      styles.textContent = `
        .modal-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          max-width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }
        
        .close-btn {
          position: absolute;
          right: 10px;
          top: 10px;
          font-size: 24px;
          cursor: pointer;
          border: none;
          background: none;
        }
        
        .product-image-slider {
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }
        
        .product-image-slider img {
          width: 100%;
          height: auto;
          display: none;
        }
        
        .product-image-slider img.active {
          display: block;
        }
        
        .product-page-content {
          padding: 20px;
        }
        
        .product-actions {
          margin-top: 20px;
          display: flex;
          gap: 10px;
        }
      `;
      document.head.appendChild(styles);
    }
  }
};
// Update the main initialization sequence
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Initialize all managers
    await Promise.allSettled([
      cryptoManager.initialize(),
      ratingManager.initialize(),
      productPageManager.initialize(),
      paymentManager.initialize('your-stripe-key'),
      recommendationManager.initialize(),
    ]);

    // Initialize category manager last since it loads products
    await categoryManager.initialize();

    // Fetch user data and update UI
    currentUser = await authManager.fetchCurrentUser();
    
    // Initialize UI components
    authManager.displayUserInfo();
    authManager.displayUserAvatar();
    cartManager.updateDisplay();
    
    setupEventListeners();
    uiManager.updateButtonVisibility(currentUser);

     const elements = {
    checkoutButton: document.querySelector('.checkout-btn'),
    emptyCartButton: document.getElementById('empty-cart-button')
  };

  if (elements.checkoutButton) {
    elements.checkoutButton.textContent = i18nManager.translate('ui.buttons.checkout');
    elements.checkoutButton.addEventListener('click', (event) => {
      event.preventDefault();
      paymentManager.initiateCheckout();
    });
  }

  if (elements.emptyCartButton) {
    elements.emptyCartButton.textContent = i18nManager.translate('ui.buttons.emptyCart');
    elements.emptyCartButton.addEventListener('click', (event) => {
      event.preventDefault();
      cartManager.clearCart();
    });
  }

    
  } catch (error) {
    console.error("Error during initialization:", error);
    showNotification("Error initializing application", "error");
  }
});
const socialSharingManager = {
  getBaseUrl() {
    // Use your custom domain or the render.com frontend URL
    return window.location.origin;
  },

  getSharingUrls(product) {
    // Create a full URL that includes the product parameter
    const url = new URL(this.getBaseUrl());
    url.searchParams.set('product', product.product_id);
    const productUrl = url.toString();
    
    const text = `Check out ${product.name}! Price: ${cryptoManager.formatCryptoPrice(product.price)}`;
    
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + productUrl)}`,
    };
  },

  showShareOptions(product) {
    const shareData = {
      title: product.name,
      text: `Check out ${product.name}! Price: ${cryptoManager.formatCryptoPrice(product.price)}`,
      url: `${this.getBaseUrl()}?product=${product.product_id}`
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
      return;
    }

    // Fallback to custom sharing menu
    const shareUrls = this.getSharingUrls(product);
    const menu = document.createElement('div');
    menu.className = 'share-menu';
    menu.innerHTML = `
      <button onclick="window.open('${shareUrls.facebook}', '_blank')">Facebook</button>
      <button onclick="window.open('${shareUrls.twitter}', '_blank')">Twitter</button>
      <button onclick="window.open('${shareUrls.whatsapp}', '_blank')">WhatsApp</button>
    `;

    // Position menu near share button
    const shareButton = document.querySelector('.share-btn');
    const rect = shareButton.getBoundingClientRect();
    
    menu.style.position = 'absolute';
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.left = `${rect.left}px`;

    // Remove existing menus
    document.querySelectorAll('.share-menu').forEach(m => m.remove());
    document.body.appendChild(menu);

    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target) && e.target !== shareButton) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }
};

const i18nManager = {
state: {
    currentLanguage: 'en',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'srb', 'de'],
    translations: {
      en: {
        ui: {
          buttons: {
            addToCart: "Add to Cart",
            share: "Share",
            rate: "Rate",
            all: "All",
            login: "Login",
            logout: "Logout",
            register: "Register",
            cart: "Cart",
            orderHistory: "Order History",
            clearHistory: "Clear History",
            checkout: "Checkout",
            emptyCart: "Empty Cart",
            removeItem: "Remove",
            adminPanel: "Admin Panel",
          },
          labels: {
            stock: "Stock",
            price: "Price",
            categories: "Categories",
            search: "Search products...",
            recentSearches: "Recent searches",
            removeItem: "Remove Item",
            quantity: "Quantity",
            showCryptoPrices: "Show Crypto Prices",
            adminPanel: "Admin Panel",
          },
          tooltips: {
            decreaseQuantity: "Decrease Quantity",
            increaseQuantity: "Increase Quantity",
            removeItem: "Remove Item"
          },
          ariaLabels: {
            decreaseQuantity: "Decrease the quantity of this item",
            increaseQuantity: "Increase the quantity of this item",
            removeItem: "Remove this item from the cart",
            showCryptoPrices: "Show Crypto Prices",
            adminPanel: "Admin Panel",
          }
        }
      },
      srb: {
        ui: {
          buttons: {
            addToCart: "Додај у корпу",
            share: "Подели",
            rate: "Оцени",
            all: "Све",
            login: "Пријава",
            logout: "Одјава",
            register: "Регистрација",
            cart: "Корпа",
            orderHistory: "Историја поруџбина",
            clearHistory: "Обриши историју претрага",
            checkout: "Купи",
            emptyCart: "Очисти корпу",
            removeItem: "Уклони",
            adminPanel: "Админ Панел",
          },
          labels: {
            stock: "Стање",
            price: "Цена",
            categories: "Категорије",
            search: "Претражи производе...",
            recentSearches: "Недавне претраге",
            removeItem: "Уклони ставку",
            quantity: "Количина",
            showCryptoPrices: "Прикажи цене криптовалута",
            adminPanel: "Админ Панел"
          },
          tooltips: {
            decreaseQuantity: "Смањи количину",
            increaseQuantity: "Повећај количину",
            removeItem: "Уклони ставку"
          },
          ariaLabels: {
            decreaseQuantity: "Смањи количину овог производа",
            increaseQuantity: "Повећај количину овог производа",
            removeItem: "Уклони овај производ из корпе",
            showCryptoPrices: "Прикажи цене криптовалута",
            adminPanel: "Админ Панел"
          }
        }
      },
      de: {
        ui: {
          buttons: {
            addToCart: "In den Warenkorb",
            share: "Teilen",
            rate: "Bewerten",
            all: "Alle",
            login: "Anmelden",
            logout: "Abmelden",
            register: "Registrieren",
            cart: "Warenkorb",
            orderHistory: "Bestellverlauf",
            clearHistory: "Suchverlauf löschen",
            checkout: "Kassenbestellen",
            emptyCart: "Warenkorb leeren",
            removeItem: "Entfernen",
            adminPanel: "Admin-Bereich",
          },
          labels: {
            stock: "Lagerbestand",
            price: "Preis",
            categories: "Kategorien",
            search: "Produkte suchen...",
            recentSearches: "Vorherige Suchanfragen",
            removeItem: "Artikel entfernen",
            quantity: "Anzahl",
            showCryptoPrices: "Krypto-Preise anzeigen",
            adminPanel: "Admin-Bereich",
          },
          tooltips: {
            decreaseQuantity: "Menge verringern",
            increaseQuantity: "Menge erhöhen",
            removeItem: "Artikel entfernen"
          },
          ariaLabels: {
            decreaseQuantity: "Menge dieses Artikels verringern",
            increaseQuantity: "Menge dieses Artikels erhöhen",
            removeItem: "Diesen Artikel aus dem Warenkorb entfernen",
            showCryptoPrices: "Krypto-Preise anzeigen",
            adminPanel: "Admin-Bereich",
          }
        }
      }
    }
  },
 initialize() {
    const savedLang = localStorage.getItem('preferred_language');
    const browserLang = navigator.language.split('-')[0];
    
    this.setLanguage(
      savedLang || 
      (this.state.supportedLanguages.includes(browserLang) ? browserLang : this.state.defaultLanguage)
    );
    
    this.createLanguageSwitcher();
    
    // Initial content refresh
    return this.refreshAllContent();
  },

  getCurrentLanguage() {
    return i18nManager.state.currentLanguage;
  },

  setLanguage(lang) {
    if (!this.state.supportedLanguages.includes(lang)) {
      console.warn(`Language ${lang} not supported, falling back to ${this.state.defaultLanguage}`);
      lang = this.state.defaultLanguage;
    }
    
    this.state.currentLanguage = lang;
    localStorage.setItem('preferred_language', lang);
    document.documentElement.lang = lang;
    
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  },

  
  forceLanguage(lang) {
    i18nManager.setLanguage(lang);
    i18nManager.updateUI();
    // Trigger a content refresh
    window.dispatchEvent(new CustomEvent('refreshContent'));
    this.fetchProducts();
  }
,
    setLanguage(lang) {
    if (!this.state.supportedLanguages.includes(lang)) {
      console.warn(`Language ${lang} not supported, falling back to ${this.state.defaultLanguage}`);
      lang = this.state.defaultLanguage;
    }
    
    this.state.currentLanguage = lang;
    localStorage.setItem('preferred_language', lang);
    document.documentElement.lang = lang;
    
    // Dispatch a custom event when language changes
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { 
        language: lang 
      } 
    }));
  },
getProductName(product) {
  const currentLang = this.state.currentLanguage;
  
  // Try direct language-specific field first
  const langField = `name_${currentLang}`;
  if (currentLang !== 'en' && product[langField]) {
    return product[langField];
  }
  
  // Try translations object next
  if (currentLang !== 'en' && product.translations?.[currentLang]?.name) {
    return product.translations[currentLang].name;
  }
  
  // Fallback to displayName if available
  if (product.displayName) {
    return product.displayName;
  }
  
  // Final fallback to default name
  return product.name;
},

  getCategoryName(category) {
    if (!category) return '';
    const lang = this.state.currentLanguage;
    return lang === 'en' ? category.name : (category[`name_${lang}`] || category.name);
  },

  translate(key) {
    const keys = key.split('.');
    let result = this.state.translations[this.state.currentLanguage];
    
    for (const k of keys) {
      result = result?.[k];
      if (!result) break;
    }
    
    if (!result && this.state.currentLanguage !== this.state.defaultLanguage) {
      result = this.state.translations[this.state.defaultLanguage];
      for (const k of keys) {
        result = result?.[k];
        if (!result) break;
      }
    }
    
    return result || key;
  },
  getProductTranslation(product, field = 'name') {
    const currentLang = this.state.currentLanguage;
    
    // If current language is English, return the default name
    if (currentLang === 'en') {
      return product[field];
    }
    
    // Try to get translation from translations object first
    if (product.translations?.[currentLang]?.[field]) {
      return product.translations[currentLang][field];
    }
    
    // Try to get translation from direct field (name_srb, name_de)
    const translatedField = `${field}_${currentLang}`;
    if (product[translatedField]) {
      return product[translatedField];
    }
    
    // Fallback to English
    return product[field];
  },

  createLanguageSwitcher() {
    const container = document.querySelector('.header-controls') || document.createElement('div');
    container.innerHTML = `
      <select class="language-switcher" aria-label="Select language">
        ${this.state.supportedLanguages.map(lang => `
          <option value="${lang}" ${lang === this.state.currentLanguage ? 'selected' : ''}>
            ${lang.toUpperCase()}
          </option>
        `).join('')}
      </select>
    `;

    container.querySelector('.language-switcher').addEventListener('change', async (e) => {
      const newLang = e.target.value;
      this.setLanguage(newLang);
      this.updateUI();
      
      // Refresh all content that depends on language
      await this.refreshAllContent();
    });
  },
  async refreshAllContent() {
    // Update UI elements with translated text
    this.updateUI();

    // Refresh categories and products
    if (categoryManager) {
      // First fetch and render categories
      await categoryManager.fetchCategories();
      
      // Then fetch products based on current category selection
      await categoryManager.fetchProducts(categoryManager.state.selectedCategory);
      
      // Render products only if we have a selected category or we're showing all
      await categoryManager.renderProducts(categoryManager.state.products);
    }
  },

  updateUI() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.translate(key);
      
      if (element.tagName === 'INPUT') {
        if (element.type === 'button' || element.type === 'submit') {
          element.value = translation;
        } else {
          element.placeholder = translation;
        }
      } else {
        element.textContent = translation;
      }
    });
  },
transformProductData(product) {
    
    return {
      ...product,
      displayName: this.getProductName(product)
    };
  }
};

const categoryManager = {
  state: {
    categories: [],
    selectedCategory: null,
    products: [],
    searchTerm: '',
    searchInput: null,
    searchHistoryDropdown: null,
    debounceTimeout: null
  },
initialize() {
    this.setupSearch();
    
    // Listen for language changes
    window.addEventListener('languageChanged', async () => {
      await this.renderCategories();
      await this.fetchProducts(this.state.selectedCategory);
      await this.renderProducts(this.state.products);
      
    });
    
    return Promise.resolve();
  },
  updateSearchHistory(term) {
  try {
    let searches = [];
    const storedSearches = localStorage.getItem('searchHistory');
    
    // Parse stored searches or initialize an empty array
    if (storedSearches) {
      searches = JSON.parse(storedSearches);
      if (!Array.isArray(searches)) {
        searches = []; // Reset if corrupted data
      }
    }

    // Normalize the search term for consistency
    term = term.trim().toLowerCase();
    
    // Remove any duplicates
    searches = searches.filter(search => search.toLowerCase() !== term);
    
    // Add new term to the beginning
    searches.unshift(term);
    
    // Limit history to 5 items
    searches = searches.slice(0, 5);
    
    localStorage.setItem('searchHistory', JSON.stringify(searches));
    console.log('Updated search history:', searches);
  } catch (error) {
    console.error('Error updating search history:', error);
  }
},
showSearchHistory() {
  console.log('Showing search history');
  if (!this.state.searchHistoryDropdown) {
    console.warn('Search history dropdown not found');
    return;
  }

  try {
    const searches = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    if (searches.length === 0) {
      this.state.searchHistoryDropdown.innerHTML = '<div class="no-search-history">No recent searches</div>';
      this.state.searchHistoryDropdown.style.display = 'block';
      return;
    }

    this.state.searchHistoryDropdown.innerHTML = '';
    const fragment = document.createDocumentFragment();

    // Add header SEARCH HISTORY
    const header = document.createElement('div');
    header.className = 'search-history-header';
    header.textContent = i18nManager.translate('ui.labels.recentSearches');
    fragment.appendChild(header);

    searches.forEach(term => {
      const item = document.createElement('div');
      item.className = 'search-history-item';
      item.innerHTML = `<i class="fas fa-history"></i> ${term}`;
      item.addEventListener('click', () => {
        this.state.searchInput.value = term;
        this.searchProducts(term);
        this.hideSearchHistory();
      });
      fragment.appendChild(item);
    });

    // Clear search history option
    const clearButton = document.createElement('div');
    clearButton.className = 'search-history-clear';
    clearButton.textContent = i18nManager.translate('ui.buttons.clearHistory');
    clearButton.addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.removeItem('searchHistory');
      this.hideSearchHistory();
    });
    fragment.appendChild(clearButton);

    this.state.searchHistoryDropdown.appendChild(fragment);
    this.state.searchHistoryDropdown.style.display = 'block';
  } catch (error) {
    console.error('Error showing search history:', error);
    this.hideSearchHistory();
  }
},
hideSearchHistory() {
  console.log('Hiding search history');
  if (this.state.searchHistoryDropdown) {
    this.state.searchHistoryDropdown.style.display = 'none';
  }
},

async searchProducts(query) {
    try {
      const searchTerm = query.toLowerCase().trim();
      this.state.searchTerm = searchTerm;
      const currentLang = i18nManager.getCurrentLanguage();

      if (searchTerm) {
        this.updateSearchHistory(searchTerm);
      }

      // Fetch fresh products if needed to ensure we have latest translations
      const baseUrl = 'https://backend-3mvr.onrender.com/api/products';
      const url = new URL(this.state.selectedCategory ? 
        `${baseUrl}/category/${this.state.selectedCategory}` : 
        baseUrl
      );
      url.searchParams.append('lang', currentLang);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept-Language': currentLang
        }
      });

      if (!response.ok) throw new Error("Failed to fetch products");
      let products = await response.json();
      
      // Normalize response structure
      products = Array.isArray(products) ? products : 
                products.products ? products.products : 
                [products];

      // Transform products to include proper translations
      products = products.map(product => i18nManager.transformProductData(product));

      // If search is empty, show all products
      if (!searchTerm) {
        this.state.products = products;
        await this.renderProducts(products);
        return;
      }

      // Filter products using translated content
      const filteredProducts = products.filter(product => {
        const translatedName = i18nManager.getProductTranslation(product, 'name')?.toLowerCase() || '';
        const translatedDescription = i18nManager.getProductTranslation(product, 'description')?.toLowerCase() || '';
        const translatedCategory = i18nManager.getCategoryName(product.category)?.toLowerCase() || '';
        const price = product.price?.toString() || '';

        return translatedName.includes(searchTerm) || 
               translatedDescription.includes(searchTerm) || 
               translatedCategory.includes(searchTerm) ||
               price.includes(searchTerm);
      });

      this.state.products = filteredProducts;
      await this.renderProducts(filteredProducts);

      // Show no results message in current language
      if (filteredProducts.length === 0) {
        const noResultsMessage = i18nManager.translate('ui.messages.noProductsFound');
        showNotification(noResultsMessage, 'info');
      }

    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = i18nManager.translate('ui.messages.searchError');
      showNotification(errorMessage, 'error');
    }
  },
  setupSearch() {
  this.state.searchInput = document.getElementById('product-search');
  this.state.searchHistoryDropdown = document.getElementById('search-history');
  
  if (!this.state.searchInput) {
    console.warn('Search input element not found');
    return;
  }

  // Update placeholder text with translation
  this.state.searchInput.placeholder = i18nManager.translate('ui.labels.search');

  // Clear previous event listeners
  const newSearchInput = this.state.searchInput.cloneNode(true);
  this.state.searchInput.parentNode.replaceChild(newSearchInput, this.state.searchInput);
  this.state.searchInput = newSearchInput;

  // Setup search input event listener with debouncing
  this.state.searchInput.addEventListener('input', (e) => {
    clearTimeout(this.state.debounceTimeout);
    this.state.debounceTimeout = setTimeout(() => {
      this.searchProducts(e.target.value);
    }, 1000);
  });

  // Show search history on focus
  this.state.searchInput.addEventListener('focus', () => {
    this.showSearchHistory();
  });

  // Handle blur event
  this.state.searchInput.addEventListener('blur', () => {
    // We use setTimeout to allow for quick movement from input to dropdown
    setTimeout(() => {
      // Check if the focus is still within the dropdown
      if (!this.state.searchHistoryDropdown.contains(document.activeElement)) {
        this.hideSearchHistory();
      }
    }, 100); // A short delay to allow for quick interactions
  });

  // Handle form submission
  const searchForm = this.state.searchInput.closest('form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.searchProducts(this.state.searchInput.value);
    });
  }

  // Listen for language changes
  window.addEventListener('languageChanged', () => {
    // Update placeholder text when language changes
    this.state.searchInput.placeholder = i18nManager.translate('ui.labels.search');
    // Re-run search with current term if exists
    if (this.state.searchTerm) {
      this.searchProducts(this.state.searchTerm);
    }
  });
},
  async fetchCategories() {
    try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/categories');
      if (!response.ok) throw new Error(`Failed to fetch categories: ${response.statusText}`);

      const categories = await response.json();
      if (!Array.isArray(categories)) throw new Error("Categories data is not an array");

      this.state.categories = categories.map(category => ({
        ...category,
        displayName: i18nManager.getCategoryName(category)
      }));

      await this.renderCategories();
    } catch (error) {
      console.error("Error fetching categories:", error);
      showNotification(error.message, "error");
    }
  },
 async fetchProducts(categoryId = null) {
    try {
      const baseUrl = 'https://backend-3mvr.onrender.com/api/products';
      const currentLang = i18nManager.state.currentLanguage;
      
      const url = new URL(categoryId ? `${baseUrl}/category/${categoryId}` : baseUrl);
      url.searchParams.append('lang', currentLang);
      
      console.log('Fetching products from URL:', url.toString()); // Debug log
      
      const response = await fetch(url.toString(), {
        headers: {
          'Accept-Language': currentLang
        }
      });
      
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      
      console.log('Raw API response:', data); // Debug log
      
      // Clear existing products first
      this.state.products = [];
      
      // Use only the products from this response
      const products = Array.isArray(data) ? data : 
                      data.products ? data.products : 
                      [data];
      
      this.state.products = products.map(product => 
        i18nManager.transformProductData(product)
      );
      
      console.log('Processed products:', this.state.products); // Debug log
      
    } catch (error) {
      console.error("Error fetching products:", error);
      showNotification(error.message, "error");
    }
  },  
renderCategories() {
    const container = document.querySelector(".categories");
    if (!container) {
      console.error("Categories container not found");
      return;
    }

    container.innerHTML = "";
    const fragment = document.createDocumentFragment();

    // Create "All" button with proper translation
    const allButton = document.createElement("button");
    allButton.className = `category-btn ${this.state.selectedCategory === null ? "active" : ""}`;
    allButton.textContent = i18nManager.translate('ui.buttons.all');
    allButton.onclick = () => this.selectCategory(null);
    fragment.appendChild(allButton);

    // Rest of the categories
    this.state.categories.forEach(category => {
      const button = document.createElement("button");
      button.className = `category-btn ${this.state.selectedCategory === category.id ? "active" : ""}`;
      button.setAttribute("data-id", category.id);
      button.textContent = category.displayName;
      button.onclick = () => this.selectCategory(category.id);
      fragment.appendChild(button);
    });

    container.appendChild(fragment);
    this.ensureCategoryStylesExist();
  },

// async selectCategory(categoryId) {
//     console.log('Selecting category:', categoryId);
//     this.state.selectedCategory = categoryId;
//     console.log('After setting:', this.state.selectedCategory);
//     await this.renderCategories();
//     await this.fetchProducts(categoryId);
//   const products = this.state.products;
//  // Ensure this only contains the category-specific products
// await this.renderProducts(this.state.products);

//   // ... rest of the method

    
   
    
//     // Add debug logging to verify state after fetch
//     console.log('Current products after category selection:', this.state.products);
// },
 async selectCategory(categoryId) {
    console.log('Selecting category:', categoryId);
    this.state.selectedCategory = categoryId;
    this.state.searchTerm = '';
    
    const searchInput = document.getElementById('product-search');
    if (searchInput) 
    {
      searchInput.value = '';
    }

    console.log('After setting:', this.state.selectedCategory);
    await this.renderCategories();
    await this.fetchProducts(categoryId);
    console.log('Fetched products for category:', this.state.products);
    await this.renderProducts(this.state.products);
  },
ensureCategoryStylesExist() {
    if (!document.querySelector('#category-styles')) {
      const styles = document.createElement('style');
      styles.id = 'category-styles';
      styles.textContent = `
        .categories {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
          padding: 10px;
        }

        .category-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 20px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          color: #444;
          min-width: 80px;
          text-align: center;
        }

        .category-btn:hover {
          background: #f5f5f5;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .category-btn.active {
          background: #007bff;
          color: white;
          border-color: #0056b3;
        }

        .category-btn.active:hover {
          background: #0056b3;
        }

        @media (max-width: 768px) {
          .categories {
            gap: 8px;
            padding: 8px;
          }

          .category-btn {
            padding: 6px 12px;
            font-size: 13px;
            min-width: 70px;
          }
        }
      `;
      document.head.appendChild(styles);
    }
  },

// Helper methods to keep the main render method clean

createImageSlider(product, productName) {
  const safeProductName = productName || product.name || 'Product';
  
  // Ensure we have an array of images
  const images = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : [product.image_url || '/images/default-product-image.jpg'];

  let sliderHtml = `
    <div class="image-slider" data-product-id="${product.product_id}">
      <div class="slider-track">
  `;
  
  // Add all images
  images.forEach((img, index) => {
    sliderHtml += `
      <div class="slider-slide${index === 0 ? ' active' : ''}" data-index="${index}">
        <img 
          src="${img}" 
          alt="${safeProductName}${images.length > 1 ? ` - Image ${index + 1}` : ''}"
          loading="lazy"
          onerror="this.onerror=null; this.src='/images/default-product-image.jpg';"
        >
      </div>
    `;
  });
  
  sliderHtml += '</div>'; // Close slider-track

  // Only add navigation if there are multiple images
  if (images.length > 1) {
    sliderHtml += `
      <button class="slider-nav prev" aria-label="Previous image">❮</button>
      <button class="slider-nav next" aria-label="Next image">❯</button>
      <div class="slider-dots">
        ${images.map((_, i) => `
          <button class="slider-dot${i === 0 ? ' active' : ''}" 
            data-index="${i}" 
            aria-label="Go to image ${i + 1}">
          </button>
        `).join('')}
      </div>
    `;
  }

  sliderHtml += '</div>'; // Close image-slider
  return sliderHtml;
},

initializeImageSliders() {
  document.querySelectorAll('.image-slider').forEach(slider => {
    const gridItem = slider.closest('.grid-item');
    const productId = gridItem?.dataset.productId;
    const product = this.state.products.find(p => p.product_id.toString() === productId);
    
    if (!product) return;
    // Skip if already initialized or has only one image
    if (slider.dataset.initialized === 'true') return;
    
    const slides = slider.querySelectorAll('.slider-slide');
    if (slides.length <= 1) return;

    let currentIndex = 0;
    let autoPlayInterval;
    const productContent = slider.closest('.product-content');

    // Function to update active slide
    const updateSlide = (newIndex) => {
      slides[currentIndex].classList.remove('active');
      slider.querySelector(`.slider-dot[data-index="${currentIndex}"]`)?.classList.remove('active');
      
      currentIndex = newIndex;
      
      slides[currentIndex].classList.add('active');
      slider.querySelector(`.slider-dot[data-index="${currentIndex}"]`)?.classList.add('active');
    };

    // Function to start autoplay
    const startAutoPlay = () => {
      stopAutoPlay(); // Clear any existing interval
      autoPlayInterval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % slides.length;
        updateSlide(nextIndex);
      }, 5000);
    };

    // Function to stop autoplay
    const stopAutoPlay = () => {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
      }
    };

    // Previous button click handler
    const prevButton = slider.querySelector('.prev');
    if (prevButton) {
      prevButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlide(prevIndex);
        stopAutoPlay();
        startAutoPlay();
      });
    }

    // Next button click handler
    const nextButton = slider.querySelector('.next');
    if (nextButton) {
      nextButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const nextIndex = (currentIndex + 1) % slides.length;
        updateSlide(nextIndex);
        stopAutoPlay();
        startAutoPlay();
      });
    }

    // Dot navigation
    slider.querySelectorAll('.slider-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const newIndex = parseInt(dot.dataset.index);
        updateSlide(newIndex);
        stopAutoPlay();
        startAutoPlay();
      });
    });

    // Add click handler for product content that excludes slider controls
    if (productContent) {
      productContent.addEventListener('click', (e) => {
        // Only open product page if not clicking slider controls
        if (!e.target.closest('.slider-nav') && !e.target.closest('.slider-dot')) {
          productPageManager.openProductPage(product);
        }
      });
    }

    // Start/stop autoplay on hover
    slider.addEventListener('mouseenter', stopAutoPlay);
    slider.addEventListener('mouseleave', startAutoPlay);

    // Start autoplay initially
    startAutoPlay();

    // Mark as initialized
    slider.dataset.initialized = 'true';
  });
},
createButtonsContainer(product, translations, buttonTemplate) {
  const container = document.createElement("div");
  container.className = "product-buttons";

  // Add to Cart button
  const addToCartButton = buttonTemplate.cloneNode();
  addToCartButton.innerHTML = '<i class="fas fa-shopping-cart"></i>'; 
  addToCartButton.className = "add-to-cart-btn";
  addToCartButton.title = translations.addToCart;
  addToCartButton.addEventListener("click", (e) => {
    e.stopPropagation();
    cartManager.addItem(product.product_id);
  });

  // Share button
  const shareButton = buttonTemplate.cloneNode();
  shareButton.innerHTML = '<i class="fas fa-share-alt"></i>'; 
  shareButton.className = "share-btn";
  shareButton.title = translations.share;
  shareButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    socialSharingManager.showShareOptions(product);
  });

  // Rate button
  const rateButton = buttonTemplate.cloneNode();
  rateButton.innerHTML = '<i class="fas fa-star"></i>';  
  rateButton.className = "rate-btn";
  rateButton.title = translations.rate;
  rateButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    ratingManager.openRatingModal(product.product_id.toString(), e);
  });

  container.append(addToCartButton, shareButton, rateButton);
  return container;
},

ensureStylesExist() {
  if (!document.querySelector('#product-buttons-styles')) {
    const styles = document.createElement('style');
    styles.id = 'product-buttons-styles';
    styles.textContent = `
      .product-buttons {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 10;
      }
 .image-slider {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.slider-track {
  position: relative;
  width: 100%;
  height: 100%;
}

.slider-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.slider-slide.active {
  opacity: 1;
  z-index: 1;
}

.slider-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
  .slider-nav, .slider-dot {
      pointer-events: auto;
    }
    
    .product-content {
      position: relative;
      cursor: pointer;
    }
    
    .image-slider {
      pointer-events: none;  /* Prevent slider from catching clicks */
    }
    
    .slider-nav, .slider-dot, .product-buttons button {
      pointer-events: auto;  /* Re-enable clicks for controls */
    }
.product-buttons {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 10;
      }

      .product-buttons button {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }

      .product-buttons button:hover {
        transform: scale(1.1);
        background: white;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
      .slider-track {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .slider-slide {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .slider-slide.active {
        opacity: 1;
        z-index: 1;
      }

      .slider-slide img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .slider-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.8);
        border: none;
        border-radius: 50%;
        font-size: 24px;
        line-height: 1;
        color: #444;
        cursor: pointer;
        z-index: 2;
        transition: all 0.2s ease;
      }

      .slider-nav:hover {
        background: rgba(255, 255, 255, 0.95);
        transform: translateY(-50%) scale(1.1);
      }

      .slider-nav.prev {
        left: 10px;
      }

      .slider-nav.next {
        right: 10px;
      }

      .slider-dots {
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        z-index: 2;
      }

      .slider-dot {
        width: 8px;
        height: 8px;
        border: none;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        padding: 0;
        transition: all 0.2s ease;
      }

      .slider-dot.active {
        background: white;
        transform: scale(1.2);
      }

      /* Keep existing product-buttons styles */
      .product-buttons {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 10;
      }

      .product-buttons button {
        width: 32px;
        height: 32px;
        min-width: 32px;
        border-radius: 50%;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        color: #444;
      }

      .product-buttons button i {
        font-size: 14px;
      }

      .product-buttons button:hover {
        transform: scale(1.1);
        background: white;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .product-buttons button:active {
        transform: scale(0.95);
      }
      .product-buttons button {
        width: 32px;
        height: 32px;
        min-width: 32px;  /* Prevent text from expanding button */
        border-radius: 50%;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        color: #444;  /* Icon color */
      }

      .product-buttons button i {
        font-size: 14px;  /* Icon size */
      }

      .product-buttons button:hover {
        transform: scale(1.1);
        background: white;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .product-buttons button:active {
        transform: scale(0.95);
      }
    `;
    document.head.appendChild(styles);
  }
},

 async renderProducts(products) {
    const gridContainer = document.querySelector(".grid-container");
    if (!gridContainer) return;

    // Clear container
    gridContainer.innerHTML = "";
    
    // Handle empty state
    if (!products || products.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'No products found';
      gridContainer.appendChild(emptyState);
      return;
    }

    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Cache translations
    const translations = {
      addToCart: i18nManager.translate('ui.buttons.addToCart'),
      share: i18nManager.translate('ui.buttons.share'),
      rate: i18nManager.translate('ui.buttons.rate'),
      stock: i18nManager.translate('ui.labels.stock')
    };
    
    // Create button template
    const buttonTemplate = document.createElement('button');

    // Render each product
    products.forEach((product) => {
      const gridItem = document.createElement("div");
      gridItem.className = "grid-item grid-item-xl";
      gridItem.dataset.productId = product.product_id;

      const productName = i18nManager.getProductTranslation(product, 'name');
      
      const productContent = document.createElement("div");
      productContent.className = "product-content";
      
      const imageSlider = this.createImageSlider(product, productName);
      
      const formattedPrice = window.cryptoManager ? 
        cryptoManager.formatCryptoPrice(product.price) : 
        new Intl.NumberFormat(i18nManager.getCurrentLanguage(), {
          style: 'currency',
          currency: 'USD'
        }).format(product.price);
      
      productContent.innerHTML = `
        ${imageSlider}
        <div class="overlay">
          <span class="product-name">${productName}</span> | 
          <span class="price-span" data-usd-price="${product.price}">
            ${formattedPrice}
          </span>
          | ${translations.stock}: ${product.stock}
        </div>
      `;

      // Add product click handler with error boundary
      productContent.addEventListener("click", (e) => {
        try {
          if (window.productPageManager) {
            productPageManager.openProductPage(product);
          }
        } catch (error) {
          console.error('Error opening product page:', error);
        }
      });
      
      const buttonsContainer = this.createButtonsContainer(product, translations, buttonTemplate);
      
      gridItem.append(productContent, buttonsContainer);
      fragment.appendChild(gridItem);
    });
    
    // Append all items at once
    gridContainer.appendChild(fragment);

    // Initialize sliders after DOM is updated
    requestAnimationFrame(() => {
      try {
        this.initializeImageSliders();
      } catch (error) {
        console.error('Error initializing image sliders:', error);
      }
    });

    // Ensure styles exist
    this.ensureStylesExist();

    // Update related managers if needed
    try {
      await this.updateRelatedManagers();
    } catch (error) {
      console.error('Error updating related managers:', error);
    }
  },
  highlightSelectedCategory() {
  // Remove 'active' class from all buttons
    document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));

    if (this.state.selectedCategory === null) {
        // Highlight the "All" button
        const allButton = document.querySelector('.category-btn:first-child');
        if (allButton) allButton.classList.add("active");
    } else {
        // Highlight the button matching the selected category
        const activeButton = document.querySelector(`.category-btn[data-id="${this.state.selectedCategory}"]`);
        if (activeButton) activeButton.classList.add("active");
    }
},
async updateRelatedManagers() {
  // Check if there's a selected category
  if (this.state.selectedCategory !== null) {
    // Update only with products from the selected category
    const categoryProducts = this.state.products.filter(p => p.category_id === this.state.selectedCategory);
    productPageManager.updateProducts(categoryProducts);
    console.log("Updated productPageManager with category products:", categoryProducts);
  } else {
    // If 'All' is selected, update with all products
    productPageManager.updateProducts(this.state.products);
    console.log("Updated productPageManager with all products:", this.state.products);
  }

  // Initialize rating manager if not done yet
  if (!window.ratingManagerInitialized) {
    ratingManager.initialize();
    window.ratingManagerInitialized = true;
  }
  
  // Fetch user ratings which can be used across all or specific products
  await ratingManager.fetchUserRatings();

  // Initialize image sliders for the products currently displayed
  this.initializeImageSliders();
},
};
// document.addEventListener("DOMContentLoaded", async () => {
//   try {
//     // Initialize all managers in parallel with proper error handling
//     await Promise.allSettled([
//       i18nManager.initialize(),
//       categoryManager.initialize(),
//       cryptoManager.initialize(),
//       ratingManager.initialize(),
//       paymentManager.initialize('pk_test_51QZ5BBGhX6Xc3FUkDACPmuOMhQWtYAsoMwr3KMyH4XaJmEc7kYC5cZjWsuJX9ZeG36PXyjHAHFKpOnWvmYQKYScV00F3qNFmnl'),
//       recommendationManager.initialize(),
//       productPageManager.initialize(),
      
     
//     ]).then(results => {
//       // Log any failures during initialization
//       results.forEach((result, index) => {
//         if (result.status === 'rejected') {
//           console.error(`Manager ${index} failed to initialize:`, result.reason);
//         }
//       });
//     });

//     // Fetch user data and update UI
//     currentUser = await authManager.fetchCurrentUser();
    
//     // Initialize UI components
//     authManager.displayUserInfo();
//     authManager.displayUserAvatar();
//     cartManager.updateDisplay();
    
//     setupEventListeners();
//     uiManager.updateButtonVisibility(currentUser);
    
//     // Handle direct navigation last, after all initialization is complete
//     productPageManager.handleNavigation();
    
//   } catch (error) {
//     console.error("Error during initialization:", error);
//     showNotification("Error initializing application", "error");
//   }
// });
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Initialize all managers in parallel with proper error handling
    await Promise.allSettled([
      i18nManager.initialize(),
      categoryManager.initialize(),
      cryptoManager.initialize(),
      ratingManager.initialize(),
      paymentManager.initialize('pk_test_51QZ5BBGhX6Xc3FUkDACPmuOMhQWtYAsoMwr3KMyH4XaJmEc7kYC5cZjWsuJX9ZeG36PXyjHAHFKpOnWvmYQKYScV00F3qNFmnl'),
      recommendationManager.initialize(),
      productPageManager.initialize(),
    ]).then(results => {
      // Log any failures during initialization
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Manager ${index} failed to initialize:`, result.reason);
        }
      });
    });

    // Fetch user data and update UI
    const currentUser = await authManager.fetchCurrentUser();
    console.log('Fetched currentUser:', currentUser);
    
    // Initialize UI components
    authManager.displayUserInfo();
    authManager.displayUserAvatar();
    cartManager.updateDisplay();
    
    // Use the unified uiManager for button visibility
    uiManager.updateButtonVisibility(currentUser);
    
    // Handle direct navigation last, after all initialization is complete
    productPageManager.handleNavigation();
    
    // Setup event listeners after all UI elements are updated
    setupEventListeners();

  } catch (error) {
    console.error("Error during initialization:", error);
    showNotification("Error initializing application", "error");
  }
});
// Make managers available globally
window.authManager = authManager;
window.cartManager = cartManager;
window.paymentManager = paymentManager;
window.uiManager = uiManager;
window.categoryManager = categoryManager;
window.cryptoManager = cryptoManager;
window.ratingManager = ratingManager;
window.recommendationManager = recommendationManager;
window.socialSharingManager = socialSharingManager;
window.productPageManager = productPageManager;
window.i18nManager = i18nManager;

function initializeImageSliders() {
  document.querySelectorAll('.image-slider').forEach(slider => {
    const images = slider.querySelectorAll('img');
    if (images.length <= 1) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      images[currentIndex].classList.remove('active');
      currentIndex = (currentIndex + 1) % images.length;
      images[currentIndex].classList.add('active');
    }, 3000);

    // Clean up interval when slider is removed
    slider.dataset.sliderId = interval;
  });
}

function attachCartEventListeners() {
  document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.parentElement.getAttribute("data-product-id");
      if (productId) {
        cartManager.addItem(productId);
      }
    });
  });
}

function setupEventListeners() {
  const elements = {
    registerBtn: document.getElementById("register-btn"),
    closeRegisterBtn: document.querySelector(".close-register"),
    loginBtn: document.getElementById("login-btn"),
    loginCloseBtn: document.querySelector(".close-login"),
    logoutBtn: document.getElementById("logout-button"),
    checkoutButton: document.querySelector('button[onclick="checkout()"]'),
    emptyCartButton: document.getElementById("empty-cart-button"),
    loginForm: document.getElementById("login-form"),
    registerForm: document.getElementById("register-form")
  };

  // Add event listeners only if elements exist
  if (elements.closeRegisterBtn) {
    elements.closeRegisterBtn.addEventListener("click", uiManager.closeRegister);
  }
  if (elements.registerBtn) {
    elements.registerBtn.addEventListener("click", uiManager.openRegister);
  }
  if (elements.loginBtn) {
    elements.loginBtn.addEventListener("click", uiManager.openLogin);
  }
  if (elements.loginCloseBtn) {
    elements.loginCloseBtn.addEventListener("click", uiManager.closeLogin);
  }
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener("click", () => authManager.logout());
  }
  // if (elements.checkoutButton) {
  //   elements.checkoutButton.addEventListener("click", () => paymentManager.initiateCheckout());
  // }
  // if (elements.emptyCartButton) {
  //   elements.emptyCartButton.addEventListener("click", () => cartManager.clearCart());
  // }
  uiManager.updateButtonVisibility(currentUser);
};


function showNotification(message, type = 'success',) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.className = `notification ${type}-message`;
  document.body.appendChild(notification);

  notification.style.animation = 'slideIn 0.3s ease-out';

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}