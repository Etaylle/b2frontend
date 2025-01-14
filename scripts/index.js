// Global state
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

// Cart state management
const cartManager = {
async fetchCart() {
    try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/cart',  {
        ...fetchConfig,
        
        credentials: 'include'
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

  async addItem(productId) {
    try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/cart/add', {
        method: 'POST',
        credentials: 'include',
        headers: fetchConfig.headers,
        body: JSON.stringify({ productId, quantity: 1 })
      });

      if (!response.ok) throw new Error('Failed to add to cart');
      await this.updateDisplay();
      showNotification('Added to cart!', 'success');
    } catch (error) {
      console.error('Error:', error);
      
      showNotification('Out of stock!', 'error');
    }
  },

  async removeItem(productId) {
    if (!productId) {
      console.error('Invalid product ID');
      return;}
    try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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

  async updateQuantity(productId, quantity) {
    try {
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
      try {
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
    async completePurchase() {
      console.log('OVO JE NASTAVAK');
      try {
        const response = await fetch('https://backend-3mvr.onrender.com/api/cart/complete-purchase', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
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
    }
  ,
  


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
          <span class="item-price"> ${parseFloat(productPrice).toFixed(2)} $ |</span>
          <span class="item-quantity">Quantity: ${item.quantity}</span>
        </div>
        <div class="cart-item-controls">
          <button class="quantity-btn minus" data-id="${productId}">-</button>
          <button class="quantity-btn plus" data-id="${productId}">+</button>
          <button class="remove-btn" data-id="${productId}">Remove</button>
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

  updateButtonVisibility: (currentUser) => {
    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");
    const logoutBtn = document.getElementById("logout-button");
    const logo2 = document.querySelector(".credit-info");
    const userAvatar = document.querySelector(".user-avatar-display");
    const navLinks = document.querySelector('.navbar');
    const adminLink = document.getElementById("admin-link");
    if (currentUser) {
      // Hide login and register buttons
      if (loginBtn) loginBtn.style.display = "none";
      if (registerBtn) registerBtn.style.display = "none";
  
      // Show elements like logout and avatars
      if (logoutBtn) logoutBtn.style.display = "block";
      if (logo2) logo2.style.display = "flex";
      if (userAvatar) userAvatar.style.display = "flex";
    

  
      // Handle admin link visibility
      if (currentUser.role === 'admin') {
        if (adminLink) {
            adminLink.style.display = "block";
        } else if (navLinks) {
            const newAdminLink = document.createElement('a');
            newAdminLink.href = '/admin';
            newAdminLink.textContent = 'Admin Panel';
            newAdminLink.id = 'admin-link';
            navLinks.appendChild(newAdminLink);
        }
    } else if (adminLink) {
        adminLink.style.display = 'none';
    }
} else {
    // Show login and register buttons
    if (loginBtn) loginBtn.style.display = "block";
    if (registerBtn) registerBtn.style.display = "block";

    // Hide logout button and credit info
    if (logoutBtn) logoutBtn.style.display = "none";
    if (logo2) logo2.style.display = "none";
    if (userAvatar) userAvatar.style.display = "none";
    // Hide admin link if it exists
    if (adminLink) adminLink.style.display = 'none';
}
    
  }
};

// Auth Management
const authManager = {
  // async fetchCurrentUser() {
  //   try {
  //     const response = await fetch('https://backend-3mvr.onrender.com/api/users/current', {
  //       ...fetchConfig,
  //       credentials: 'include'
  //     });
  //     if (!response.ok) throw new Error('Auth failed');
  //     return await response.json();
  //   } catch (error) {
  //     console.error(error);
  //     return null;
  //   }
  // },

 
  
//   async login(event) {
//     event.preventDefault();

//     const email = document.getElementById("email").value;
//     const password = document.getElementById("password").value;

//     try {
//       const response = await fetch("https://backend-3mvr.onrender.com/api/auth/login", {
//         ...fetchConfig,  // Use the base config
//       method: "POST",
//       body: JSON.stringify({ email, password })
//       });

//       const data = await response.json();
      
//       if (response.ok) {
//         showNotification('Login successful!', 'success');
//         uiManager.closeLogin();
//         window.location.reload();
//       } else {
//         showNotification(data.message, 'error');
//       }
//     } catch (error) {
//       showNotification(error.message, 'error');
//     }
//   },

//   async logout() {
//     try {
//       const response = await fetch('https://backend-3mvr.onrender.com/api/auth/logout', {
//         method: "POST",
//         credentials: 'include',
//         headers: fetchConfig.headers
//       });

//       if (response.ok) {
//         // Clear any local storage if you're using it
//         localStorage.clear();
//         window.location.reload();
//       } else {
//         showNotification('Failed to log out', 'error');
//       }
//     } catch (error) {
//       showNotification('Error logging out', 'error');
//     }
//   }
// ,
// async register(event) {
//     event.preventDefault();

//     const username = document.getElementById("username").value;
//     const firstname = document.getElementById("firstname").value;
//     const lastname = document.getElementById("lastname").value;
//     const email = document.getElementById("reg-email").value;
//     const password = document.getElementById("reg-password").value;

//     try {
//       const response = await fetch('https://backend-3mvr.onrender.com/api/auth/register', {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ username, firstname, lastname, email, password }),
//       });

//       if (response.ok) {
//         showNotification('Registration successful!', 'success');
//         uiManager.closeRegister();
//         window.location.href = "index.html";
//       } else {
//         const data = await response.json();
//         showNotification(data.message, 'error');
//       }
//     } catch (error) {
//       showNotification(error.message, 'error');
//     }
//   },

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
// Payment Management
const paymentManager = {
  stripe: null,

  initialize(publicKey) {
    this.stripe = Stripe(publicKey);
  },

  async initiateCheckout() {
    try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/create-checkout-session', {
        method: 'POST',
        credentials: 'include'
      });
      //await cartManager.clearCart();
      showNotification('Order placed successfully!', 'success');
      const data = await response.json();
      const result = await this.stripe.redirectToCheckout({ sessionId: data.id });
      
    
      if (result.error) {
        showNotification(result.error.message, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Failed to start checkout process', 'error');
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
    // Handle product card click
    if (e.target.closest('.grid-item') && !e.target.closest('.rating-modal')) {
      const productId = e.target.closest('.grid-item').dataset.productId;
      await this.openRatingModal(productId);
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
      <span class="crypto-label"> <a href="#" aria-label="Show Crypto Prices">Show Crypto Prices</a></span>
      
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
      const currentProduct = products.find(p => p.product_id === productId);
      if (!currentProduct) throw new Error("Product not found");
      this.state.currentProduct = currentProduct;

      // Get products from the same category
      const categoryResponse = await fetch(`https://backend-3mvr.onrender.com/api/products/category/${currentProduct.category_id}`);
      if (!categoryResponse.ok) throw new Error("Failed to fetch recommendations");
      const categoryData = await categoryResponse.json();
      let recommendations = categoryData.success ? categoryData.products : categoryData;

      // Filter out the current product and limit to 4 recommendations
      recommendations = recommendations
        .filter(p => p.product_id !== productId)
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
      <h3>Sie könnten auch mögen:</h3>
      <div class="recommendations-grid"></div>
    `;

    const grid = container.querySelector('.recommendations-grid');

    this.state.recommendedProducts.forEach(product => {
      const productElement = document.createElement('div');
      productElement.className = 'recommended-product';
      productElement.innerHTML = `
        <img src="${product.image_url || '/images/default-product-image.jpg'}" alt="${product.name}">
        <h4>${product.name}</h4>
        <p>${cryptoManager.formatCryptoPrice(product.price)}</p>
        <div class="product-rating">
          ${'★'.repeat(Math.round(product.average_rating || 0))}${'☆'.repeat(5 - Math.round(product.average_rating || 0))}
          (${product.total_ratings || 0})
        </div>
        <button class="recommend-add-to-cart">In den Warenkorb</button>
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
};
const socialSharingManager = {
  // Get the current website URL
  getBaseUrl() {
    return window.location.origin;
  },

  // Create sharing URLs for different platforms
  getSharingUrls(product) {
    const productUrl = `${this.getBaseUrl()}/product/${product.product_id}`;
    const text = `Schau dir ${product.name} an! Preis: ${cryptoManager.formatCryptoPrice(product.price)}`;
    
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + productUrl)}`,
    };
  },

  // Add sharing buttons to product display
  addSharingButtons(productElement, product) {
    const sharingUrls = this.getSharingUrls(product);
    
    const sharingContainer = document.createElement('div');
    sharingContainer.className = 'social-sharing';
    sharingContainer.innerHTML = `
      <div class="sharing-buttons">
        <button onclick="window.open('${sharingUrls.facebook}', '_blank')" class="share-btn facebook">
          Auf Facebook teilen
        </button>
        <button onclick="window.open('${sharingUrls.twitter}', '_blank')" class="share-btn twitter">
          Auf Twitter teilen
        </button>
        <button onclick="window.open('${sharingUrls.whatsapp}', '_blank')" class="share-btn whatsapp">
          Auf WhatsApp teilen
        </button>
      </div>
    `;

    // Add native share button if Web Share API is supported
    if (navigator.share) {
      const nativeShareBtn = document.createElement('button');
      nativeShareBtn.className = 'share-btn native-share';
      nativeShareBtn.textContent = 'Teilen';
      nativeShareBtn.onclick = () => this.nativeShare(product);
      sharingContainer.querySelector('.sharing-buttons').appendChild(nativeShareBtn);
    }

    productElement.appendChild(sharingContainer);
  },

  // Use native sharing if available (mobile devices)
  async nativeShare(product) {
    const shareData = {
      title: product.name,
      text: `Schau dir ${product.name} an! Preis: ${cryptoManager.formatCryptoPrice(product.price)}`,
      url: `${this.getBaseUrl()}/product/${product.product_id}`
    };

    try {
      await navigator.share(shareData);
      showNotification('Erfolgreich geteilt!', 'success');
    } catch (err) {
      console.error('Error sharing:', err);
      showNotification('Fehler beim Teilen', 'error');
    }
  },

  // Initialize social sharing
  initialize() {
    // Modify the categoryManager's renderProducts method to include sharing buttons
    const originalRenderProducts = categoryManager.renderProducts;
    categoryManager.renderProducts = async function() {
      await originalRenderProducts.call(this);
      
      // Add sharing buttons to each product
      document.querySelectorAll('.grid-item').forEach(item => {
        const productId = item.getAttribute('data-product-id');
        const product = this.state.products.find(p => p.product_id === productId);
        if (product) {
          socialSharingManager.addSharingButtons(item, product);
        }
      });
    };
  }
};

const categoryManager = {
  state: {
    categories: [],
    selectedCategory: null,
    products: [],
    searchTerm: ''
  },
  async searchProducts(searchTerm) {
    this.state.searchTerm = searchTerm.toLowerCase();
    
    try {
      // If search is cleared (empty), fetch all products or category products
      if (!searchTerm.trim()) {
        if (this.state.selectedCategory) {
          await this.fetchProducts(this.state.selectedCategory);
        } else {
          await this.fetchProducts();
        }
        return;
      }

      let filteredProducts;
      
      if (this.state.selectedCategory) {
        // If a category is selected, search within that category
        const response = await fetch(`https://backend-3mvr.onrender.com/api/products/category/${this.state.selectedCategory}`);
        if (!response.ok) throw new Error("Failed to fetch category products");
        filteredProducts = await response.json();
      } else {
        // If no category is selected, search all products
        const response = await fetch('https://backend-3mvr.onrender.com/api/products');
        if (!response.ok) throw new Error("Failed to fetch products");
        filteredProducts = await response.json();
      }

      // Filter products based on search term
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(this.state.searchTerm) ||
        //product.description?.toLowerCase().includes(this.state.searchTerm) ||
        product.price.toString().includes(this.state.searchTerm)
      );

      // Update the products display with filtered results
      this.state.products = filteredProducts;
      await this.renderProducts();
      
      // Show a message if no results found
      if (filteredProducts.length === 0) {
        showNotification('No products found matching your search', 'info');
      }
    } catch (error) {
      console.error("Error searching products:", error);
      showNotification(error.message, "error");
    }
  },
  async fetchCategories() {
    try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/categories');
      if (!response.ok) throw new Error(`Failed to fetch categories: ${response.statusText}`);

      const categories = await response.json();
      if (!Array.isArray(categories)) throw new Error("Categories data is not an array");

      this.state.categories = categories;
      await this.renderCategories();
      await this.fetchProducts(); // Fetch initial products
    } catch (error) {
      console.error("Error fetching categories:", error);
      showNotification(error.message, "error");
    }
  },
async fetchProducts(categoryId = null) {
  try {
    const baseUrl = 'https://backend-3mvr.onrender.com/api/products';
    const url = categoryId ? `${baseUrl}/category/${categoryId}` : baseUrl;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error("Failed to fetch products");
    const data = await response.json();
    
    // Check if the response has the new format with success property
    if (data.success) {
      this.state.products = data.products; // Access products array from the response
    } else {
      this.state.products = data; // Fallback for old format
    }
    
    await this.renderProducts();
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

    container.innerHTML = ""; // Clear existing categories

    // Create "All" button
    const allButton = document.createElement("button");
    allButton.className = `category-btn ${this.state.selectedCategory === null ? "active" : ""}`;
    allButton.textContent = "All";
    allButton.onclick = () => this.selectCategory(null);
    container.appendChild(allButton);

    // Create category buttons
    this.state.categories.forEach(category => {
      const button = document.createElement("button");
      button.className = `category-btn ${this.state.selectedCategory === category.id ? "active" : ""}`;
      button.setAttribute("data-id", category.id);
      button.textContent = category.name;
      button.onclick = () => this.selectCategory(category.id);
      container.appendChild(button);
    });
  },

  async selectCategory(categoryId) {
    this.state.selectedCategory = categoryId;
    await this.fetchProducts(categoryId);
    this.highlightSelectedCategory();
  },
async renderProducts() {
  const gridContainer = document.querySelector(".grid-container");
  if (!gridContainer) return;
  
  // Set product data for rating manager first
  ratingManager.setProductData(this.state.products);
  gridContainer.innerHTML = "";

  this.state.products.forEach((product) => {
    const gridItem = document.createElement("div");
    gridItem.classList.add("grid-item", "grid-item-xl");
    gridItem.setAttribute("data-product-id", product.product_id);

    // Create image slider
    let imageSlider = '<div class="image-slider">';
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((img, index) => {
        imageSlider += `<img src="${img}" alt="${product.name} - Image ${index + 1}" ${index === 0 ? 'class="active"' : ''}>`;
      });
    } else if (product.image_url) {
      imageSlider += `<img src="${product.image_url}" alt="${product.name}" class="active">`;
    } else {
      imageSlider += '<img src="/images/default-product-image.jpg" alt="Default Image" class="active">';
    }
    imageSlider += '</div>';

    // Create rating display HTML
    const ratingHTML = ratingManager.createProductRating(
      product.product_id,
      product.average_rating || 0,
      product.total_ratings || 0
    );

    // Properly structure the grid item content
    gridItem.innerHTML = `
      <div class="product-content">
        ${imageSlider}
        
        <div class="overlay">
          ${product.name} | <span class="price-span" data-usd-price="${product.price}">
            ${cryptoManager.formatCryptoPrice(product.price)}
          </span>
          | Stock: ${product.stock}
        </div>
      </div>
    `;
    
    // Add the cart button
    const addToCartButton = document.createElement("button");
    addToCartButton.textContent = "+";
    addToCartButton.className = "add-to-cart-btn";
    gridItem.appendChild(addToCartButton);

    // Add click handler for cart button
    addToCartButton.addEventListener("click", (e) => {
      e.stopPropagation();
      cartManager.addItem(product.product_id);
    });

    gridContainer.appendChild(gridItem);
  });

  // Initialize rating manager if needed
  if (!window.ratingManagerInitialized) {
    ratingManager.initialize();
    window.ratingManagerInitialized = true;
  }

  // Fetch ratings and initialize sliders
  await ratingManager.fetchUserRatings();
  this.initializeImageSliders();
},

  initializeImageSliders() {
    document.querySelectorAll('.image-slider').forEach(slider => {
      const images = slider.querySelectorAll('img');
      if (images.length <= 1) return;

      let currentIndex = 0;
      setInterval(() => {
        images[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.add('active');
      }, 3000);
    });
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
  
    async initialize() {
    await this.fetchCategories();
    await this.setupSearch();
  },
    setupSearch() {
      const searchInput = document.getElementById('product-search');
      let debounceTimeout;
  
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            this.searchProducts(e.target.value);
          }, 300);
        });
  
        // Add clear search functionality
        const clearSearch = document.createElement('button');
        clearSearch.innerHTML = '×';
        clearSearch.className = 'clear-search';
        clearSearch.onclick = () => {
          searchInput.value = '';
          this.searchProducts(''); 
        };
        searchInput.parentNode.appendChild(clearSearch);
      }
    }
};

