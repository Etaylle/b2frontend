// Import React components and hooks if using modules
import React, { useState, useEffect } from 'react';
import ProductGrid from './ProductGrid.js';

export const initializeProductGrid = (products) => {
    const rootElement = document.getElementById('product-grid-root');
    if (!rootElement) {
        console.error('Product grid root element not found');
        return;
    }

    // Create wrapper component to handle cart integration and state management
    const ProductGridWrapper = () => {
        const [cryptoRates, setCryptoRates] = useState({
            BTC: 0,
            ETH: 0
        });

        useEffect(() => {
            const fetchCryptoRates = async () => {
                try {
                    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
                    const data = await response.json();
                    setCryptoRates({
                        BTC: data.bitcoin.usd,
                        ETH: data.ethereum.usd
                    });
                } catch (error) {
                    console.error('Error fetching crypto rates:', error);
                }
            };

            // Initial fetch
            fetchCryptoRates();

            // Set up interval for periodic updates
            const interval = setInterval(fetchCryptoRates, 60000); // Update every minute

            // Cleanup interval on component unmount
            return () => clearInterval(interval);
        }, []);

        const handleAddToCart = (product) => {
            if (typeof cartManager !== 'undefined' && cartManager.addItem) {
                cartManager.addItem(product.product_id);
                
                // Optional: Show some feedback to the user
                const feedbackElement = document.createElement('div');
                feedbackElement.textContent = 'Added to cart!';
                feedbackElement.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background-color: #4CAF50;
                    color: white;
                    padding: 16px;
                    border-radius: 4px;
                    z-index: 1000;
                `;
                document.body.appendChild(feedbackElement);
                setTimeout(() => feedbackElement.remove(), 2000);
            } else {
                console.error('Cart manager not found');
            }
        };

        // Format product data if needed
        const formattedProducts = products.map(product => ({
            ...product,
            price: parseFloat(product.price).toFixed(2), // Ensure price is properly formatted
            images: Array.isArray(product.images) ? product.images : 
                   product.image_url ? [product.image_url] : 
                   ['/images/default-product-image.jpg']
        }));

        return React.createElement(ProductGrid, {
            products: formattedProducts,
            cryptoRates: cryptoRates,
            onAddToCart: handleAddToCart
        });
    };

    // Render the React component
    try {
        ReactDOM.render(
            React.createElement(ProductGridWrapper),
            rootElement
        );
    } catch (error) {
        console.error('Error rendering product grid:', error);
        // Fallback to traditional display if React rendering fails
        rootElement.innerHTML = `
            <div class="error-message">
                Error loading product grid. Please refresh the page or contact support.
            </div>
        `;
    }
};

// Function to update products (can be called when new products are fetched)
export const updateProducts = (newProducts) => {
    if (newProducts && Array.isArray(newProducts)) {
        initializeProductGrid(newProducts);
    } else {
        console.error('Invalid products data provided for update');
    }
};

// Function to cleanup React component (call this when unmounting)
export const cleanupProductGrid = () => {
    const rootElement = document.getElementById('product-grid-root');
    if (rootElement) {
        ReactDOM.unmountComponentAtNode(rootElement);
    }
};