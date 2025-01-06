// Global state
const BACKEND_URL = '';
let currentUser;
let cart = {};
let products = [];
//let categories = [];
let productStocks = {};
let logo2;
let data = {};
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
          <span class="item-price">Price: ${parseFloat(productPrice).toFixed(2)} $ |</span>
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

  async logout() {
    try {
      const response = await fetch('https://backend-3mvr.onrender.com/api/auth/logout', {
        method: "POST",
        credentials: 'include',
        headers: fetchConfig.headers
      });

      if (response.ok) {
        // Clear any local storage if you're using it
        localStorage.clear();
        window.location.reload();
      } else {
        showNotification('Failed to log out', 'error');
      }
    } catch (error) {
      showNotification('Error logging out', 'error');
    }
  }
,
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

      const products = await response.json();
      this.state.products = products;
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

  renderProducts() {
    const container = document.querySelector(".grid-container");
    if (!container) {
      console.error("Grid container not found");
      return;
    }

    container.innerHTML = "";

    this.state.products.forEach(product => {
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

      const gridItem = document.createElement("div");
      gridItem.className = "grid-item grid-item-xl";
      gridItem.setAttribute("data-product-id", product.product_id);
      console.log("Rendering product with ID:", product.product_id);

      gridItem.innerHTML = `
        ${imageSlider}
        <div class="overlay">
          ${product.name} - <span class="price-span">Dinars:${product.price} - Q:${product.stock}</span>
        </div>
        <button class="add-to-cart-btn">+</button>
      `;

      container.appendChild(gridItem);
    });

    this.initializeImageSliders();
    this.attachCartEventListeners();
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

  attachCartEventListeners() {
    document.querySelectorAll(".add-to-cart-btn").forEach(button => {
      button.addEventListener("click", (e) => {
        const gridItem = e.target.closest('.grid-item');
        if (gridItem) {
          const productId = gridItem.getAttribute("data-product-id");
          if (productId) {
            cartManager.addItem(productId);
          }
        }
      });
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
  // Initialize Stripe
  paymentManager.initialize('pk_test_51QZ5BBGhX6Xc3FUkDACPmuOMhQWtYAsoMwr3KMyH4XaJmEc7kYC5cZjWsuJX9ZeG36PXyjHAHFKpOnWvmYQKYScV00F3qNFmnl');
  // Initialize category filter  
  await categoryManager.initialize();
  // Fetch initial data
  currentUser = await authManager.fetchCurrentUser();
  logo2 = document.querySelector(".credit-info");

  // Initialize displays
  fetchProducts();
  authManager.displayUserInfo();
  authManager.displayUserAvatar();
  cartManager.updateDisplay();
  categoryManager.initialize();
  // Set up UI event listeners
  const registerBtn = document.getElementById("register-btn");
  const closeRegisterBtn = document.querySelector(".close-register");
  const loginBtn = document.getElementById("login-btn");
  const loginCloseBtn = document.querySelector(".close-login");
  const logoutBtn = document.getElementById("logout-button");
  const checkoutButton = document.querySelector('button[onclick="checkout()"]');
  const emptyCartButton = document.getElementById("empty-cart-button");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  // Add event listeners
  if (closeRegisterBtn) {
    closeRegisterBtn.addEventListener("click", uiManager.closeRegister);
  }
  if (registerBtn) {
    registerBtn.addEventListener("click", uiManager.openRegister);
  }
  if (loginBtn) {
    loginBtn.addEventListener("click", uiManager.openLogin);
  }
  if (loginCloseBtn) {
    loginCloseBtn.addEventListener("click", uiManager.closeLogin);
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => authManager.logout());
  }
  if (checkoutButton) {
    checkoutButton.addEventListener("click", () => paymentManager.initiateCheckout());
  }
  if (emptyCartButton) {
    emptyCartButton.addEventListener("click", () => cartManager.clearCart());
  }
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => authManager.login(e));
  }
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => authManager.register(e));
  }

  // Update UI based on user state
  uiManager.updateButtonVisibility(currentUser);
});

// Make managers available globally
window.authManager = authManager;
window.cartManager = cartManager;
window.paymentManager = paymentManager;
window.uiManager = uiManager;
window.categoryManager = categoryManager;
async function fetchProducts() {
  try {
    const response = await fetch('https://backend-3mvr.onrender.com/api/products');
    const products = await response.json();
    displayProducts(products);
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

function displayProducts(products) {
  const gridContainer = document.querySelector(".grid-container");
  gridContainer.innerHTML = "";

  products.forEach((product) => {
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

    gridItem.innerHTML = `
      ${imageSlider}
      <div class="overlay">
        ${product.name} - <span class="price-span">Dinars:${product.price} - Q:${product.stock}</span>
      </div>
    `;
    const addToCartButton = document.createElement("button");
    addToCartButton.textContent = "+";
    gridItem.appendChild(addToCartButton);
    gridContainer.appendChild(gridItem);
  });

  // Add event listeners for image slider
  document.querySelectorAll('.image-slider').forEach(slider => {
    const images = slider.querySelectorAll('img');
    let currentIndex = 0;

    setInterval(() => {
      images[currentIndex].classList.remove('active');
      currentIndex = (currentIndex + 1) % images.length;
      images[currentIndex].classList.add('active');
    }, 3000);
  });

  // Add event listeners for add to cart buttons
  document.querySelectorAll(".grid-item button").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.parentElement.getAttribute("data-product-id");
      cartManager.addItem(productId);
    });
  });
}
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