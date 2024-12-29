
const AdminPanel = () => {
  const [users, setUsers] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [modalData, setModalData] = React.useState({ type: null, data: null });
  const [success, setSuccess] = React.useState(null);
  const [userSearch, setUserSearch] = React.useState('');
  const [productSearch, setProductSearch] = React.useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, productsRes] = await Promise.all([
        fetch('/api/admin/users', { credentials: 'include' }),
        fetch('/api/admin/products', { credentials: 'include' })
      ]);

      if (!usersRes.ok) throw new Error('Failed to fetch users');
      if (!productsRes.ok) throw new Error('Failed to fetch products');

      const usersData = await usersRes.json();
      const productsData = await productsRes.json();

      setUsers(usersData);
      setProducts(productsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  React.useEffect(() => {
    fetchData();
  }, []);
  
 // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.firstname?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.lastname?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.price?.toString().includes(productSearch)
  );
  // CRUD Operations
  const handleCreate = (type, data) => {
      const url = type === 'user' ? '/api/admin/users' : '/api/admin/products';
      fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
      })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to create ${type}`);
        return res.json();
      })
      .then(() => {
        // Fetch fresh data after successful creation
        return fetchData();
      })
      .then(() => {
        setModalData({ type: null, data: null }); // Close modal after success
        setSuccess(`${type} created successfully`);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
    };

  const handleEdit = (type, id, data) => {
    // Get the correct ID from the data based on type
    const itemId = type === 'user' ? data.user_id : data.product_id;
    
    if (!itemId) {
      return setError(`${type === 'user' ? 'User' : 'Product'} ID is missing`);
    }

    const url = `${type === 'user' ? '/api/admin/users' : '/api/admin/products'}/${itemId}`;

    // Validate required fields before sending the request
    if (type === 'user') {
      if (!data.username) {
        return setError("Username is required");
      }
      if (!data.email) {
        return setError("Email is required");
      }
      if (data.password && data.password.length < 6) {
        return setError("Password must be at least 6 characters");
      }
    }

    // Show loading state
    setLoading(true);
    setError(null);

    fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(responseData => {
      if (responseData.error) {
        setError(responseData.error);
      } else {
        if (type === 'user') {
          setUsers(prev => prev.map(item => 
            item.user_id === itemId ? { ...item, ...data } : item
          ));
        } else {
          setProducts(prev => prev.map(item => 
            item.product_id === itemId ? { ...item, ...data } : item
          ));
        }
        setSuccess('Update successful');
        setModalData({ type: null, data: null }); // Close modal after successful update
      }
    })
    .catch(err => {
      setError(err.message);
    })
    .finally(() => {
      setLoading(false);
    });
  };

  


  const handleDelete = (type, id) => {
      const url = `${type === 'user' ? '/api/admin/users' : '/api/admin/products'}/${id}`;
      fetch(url, {
          method: 'DELETE',
          credentials: 'include'
      })
      .then(() => {
          if (type === 'user') setUsers(prev => prev.filter(item => item.user_id !== id));
          else setProducts(prev => prev.filter(item => item.product_id !== id));
      })
      .catch(err => setError(err.message));
  };

  // Modal logic
  const openModal = (type, data = null) => {
      setModalData({ type, data });
      setError(null); 
    setSuccess(null);  
  };

  const closeModal = () => {
      setModalData({ type: null, data: null });
      setError(null); 
      setSuccess(null);
  };

  const handleSaveModal = (data) => {
      if (modalData.data) {
          // Editing existing item
          handleEdit(modalData.type, null, data);
      } else {
          // Creating new item
          handleCreate(modalData.type, data);
      }
      closeModal();
  };

  // Rendering
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Control Panel</h1>
      <div className="flex gap-4 mb-4">
        <button 
          onClick={() => openModal('user')}
          className="bg-blue-500 text-white p-2 rounded">
          Add User
        </button>
        <button 
          onClick={() => openModal('product')}
          className="bg-green-500 text-white p-2 rounded">
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border p-4 rounded bg-white shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Users</h2>
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full p-2 border rounded pl-8"
              />
              <svg
                className="w-4 h-4 absolute left-2 top-3 text-gray-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          {filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No users found</p>
          ) : (
            filteredUsers.map(user => (
              <div key={user.user_id} className="border p-2 rounded mb-2">
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                {(user.firstname || user.lastname) && (
                  <p className="text-sm text-gray-600">
                    {[user.firstname, user.lastname].filter(Boolean).join(' ')}
                  </p>
                )}
                <div className="mt-2">
                  <button 
                    onClick={() => openModal('user', user)}
                    className="text-blue-500 mr-2 text-sm">Edit</button>
                  <button 
                    onClick={() => handleDelete('user', user.user_id)}
                    className="text-red-500 text-sm">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border p-4 rounded bg-white shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Products</h2>
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full p-2 border rounded pl-8"
              />
              <svg
                className="w-4 h-4 absolute left-2 top-3 text-gray-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          {filteredProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No products found</p>
          ) : (
            filteredProducts.map(product => (
              <div key={product.product_id} className="border p-2 rounded mb-2">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-600">${product.price}</p>
                <div className="mt-2">
                  <button 
                    onClick={() => openModal('product', product)}
                    className="text-blue-500 mr-2 text-sm">Edit</button>
                  <button 
                    onClick={() => handleDelete('product', product.product_id)}
                    className="text-red-500 text-sm">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {modalData.type && (
        <Modal 
          type={modalData.type} 
          data={modalData.data} 
          onClose={closeModal} 
          onSave={handleSaveModal} 
        />
      )}
    </div>
  );
};
// Modal component
const Modal = ({ type, data, onClose, onSave }) => {
  const [formData, setFormData] = React.useState(() => {
    if (data) {
      return {
        ...data,
        [type === 'user' ? 'user_id' : 'product_id']: type === 'user' ? data.user_id : data.product_id
      };
    }
    return {};
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded shadow w-1/3">
        <h2 className="text-xl mb-4">
          {data ? "Edit" : "Create"} {type}
        </h2>
        <form onSubmit={handleSubmit}>
          {type === "user" && (
            <>
              <input
                type="text"
                name="username"
                value={formData.username || ""}
                onChange={handleChange}
                placeholder="Username"
                className="block w-full mb-2 p-2 border rounded"
              />
              {!data && (
                <input
                  type="password"
                  name="password"
                  value={formData.password || ""}
                  onChange={handleChange}
                  placeholder="Password"
                  className="block w-full mb-2 p-2 border rounded"
                />
              )}
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                placeholder="Email"
                className="block w-full mb-2 p-2 border rounded"
              />
              <input
                type="text"
                name="role"
                value={formData.role || ""}
                onChange={handleChange}
                placeholder="Role"
                className="block w-full mb-2 p-2 border rounded"
              />
              <input
                type="text"
                name="firstname"
                value={formData.firstname || ""}
                onChange={handleChange}
                placeholder="First Name"
                className="block w-full mb-2 p-2 border rounded"
              />
              <input
                type="text"
                name="lastname"
                value={formData.lastname || ""}
                onChange={handleChange}
                placeholder="Last Name"
                className="block w-full mb-2 p-2 border rounded"
              />
            </>
          )}
          {type === "product" && (
            <>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                placeholder="Product Name"
                className="block w-full mb-2 p-2 border rounded"
              />
              <input
                type="number"
                name="price"
                value={formData.price || ""}
                onChange={handleChange}
                placeholder="Price"
                className="block w-full mb-2 p-2 border rounded"
              />
              <input
                type="number"
                name="stock"
                value={formData.stock || ""}
                onChange={handleChange}
                placeholder="Quantity"
                className="block w-full mb-2 p-2 border rounded"
              />
              <input
                type="number"
                name="category_id"
                value={formData.category_id || ""}
                onChange={handleChange}
                placeholder="Category ID"
                className="block w-full mb-2 p-2 border rounded"
              />
              <input
                type="string"
                name="image_url"
                value={formData.image_url || ""}
                onChange={handleChange}
                placeholder="Image URL"
                className="block w-full mb-2 p-2 border rounded"
              />
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Product preview"
                  className="w-full h-32 object-cover mb-2 rounded"
                  onError={(e) => (e.target.src = "/images/1.jpg")}
                />
              )}
            </>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white p-2 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Initialize React
const container = document.getElementById('admin-root');
const root = ReactDOM.createRoot(container);
root.render(<AdminPanel />);
