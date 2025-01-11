import React, { useState, useEffect } from 'react';
import { ArrowLeftCircle, ArrowRightCircle, Bitcoin, Wallet } from 'lucide-react';

const ProductGrid = () => {
  const [cryptoRates, setCryptoRates] = useState({
    BTC: 0,
    ETH: 0
  });
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  
  // Simulated products data - replace with your actual data
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    // Fetch crypto rates periodically
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
    
    fetchCryptoRates();
    const interval = setInterval(fetchCryptoRates, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  const convertPrice = (priceUSD, cryptoType) => {
    if (cryptoType === 'BTC') {
      return (priceUSD / cryptoRates.BTC).toFixed(8);
    } else if (cryptoType === 'ETH') {
      return (priceUSD / cryptoRates.ETH).toFixed(6);
    }
    return priceUSD;
  };
  
  return (
    <div className="w-full p-4">
      {/* Currency Selector */}
      <div className="mb-6 flex justify-end space-x-2">
        <button
          onClick={() => setSelectedCurrency('USD')}
          className={`px-4 py-2 rounded ${selectedCurrency === 'USD' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          <Wallet className="inline-block mr-2" size={16} />
          USD
        </button>
        <button
          onClick={() => setSelectedCurrency('BTC')}
          className={`px-4 py-2 rounded ${selectedCurrency === 'BTC' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          <Bitcoin className="inline-block mr-2" size={16} />
          BTC
        </button>
        <button
          onClick={() => setSelectedCurrency('ETH')}
          className={`px-4 py-2 rounded ${selectedCurrency === 'ETH' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          <img src="/api/placeholder/16/16" alt="ETH" className="inline-block mr-2" />
          ETH
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.product_id} className="relative group bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Image Slider */}
            <div className="relative h-64 overflow-hidden">
              {product.images?.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${product.name} - ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                  style={{ opacity: index === 0 ? 1 : 0 }}
                />
              ))}
              <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <ArrowLeftCircle className="text-white" size={24} />
                </button>
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <ArrowRightCircle className="text-white" size={24} />
                </button>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-gray-600">
                    {selectedCurrency === 'USD' && `$${product.price}`}
                    {selectedCurrency === 'BTC' && `₿${convertPrice(product.price, 'BTC')}`}
                    {selectedCurrency === 'ETH' && `Ξ${convertPrice(product.price, 'ETH')}`}
                  </p>
                  <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                </div>
                <button 
                  className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-700 transition-colors"
                  onClick={() => cartManager.addItem(product.product_id)}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;