// Initialize everything when the page loads
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Initialize all managers
    await Promise.all([
      cryptoManager.initialize(),
      ratingManager.initialize(),
      categoryManager.initialize(),
      paymentManager.initialize('pk_test_51QZ5BBGhX6Xc3FUkDACPmuOMhQWtYAsoMwr3KMyH4XaJmEc7kYC5cZjWsuJX9ZeG36PXyjHAHFKpOnWvmYQKYScV00F3qNFmnl'),
      recommendationManager.initialize(),
      socialSharingManager.initialize(),
    ]);

    // Fetch initial data
    currentUser = await authManager.fetchCurrentUser();
    
    // Initialize displays
    authManager.displayUserInfo();
    authManager.displayUserAvatar();
    cartManager.updateDisplay();

    // Set up UI event listeners
    setupEventListeners();
    
    // Update UI based on user state
    uiManager.updateButtonVisibility(currentUser);
    
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
async function fetchProducts(categoryId = null) {
  try {
    const baseUrl = 'https://backend-3mvr.onrender.com/api/products';
    const url = categoryId ? `${baseUrl}/category/${categoryId}` : baseUrl;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error("Failed to fetch products");
    const data = await response.json();
    
    // Check if the response has the new format with success property
    if (data.success) {
      this.state.products = data.products; // Access products array from the response
    } else {
      this.state.products = data; // Fallback for old format
    }
    
    await this.renderProducts();
  } catch (error) {
    console.error("Error fetching products:", error);
    showNotification(error.message, "error");
  }

}
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
  if (elements.checkoutButton) {
    elements.checkoutButton.addEventListener("click", () => paymentManager.initiateCheckout());
  }
  if (elements.emptyCartButton) {
    elements.emptyCartButton.addEventListener("click", () => cartManager.clearCart());
  }
  // if (elements.loginForm) {
  //   elements.loginForm.addEventListener("submit", (e) => authManager.login(e));
  // }
  // if (elements.registerForm) {
  //   elements.registerForm.addEventListener("submit", (e) => authManager.register(e));
  // }

  // Update UI based on user state
  uiManager.updateButtonVisibility(currentUser);
};

