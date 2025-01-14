import React, { useState, useEffect } from 'react';
import { Menu, User, ShoppingCart, LogOut } from 'lucide-react';

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative w-full">
      {/* Panorama Container */}
      <div className="w-full h-96 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
        <img 
          src="/images/belgrade-panorama-1.jpg" 
          alt="Belgrade Panorama" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img 
                src="/images/pobednik.jpg" 
                alt="Logo" 
                className="h-8 w-auto rounded-full"
              />
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="orderHistory.html" className="text-white hover:text-gray-300 transition-colors">
                Order History
              </a>
              <a href="#cart" className="text-white hover:text-gray-300 transition-colors">
                <ShoppingCart className="w-5 h-5" />
              </a>
              <div className="relative group">
                <button className="text-white hover:text-gray-300 transition-colors">
                  <User className="w-5 h-5" />
                </button>
                <div className="absolute right-0 w-48 mt-2 hidden group-hover:block">
                  <div className="bg-white rounded-md shadow-lg py-1">
                    <a href="#login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Login
                    </a>
                    <a href="#register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Register
                    </a>
                    <a href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Admin Panel
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/90 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="orderHistory.html" className="block px-3 py-2 text-white hover:bg-gray-700 rounded-md">
                Order History
              </a>
              <a href="#cart" className="block px-3 py-2 text-white hover:bg-gray-700 rounded-md">
                Cart
              </a>
              <a href="#login" className="block px-3 py-2 text-white hover:bg-gray-700 rounded-md">
                Login
              </a>
              <a href="#register" className="block px-3 py-2 text-white hover:bg-gray-700 rounded-md">
                Register
              </a>
              <a href="/admin" className="block px-3 py-2 text-white hover:bg-gray-700 rounded-md">
                Admin Panel
              </a>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default NavBar;