// EnhancedCategories.js
import React, { useState } from 'react';
import { ShoppingCart, X, ChevronUp, ChevronDown } from 'lucide-react';

export const EnhancedCategories = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCartMinimized, setIsCartMinimized] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const categories = [
    'all', 'electronics', 'clothing', 'books', 'home', 'sports'
  ];

  const toggleCart = () => {
    setIsCartMinimized(!isCartMinimized);
  };

  // Add this function to handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    // Integrate with your existing filterProducts function
    if (window.filterProducts) {
      window.filterProducts(category);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategorySelect(category)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium
                transform transition-all duration-300 ease-in-out
                hover:scale-105 hover:shadow-md
                ${selectedCategory === category 
                  ? 'bg-blue-500 text-white shadow-lg scale-105' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'}
              `}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={`
        fixed right-4 bottom-4 bg-white rounded-lg shadow-lg
        transition-all duration-300 ease-in-out
        ${isCartMinimized ? 'w-16' : 'w-80'}
        ${isCartMinimized ? 'h-16' : 'h-96'}
      `}>
        <div className="flex items-center justify-between p-4 bg-blue-500 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <ShoppingCart className={`transition-transform duration-300 ${isCartMinimized ? 'scale-75' : ''}`} />
            {!isCartMinimized && <span className="font-medium">Shopping Cart</span>}
          </div>
          <button 
            onClick={toggleCart}
            className="p-1 hover:bg-blue-600 rounded-full transition-colors"
          >
            {isCartMinimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {!isCartMinimized && (
          <div className="p-4">
            {cartItems.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                Your cart is empty
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">${item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="absolute bottom-4 left-4 right-4">
              <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Modified index.js
document.addEventListener('DOMContentLoaded', () => {
  // Keep your existing DOMContentLoaded event listeners
  
  // Add this new code for React integration
  const root = document.getElementById('categories-cart-root');
  if (root) {
    ReactDOM.render(React.createElement(EnhancedCategories), root);
  }

  // Modify your existing cart functionality to work with React component
  window.addToCart = (product) => {
    const cartComponent = document.querySelector('#categories-cart-root');
    if (cartComponent) {
      // Dispatch a custom event that React component can listen to
      cartComponent.dispatchEvent(new CustomEvent('addToCart', { detail: product }));
    }
  };

  // Make filterProducts function available globally
  window.filterProducts = (category) => {
    // Your existing filter logic here
    const items = document.querySelectorAll('.grid-item');
    items.forEach(item => {
      if (category === 'all' || item.dataset.category === category) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });
  };
});