// Make managers available globally
window.authManager = authManager;
window.cartManager = cartManager;
window.paymentManager = paymentManager;
window.uiManager = uiManager;
window.categoryManager = categoryManager;

// function displayProducts(products) {
//   console.log('Displaying products:', products);
  
//   const gridContainer = document.querySelector(".grid-container");
//   gridContainer.innerHTML = "";

//   products.forEach((product) => {
//     const gridItem = document.createElement("div");
//     gridItem.classList.add("grid-item", "grid-item-xl");
//     gridItem.setAttribute("data-product-id", product.product_id);

//     // Create image slider
//     let imageSlider = '<div class="image-slider">';
//     if (product.images && Array.isArray(product.images) && product.images.length > 0) {
//       product.images.forEach((img, index) => {
//         imageSlider += `<img src="${img}" alt="${product.name} - Image ${index + 1}" ${index === 0 ? 'class="active"' : ''}>`;
//       });
//     } else if (product.image_url) {
//       imageSlider += `<img src="${product.image_url}" alt="${product.name}" class="active">`;
//     } else {
//       imageSlider += '<img src="/images/default-product-image.jpg" alt="Default Image" class="active">';
//     }
//     imageSlider += '</div>';

//     gridItem.innerHTML = `
//     <div class="product-rating">
//           ${ratingHTML}
//         </div>
//       ${imageSlider}
//       <div class="overlay">
//         ${product.name} | <span class="price-span" data-usd-price="${product.price}"> ${formatCryptoPrice(product.price)} | Stock: ${product.stock}</span>
//       </div>
//     `;
//     const addToCartButton = document.createElement("button");
//     addToCartButton.textContent = "+";
//     gridItem.appendChild(addToCartButton);
//     gridContainer.appendChild(gridItem);
//   });

//   // Add event listeners for image slider
//   document.querySelectorAll('.image-slider').forEach(slider => {
//     const images = slider.querySelectorAll('img');
//     let currentIndex = 0;

//     setInterval(() => {
//       images[currentIndex].classList.remove('active');
//       currentIndex = (currentIndex + 1) % images.length;
//       images[currentIndex].classList.add('active');
//     }, 3000);
//   });

//   // Add event listeners for add to cart buttons
//   document.querySelectorAll(".grid-item button").forEach((button) => {
//     button.addEventListener("click", () => {
//       const productId = button.parentElement.getAttribute("data-product-id");
//       cartManager.addItem(productId);
//     });
//   });
// }
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