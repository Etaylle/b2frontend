// productGridInit.js
const initializeProductGrid = (products) => {
    // Create a wrapper for the React component
    class ProductGridWrapper extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                products: props.products,
                cryptoRates: {
                    BTC: 0,
                    ETH: 0
                },
                selectedCurrency: 'USD'
            };
        }

        componentDidMount() {
            this.fetchCryptoRates();
            // Update rates every minute
            this.interval = setInterval(this.fetchCryptoRates, 60000);
        }

        componentWillUnmount() {
            if (this.interval) {
                clearInterval(this.interval);
            }
        }

        fetchCryptoRates = async () => {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
                const data = await response.json();
                this.setState({
                    cryptoRates: {
                        BTC: data.bitcoin.usd,
                        ETH: data.ethereum.usd
                    }
                });
            } catch (error) {
                console.error('Error fetching crypto rates:', error);
            }
        };

        render() {
            return React.createElement(ProductGrid, {
                products: this.state.products,
                cryptoRates: this.state.cryptoRates,
                selectedCurrency: this.state.selectedCurrency,
                onCurrencyChange: (currency) => this.setState({ selectedCurrency: currency })
            });
        }
    }

    // Mount the React component
    const rootElement = document.getElementById('product-grid-root');
    ReactDOM.render(
        React.createElement(ProductGridWrapper, { products: products }),
        rootElement
    );
};

// Function to update products
const updateProductGrid = (newProducts) => {
    const rootElement = document.getElementById('product-grid-root');
    ReactDOM.render(
        React.createElement(ProductGridWrapper, { products: newProducts }),
        rootElement
    );
};