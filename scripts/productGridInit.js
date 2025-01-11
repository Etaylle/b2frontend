const initializeProductGrid = (products) => {
    const rootElement = document.getElementById('product-grid-root');
    
    // Create wrapper component to handle cart integration
    const ProductGridWrapper = () => {
        const handleAddToCart = (product) => {
            // Integration with your existing cart system
            if (typeof cartManager !== 'undefined' && cartManager.addItem) {
                cartManager.addItem(product.product_id);
            }
        };

        return React.createElement(ProductGrid, {
            products: products,
            onAddToCart: handleAddToCart
        });
    };

    ReactDOM.render(
        React.createElement(ProductGridWrapper),
        rootElement
    );
};

// Function to update products
const updateProducts = (newProducts) => {
    initializeProductGrid(newProducts);
};