import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './App.css';


function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('all');
  const [userReservations, setUserReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    menu_id: '',
    rating: 5,
    review_text: '',
    user_id: '' // Changed from default 1 to empty string
  });

  const [reservationForm, setReservationForm] = useState({
    date: '',
    time: '',
    partySize: 1,
    name: '',
    email: '',
    password: 'default_password', // Default password for new users
    message: '',
    mailingList: false,
    tableId: null
  });

  const [userEmail, setUserEmail] = useState('');
  const [showUserReservations, setShowUserReservations] = useState(false);

  // Cart, search, and filter state
  const [cart, setCart] = useState([]); // {menu_id, name, price, quantity}
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lastOrder, setLastOrder] = useState(null);

  // Admin Panel State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ email: '', password: '' });
  const [adminPanelError, setAdminPanelError] = useState('');
  const [adminPanelMessage, setAdminPanelMessage] = useState('');
  const [allReservationsForAdmin, setAllReservationsForAdmin] = useState([]);
  const [menuStockInputs, setMenuStockInputs] = useState({}); // { menu_id: 'new_stock_value' }
  const [reservationStatusInputs, setReservationStatusInputs] = useState({}); // { reservation_id: 'new_status' }

  // Helper function to fetch and set initial stock for menu items
  const fetchAndSetInitialMenuStock = async () => {
    if (menuItems.length === 0 || !menuItems.some(item => typeof item.quantity_in_stock === 'undefined')) {

      if (menuItems.length > 0 && !menuItems.some(item => typeof item.quantity_in_stock === 'undefined')) {
        console.log("Stock information already present in menuItems.");
        return;
      }
      if (menuItems.length === 0) {
        console.log("No menu items loaded to fetch stock for.");
        return;
      }
    }

    setLoading(true); // Consider a more specific loading state if needed
    setAdminPanelError('');
    try {
      const updatedMenuItems = await Promise.all(
        menuItems.map(async (item) => {
          // If stock is already defined, skip fetching for this item (unless force refresh)
          if (typeof item.quantity_in_stock !== 'undefined') {
            return item;
          }
          try {
            const stockRes = await fetch(`http://localhost:5000/api/menu/stock/${item.menu_id}`);
            if (!stockRes.ok) {
              console.error(`Failed to fetch stock for item ${item.menu_id} (status: ${stockRes.status})`);
              return { ...item, quantity_in_stock: undefined }; // Mark as undefined or N/A
            }
            const stockData = await stockRes.json();
            let currentStock;
            if (stockData.success && stockData.data) {
              if (Array.isArray(stockData.data) && stockData.data.length > 0) {
                currentStock = stockData.data[0].quantity_in_stock;
              } else if (stockData.data && typeof stockData.data.quantity_in_stock !== 'undefined') {
                currentStock = stockData.data.quantity_in_stock;
              }
            }
            return { ...item, quantity_in_stock: currentStock };
          } catch (err) {
            console.error(`Error fetching stock for item ${item.menu_id}:`, err);
            return { ...item, quantity_in_stock: undefined }; // Mark as undefined or N/A on error
          }
        })
      );
      setMenuItems(updatedMenuItems);
      setAdminPanelMessage('Menu item stock levels loaded.');
    } catch (error) {
      console.error("Error fetching initial stock for menu items:", error);
      setAdminPanelError("Could not load initial stock levels for all items. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  // Category mapping (adjust as needed)
  const categoryMap = {
    'All': () => true,
    'Appetizers': item => item.category === 'appetizer' ,
    'Main Course': item => item.category === 'main course' ,
    'Desserts': item => item.category === 'dessert',
    'Beverages': item => item.category === 'beverage',
  };

  // Filtered and searched menu items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || (categoryMap[selectedCategory] && categoryMap[selectedCategory](item));
    const matchesSearch = item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Add to cart handler
  const handleAddToCart = (item) => {
    setCart(prev => {
      // Make sure menu_id is a reliable identifier - if not, use combinations of properties
      const itemId = item.menu_id || item.id;
      const existing = prev.find(ci => (ci.menu_id === itemId) && (ci.name === item.name));
      if (existing) {
        return prev.map(ci => (ci.menu_id === itemId && ci.name === item.name) ? { ...ci, quantity: ci.quantity + 1 } : ci);
      } else {
        return [...prev, { ...item, menu_id: itemId, quantity: 1 }];
      }
    });
  };

  // Remove from cart handler
  const handleRemoveFromCart = (menu_id) => {
    setCart(prev => prev.filter(ci => ci.menu_id !== menu_id));
  };

  // Update quantity handler
  const handleUpdateQuantity = (menu_id, qty) => {
    setCart(prev => prev.map(ci => ci.menu_id === menu_id ? { ...ci, quantity: qty } : ci));
  };

  useEffect(() => {
    // Fetch menu items when component mounts
    fetch('http://localhost:5000/api/menu/with-ratings')
      .then(response => response.json())
      .then(data => setMenuItems(data.data || []))
      .catch(error => console.error('Error fetching menu:', error));

    // Fetch all tables
    fetch('http://localhost:5000/api/reservations/tables')
      .then(response => response.json())
      .then(data => setTables(data))
      .catch(error => console.error('Error fetching tables:', error));

    // Fetch dish reviews
    fetch('http://localhost:5000/api/dish-reviews/detailed')
      .then(response => response.json())
      .then(data => setReviews(data.data || []))
      .catch(error => console.error('Error fetching reviews:', error));
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    // Update form state
    setReservationForm(prev => ({
      ...prev,
      [name]: newValue
    }));

    // If date, time or party size changes, reset the selected table
    if (['date', 'time', 'partySize'].includes(name)) {
      setReservationForm(prev => ({ ...prev, tableId: null }));
      setAvailableTables([]);

      // Prepare updated form state to check for completeness
      const updatedForm = {
        ...reservationForm,
        [name]: newValue
      };

      // Check if we have all required fields to search for tables
      const hasDate = name === 'date' ? value : updatedForm.date;
      const hasTime = name === 'time' ? value : updatedForm.time;
      const hasPartySize = name === 'partySize' ? value : updatedForm.partySize;

      // If all three are filled, check for available tables
      if (hasDate && hasTime && hasPartySize) {
        console.log("Checking available tables with:", {
          date: hasDate,
          time: hasTime,
          partySize: hasPartySize
        });
        checkAvailableTables(hasDate, hasTime, hasPartySize);
      }
    }
  };

  const checkAvailableTables = (date, time, partySize) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    console.log('Checking available tables with:', { date, time, partySize });

    fetch(`http://localhost:5000/api/reservations/available-tables?date=${date}&time=${time}&partySize=${partySize}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch available tables');
        }
        return response.json();
      })
      .then(data => {
        console.log("Available tables response:", data);
        // Use data.data instead of data.tables
        const tables = data.data || [];
        console.log("Tables from response:", tables);
        
        // Set the tables
        setAvailableTables(tables);
        
        // Set appropriate message
        if (tables.length > 0) {
          const availableCount = tables.filter(table => table.is_available === 1).length;
          console.log("Available tables count:", availableCount);
          if (availableCount === 0) {
            setError('No tables are available for this date and time. Please choose a different time slot.');
          } else {
            setSuccess(`Found ${availableCount} available table(s) for your party size`);
          }
        } else {
          setError('No tables found matching your party size requirements.');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error checking table availability:', err);
        setError('Error checking table availability. Please try again.');
        setLoading(false);
      });
  };

  const handleTableSelect = (tableId) => {
    setReservationForm(prev => ({
      ...prev,
      tableId
    }));
  };

  const handleReservationSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate date, time and party size
    if (!reservationForm.date || !reservationForm.time || !reservationForm.partySize) {
      setError('Please select a date, time, and party size');
      setLoading(false);
      return;
    }

    // Validate table selection
    if (!reservationForm.tableId) {
      // First check if we need to fetch available tables
      if (availableTables.length === 0) {
        checkAvailableTables(reservationForm.date, reservationForm.time, reservationForm.partySize);
        setError('Please wait while we check for available tables...');
        setLoading(false);
        return;
      }

      // If we have tables but none selected
      if (availableTables.length > 0) {
        setError('Please select an available table from the options below');
        window.scrollTo({
          top: document.querySelector('.available-tables')?.offsetTop - 50 || 0,
          behavior: 'smooth'
        });
        setLoading(false);
        return;
      }

      // If no tables available
      setError('No tables are available for this date and time. Please select a different date or time.');
      setLoading(false);
      return;
    }

    // Validate contact information
    if (!reservationForm.name || !reservationForm.email) {
      setError('Please provide your name and email address');
      setLoading(false);
      return;
    }

    // Map form data to expected API fields
    const reservationData = {
      table_id: reservationForm.tableId,
      name: reservationForm.name,
      email: reservationForm.email,
      password: reservationForm.password || 'default_password',
      reservation_date: reservationForm.date,
      time_slot: reservationForm.time,
      special_requests: reservationForm.message || ''
    };

    console.log('Submitting reservation with data:', JSON.stringify(reservationData, null, 2));

    // Make API request to create reservation
    fetch('http://localhost:5000/api/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservationData),
    })
      .then(response => {
        console.log('Reservation API response status:', response.status);
        console.log('Reservation API response headers:', Object.fromEntries([...response.headers]));

        // Get the raw response text first for debugging
        return response.text().then(text => {
          console.log('Raw API response:', text);

          // Try to parse as JSON if possible
          let data;
          try {
            data = JSON.parse(text);
            console.log('Parsed response data:', data);
          } catch (e) {
            console.error('Could not parse response as JSON:', e);
            // If we can't parse as JSON, throw with the raw text
            throw new Error(text || 'Failed to create reservation');
          }

          // Handle error responses
          if (!response.ok) {
            throw new Error(data.error || data.message || 'Failed to create reservation');
          }

          return data;
        });
      })
      .then(data => {
        // Show a more detailed success message if available from API
        const successMessage = data.message || 'Reservation created successfully!';
        setSuccess(`${successMessage} Your table is booked for ${formatDate(reservationForm.date)} at ${formatTime(reservationForm.time)}.`);

        // Reset form
        setReservationForm({
          date: '',
          time: '',
          partySize: 1,
          name: '',
          email: '',
          password: 'default_password',
          message: '',
          mailingList: false,
          tableId: null
        });
        setAvailableTables([]);
        setLoading(false);

        // Scroll to the success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(err => {
        console.error('Reservation error:', err);
        // Provide more helpful error messages
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          setError('This email already has a reservation at this time. Please check your existing reservations or choose a different time.');
        } else if (err.message.includes('unavailable') || err.message.includes('already booked')) {
          setError('This table is no longer available. Please select another table or try a different time.');
          // Refresh available tables
          checkAvailableTables(reservationForm.date, reservationForm.time, reservationForm.partySize);
        } else {
          setError(`Failed to create reservation: ${err.message}`);
        }
        setLoading(false);
      });
  };

  const fetchUserReservations = () => {
    if (!userEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`http://localhost:5000/api/reservations/by-email/${userEmail}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to retrieve reservations');
        }
        return response.json();
      })
      .then(data => {
        setUserReservations(data.data || []);
        setShowUserReservations(true);
        setLoading(false);
      })
      .catch(err => {
        setError('Error retrieving reservations. Please try again.');
        setLoading(false);
        console.error('Error:', err);
      });
  };

  const cancelReservation = (reservationId) => {
    setLoading(true);
    setError(null);

    fetch(`http://localhost:5000/api/reservations/${reservationId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'cancelled' }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to cancel reservation');
        }
        return response.json();
      })
      .then(data => {
        setSuccess('Reservation cancelled successfully');
        // Update the reservation in the UI
        setUserReservations(prev =>
          prev.map(reservation =>
            reservation.reservation_id === reservationId
              ? { ...reservation, status: 'cancelled' }
              : reservation
          )
        );
        setLoading(false);
      })
      .catch(err => {
        setError('Error cancelling reservation. Please try again.');
        setLoading(false);
        console.error('Error:', err);
      });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      // Parse the date string directly (format: YYYY-MM-DD)
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';

    try {
      // Handle SQL TIME format (HH:mm:ss)
      const [hours, minutes] = timeString.split(':').map(Number);
      const hour = hours % 24; // Ensure hours are in 24-hour format
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      const paddedMinutes = minutes.toString().padStart(2, '0');

      return `${hour12}:${paddedMinutes} ${ampm}`;
    } catch (err) {
      console.error('Error formatting time:', err);
      return timeString;
    }
  };

  // Helper function to map menu item names to image filenames
  const getMenuImage = (name) => {

    const map = {
      'Garlic Bread': '/classic_garlic_bread.webp',
      'Margherita Pizza': '/Margherita-Pizza.webp',
      'Spaghetti Bolognese': '/spicy-spaghetti-arrabbiata.webp',
      'Pasta Alfredo': '/alfredo-sauce-pasta.webp',
      'Caesar Salad': '/classic-caesar-salad.webp',
      'Tiramisu': '/Tiramisu-Cake.jpg',
      'Chocolate Cake': '/chocolatecake.webp',
      'Ice Cream Sundae': '/Sundae.jpg',
      'Coffee': '/coffee.jpg',
      'Soft Drink': '/softdrink.webp',
      // Add more mappings as needed
    };
    // Try to match by name, fallback to a default image
    return map[name]
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    // Check stock levels before placing order
    try {
      let outOfStockItems = [];

      // Check each cart item for stock availability
      for (const item of cart) {
        const itemId = item.menu_id || item.id;
        const stockRes = await fetch(`http://localhost:5000/api/menu/stock/${itemId}`);
        const stockData = await stockRes.json();

        if (stockData.success && stockData.data) {
          let currentStock = 0;

          // Handle different possible response structures
          if (Array.isArray(stockData.data) && stockData.data.length > 0) {
            currentStock = stockData.data[0].quantity_in_stock;
          } else if (stockData.data.quantity_in_stock) {
            currentStock = stockData.data.quantity_in_stock;
          }

          // Check if requested quantity exceeds available stock
          if (currentStock < item.quantity) {
            outOfStockItems.push({
              name: item.name,
              requested: item.quantity,
              available: currentStock
            });
          }
        }
      }

      // If any items are out of stock, alert user and stop order process
      if (outOfStockItems.length > 0) {
        let message = "Cannot place order due to insufficient stock:\n\n";
        outOfStockItems.forEach(item => {
          message += `• ${item.name}: ${item.available} available (you requested ${item.requested})\n`;
        });
        alert(message);
        return; // Stop order placement
      }
    } catch (err) {
      console.error("Error checking stock:", err);
      alert("Could not verify stock levels. Please try again.");
      return;
    }

    const user_id = 1; // Guest user for now
    // Ensure total_price is properly formatted as a decimal with 2 decimal places
    const total_price = parseFloat(cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2));

    try {
      // 1. Create order
      const orderRes = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          reservation_id: 1, // Using an existing reservation_id from your database
          total_price
        })
      });

      // Log full response for debugging
      console.log("Order Response Status:", orderRes.status);
      const orderText = await orderRes.text(); // Get raw response text
      console.log("Order Raw Response:", orderText);
      console.log("Response content type:", orderRes.headers.get('content-type'));

      // Try to parse as JSON
      let orderData;
      try {
        orderData = JSON.parse(orderText);
        console.log("Order Data (parsed):", orderData);
        // Stringify and log the whole response for better debugging
        console.log("Full JSON structure:", JSON.stringify(orderData, null, 2));
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        throw new Error('Invalid response format from server');
      }

      // Check for errors in response
      if (!orderRes.ok) throw new Error(orderData.message || 'Order creation failed');

      // Since the server doesn't return the order ID directly, we'll fetch the latest order for this user
      console.log("Order created successfully, fetching the latest order for user ID:", user_id);

      // Fetch the latest order for this user
      const userOrdersRes = await fetch(`http://localhost:5000/api/orders/user/${user_id}`);
      const userOrdersData = await userOrdersRes.json();
      console.log("User orders response:", userOrdersData);

      if (!userOrdersRes.ok || !userOrdersData.success) {
        throw new Error('Failed to retrieve user orders');
      }

      // Get the most recent order (assuming orders are returned sorted by date/ID)
      if (!userOrdersData.data || !Array.isArray(userOrdersData.data) || userOrdersData.data.length === 0) {
        throw new Error('No orders found for this user');
      }

      // Sort orders by order_id in descending order to get the latest one
      const sortedOrders = [...userOrdersData.data].sort((a, b) => b.order_id - a.order_id);
      const latestOrder = sortedOrders[0];
      const order_id = latestOrder.order_id;

      console.log("✅ Using latest order_id:", order_id);

      // 2. Add order items and update stock
      for (const item of cart) {
        const itemId = item.menu_id || item.id;

        // 2a. Add item to order
        const itemRes = await fetch('http://localhost:5000/api/orders/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id,
            menu_id: itemId,
            quantity: parseInt(item.quantity) // Ensure quantity is an integer
          })
        });

        // Log order item response for debugging
        const itemData = await itemRes.json();
        console.log("Item added response:", itemData);

        // 2b. Get current stock for this menu item
        const stockRes = await fetch(`http://localhost:5000/api/menu/stock/${itemId}`);
        const stockData = await stockRes.json();
        console.log("Current stock data:", stockData);

        if (stockData.success && stockData.data) {
          let currentStock;

          // Handle different possible response structures
          if (Array.isArray(stockData.data) && stockData.data.length > 0) {
            currentStock = stockData.data[0].quantity_in_stock;
          } else if (stockData.data.quantity_in_stock) {
            currentStock = stockData.data.quantity_in_stock;
          }

          if (currentStock !== undefined) {
            // 2c. Update stock by reducing the quantity purchased
            const newStock = Math.max(0, currentStock - parseInt(item.quantity));
            console.log(`Updating stock for menu_id ${itemId}: ${currentStock} -> ${newStock}`);

            const updateStockRes = await fetch('http://localhost:5000/api/menu/stock', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                menu_id: itemId,
                quantity: parseInt(newStock) // Ensure quantity is an integer
              })
            });

            const updateStockData = await updateStockRes.json();
            console.log("Stock update response:", updateStockData);
          }
        }
      }

      // 3. Show last order summary
      setLastOrder({ order_id, total_price, item_count: cart.length, status: 'Placed' });
      setCart([]);
      alert('Order placed successfully! Menu stock has been updated.');
    } catch (err) {
      console.error('Order error:', err);
      alert('Failed to place order: ' + err.message);
    }
  };

  // Admin Panel Functions
  const handleAdminInputChange = (e) => {
    const { name, value } = e.target;
    setAdminCredentials(prev => ({ ...prev, [name]: value }));
  };

  const fetchAllReservationsForAdmin = async () => {
    setLoading(true);
    try {

      const response = await fetch('http://localhost:5000/api/reservations/');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch all reservations.' }));
        throw new Error(errorData.message);
      }
      const data = await response.json();
      setAllReservationsForAdmin(data.data || data || []);
    } catch (err) {
      console.error('Error fetching all reservations for admin:', err);
      setAdminPanelError(err.message || 'Could not load all reservations.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminPanelError('');
    setAdminPanelMessage('');
    setLoading(true);
    setShowCartSidebar(false)

    try {

      const response = await fetch(`http://localhost:5000/api/reservations/users/${adminCredentials.email}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found.');
        }
        const errorData = await response.json().catch(() => ({ message: 'Login failed. Please try again.' }));
        throw new Error(errorData.message);
      }

      const userData = await response.json();
      const user = userData.data || userData; // Adjust based on your API response structure


      if (user && user.password === adminCredentials.password) {
        if (user.role !== 'admin') {
          throw new Error('Only admin can login!');
        }
        setIsAdminLoggedIn(true);
        setAdminPanelMessage('Login successful. Welcome, Admin!');
        setAdminCredentials({ email: '', password: '' }); // Clear credentials after login
        fetchAllReservationsForAdmin(); // Fetch data for the dashboard
        fetchAndSetInitialMenuStock(); // Fetch initial stock for menu items
        setMenuStockInputs({});
        setShowCartSidebar(false);
        setReservationStatusInputs({});
      } else {
        throw new Error('Invalid email or password.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setAdminPanelError(err.message || 'An error occurred during login.');
      setIsAdminLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminCredentials({ email: '', password: '' });
    setActiveTab('home');
    setAdminPanelMessage('You have been logged out.');
    setAllReservationsForAdmin([]);
    setMenuStockInputs({});
    setReservationStatusInputs({});
    setAdminPanelError('');
  };

  const handleMenuStockInputChange = (menuId, value) => {
    setMenuStockInputs(prev => ({
      ...prev,
      [menuId]: value
    }));
  };

  const handleUpdateMenuItemStock = async (menuId) => {
    const newStockQuantity = menuStockInputs[menuId];
    if (newStockQuantity === undefined || newStockQuantity.trim() === '' || isNaN(parseInt(newStockQuantity)) || parseInt(newStockQuantity) < 0) {
      setAdminPanelError(`Please enter a valid, non-negative stock quantity for item ${menuId}.`);
      return;
    }

    setLoading(true);
    setAdminPanelError('');
    setAdminPanelMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/menu/stock', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_id: Number(menuId), // Ensure menu_id is a number
          quantity: parseInt(newStockQuantity)
        })
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to update stock for item ${menuId}.`);
      }
      setAdminPanelMessage(`Stock for item ${menuId} (Name: ${menuItems.find(item => item.menu_id === Number(menuId))?.name || 'N/A'}) updated to ${newStockQuantity}.`);
      setMenuStockInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[menuId];
        return newInputs;
      });
      // Update the menuItems state to reflect the new stock quantity locally
      setMenuItems(prevItems =>
        prevItems.map(menuItem =>
          menuItem.menu_id === Number(menuId)
            ? { ...menuItem, quantity_in_stock: parseInt(newStockQuantity) }
            : menuItem
        )
      );
    } catch (err) {
      console.error('Error updating stock:', err);
      setAdminPanelError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminDeleteReservation = async (reservationId) => {
    if (!window.confirm(`Are you sure you want to delete reservation ID: ${reservationId}? This action cannot be undone.`)) return;

    setLoading(true);
    setAdminPanelError('');
    setAdminPanelMessage('');
    try {

      const response = await fetch(`http://localhost:5000/api/reservations/${reservationId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete reservation.' }));
        throw new Error(errorData.message);
      }
      setAdminPanelMessage(`Reservation ID: ${reservationId} deleted successfully.`);
      setAllReservationsForAdmin(prev => prev.filter(res => res.reservation_id !== reservationId));
    } catch (err) {
      console.error('Error deleting reservation:', err);
      setAdminPanelError(`Failed to delete reservation ${reservationId}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReservationStatusInputChange = (reservationId, value) => {
    setReservationStatusInputs(prev => ({
      ...prev,
      [reservationId]: value
    }));
  };

  const handleAdminUpdateReservationStatus = async (reservationId) => {
    const newStatus = reservationStatusInputs[reservationId];
    if (!newStatus || newStatus.trim() === '') {
      setAdminPanelError(`Please select or enter a new status for reservation ID: ${reservationId}.`);
      return;
    }
    setLoading(true);
    setAdminPanelError('');
    setAdminPanelMessage('');
    try {
      const response = await fetch(`http://localhost:5000/api/reservations/${reservationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update reservation status.' }));
        throw new Error(errorData.message);
      }
      setAdminPanelMessage(`Reservation ID: ${reservationId} status updated to ${newStatus}.`);
      setAllReservationsForAdmin(prev =>
        prev.map(res =>
          res.reservation_id === reservationId ? { ...res, status: newStatus } : res
        )
      );
      setReservationStatusInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[reservationId];
        return newInputs;
      });
    } catch (err) {
      console.error('Error updating reservation status:', err);
      setAdminPanelError(`Failed to update status for reservation ${reservationId}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add this function before the return statement
  const filteredReviews = reviews.filter(review => {
    if (selectedRatingFilter === 'all') return true;
    return review.rating === parseInt(selectedRatingFilter);
  });

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare the review data according to the model's parameters
      const reviewData = {
        user_id: reviewForm.user_id,
        menu_id: parseInt(reviewForm.menu_id),
        rating: parseInt(reviewForm.rating),
        comment: reviewForm.review_text // Changed from review_text to comment to match model
      };

      const response = await fetch('http://localhost:5000/api/dish-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      const data = await response.json();
      
      // Add the new review to the reviews list
      const newReview = {
        review_id: data.review_id,
        menu_id: reviewData.menu_id,
        rating: reviewData.rating,
        review_text: reviewData.comment,
        user_id: reviewData.user_id,
        review_date: new Date().toISOString(),
        dish_name: menuItems.find(item => item.menu_id === reviewData.menu_id)?.name || 'Unknown Dish'
      };

      setReviews(prevReviews => [newReview, ...prevReviews]);
      setShowReviewForm(false);
      setReviewForm({
        menu_id: '',
        rating: 5,
        review_text: '',
        user_id: '' // Reset to empty string
      });
      setSuccess('Review submitted successfully!');
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      console.error('Review submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewInputChange = (e) => {
    const { name, value } = e.target;
    setReviewForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="App" style={{ minHeight: '100vh', width: '100vw', background: '#f7f7f9', overflowX: 'hidden' }}>
      <header className="navbar" style={{
        width: '100vw',
        left: 0,
        right: 0,
        top: 0,
        position: 'fixed',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 2rem',
        minHeight: '64px',
      }}>
        <div className="logo" style={{ color: '#b22222', fontWeight: 700, fontSize: '1.5rem' }}>Ash Roots Cafe</div>
        <nav style={{ flex: 1 }}>
          <ul style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '2rem',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            flexWrap: 'wrap',
            overflowX: 'auto',
          }}>
            <li className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')} style={{ cursor: 'pointer', fontWeight: activeTab === 'home' ? 700 : 400, borderBottom: activeTab === 'home' ? '2px solid #b22222' : 'none', color: activeTab === 'home' ? '#b22222' : '#222', padding: '0.5rem 0' }}>Home</li>
            <li className={activeTab === 'menu' ? 'active' : ''} onClick={() => setActiveTab('menu')} style={{ cursor: 'pointer', fontWeight: activeTab === 'menu' ? 700 : 400, borderBottom: activeTab === 'menu' ? '2px solid #b22222' : 'none', color: activeTab === 'menu' ? '#b22222' : '#222', padding: '0.5rem 0' }}>Menu</li>
            <li className={activeTab === 'reservations' ? 'active' : ''} onClick={() => setActiveTab('reservations')} style={{ cursor: 'pointer', fontWeight: activeTab === 'reservations' ? 700 : 400, borderBottom: activeTab === 'reservations' ? '2px solid #b22222' : 'none', color: activeTab === 'reservations' ? '#b22222' : '#222', padding: '0.5rem 0' }}>Reservations</li>
            <li className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')} style={{ cursor: 'pointer', fontWeight: activeTab === 'reviews' ? 700 : 400, borderBottom: activeTab === 'reviews' ? '2px solid #b22222' : 'none', color: activeTab === 'reviews' ? '#b22222' : '#222', padding: '0.5rem 0' }}>Reviews</li>
            <li className={activeTab === 'admin' ? 'active' : ''} onClick={() => setActiveTab('admin')} style={{ cursor: 'pointer', fontWeight: activeTab === 'admin' ? 700 : 400, borderBottom: activeTab === 'admin' ? '2px solid #b22222' : 'none', color: activeTab === 'admin' ? '#b22222' : '#222', padding: '0.5rem 0' }}>Admin Panel</li>
          </ul>
        </nav>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '5rem 2rem 0 2rem' }}>
        {activeTab === 'home' && (
          <section className="home-section">
            <div className="hero" style={{
              width: '100vw',
              marginLeft: 'calc(-50vw + 50%)',
              height: 'calc(100vh - 64px)',
              maxHeight: '550px',
              backgroundImage: "url('/front.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              backgroundRepeat: 'no-repeat',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: '#fff',
              textAlign: 'center',
              padding: '2rem',
              boxSizing: 'border-box',
            }}>
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                zIndex: 1
              }} />
              <div style={{ position: 'relative', zIndex: 2, maxWidth: '700px' }}>
                <h1 style={{ fontSize: '3.5rem', fontWeight: 700, marginBottom: '1rem', lineHeight: 1.2, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  Welcome to Ash Roots Cafe
                </h1>
                <p style={{ fontSize: '1.3rem', marginBottom: '2rem', lineHeight: 1.6, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                  Experience the finest local cuisine in a cozy and inviting atmosphere.
                </p>
                <button
                  className="cta-button"
                  style={{
                    fontSize: '1.2rem',
                    padding: '1rem 2.5rem',
                    borderRadius: '50px',
                    fontWeight: 600,
                    background: '#b22222',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    transition: 'background-color 0.3s ease, transform 0.3s ease',
                  }}
                  onClick={() => setActiveTab('reservations')}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#9a1d1d'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#b22222'}
                >
                  BOOK A TABLE
                </button>
              </div>
            </div>

            <section className="about-section" style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.07)',
              margin: '3rem auto',
              maxWidth: '1100px',
              overflow: 'hidden',
            }}>
              <div style={{
                flex: '1 1 50%',
                minWidth: '300px',
                padding: '3rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxSizing: 'border-box',
              }}>
                <h2 style={{
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: '2.5rem',
                  marginBottom: '1.5rem',
                  color: '#333',
                  lineHeight: 1.3
                }}>
                  Authentic Flavors,<br />Locally Sourced
                </h2>
                <p style={{
                  color: '#555',
                  fontSize: '1.15rem',
                  lineHeight: 1.8,
                  marginBottom: '1.5rem',
                }}>
                  We are a family-owned restaurant dedicated to crafting high-quality dishes using fresh, local ingredients. Our passion is to bring you an unforgettable dining experience.
                </p>
                <button
                  style={{
                    background: '#5a3825',
                    color: '#fff',
                    padding: '0.8rem 1.8rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 500,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    transition: 'background-color 0.3s ease',
                  }}
                  onClick={() => setActiveTab('menu')}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#442b1d'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#5a3825'}
                >
                  Explore Our Menu
                </button>
              </div>
              <div style={{
                flex: '1 1 50%',
                minWidth: '300px',
                maxHeight: '450px',
                overflow: 'hidden',
                display: 'flex',
              }}>
                <img
                  src="/homepagesec.webp"
                  alt="High-quality local dishes"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '0 12px 12px 0',
                  }}
                />
              </div>
            </section>
          </section>
        )}

        {activeTab === 'menu' && (
          <section className="menu-section">
            <div className="search-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                placeholder="Search for dishes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ flex: 1, fontSize: '1.1rem', padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid #ccc' }}
              />
              <button className="search-button" style={{ background: '#900', color: '#fff', borderRadius: '8px', padding: '0.7rem 1.5rem', fontWeight: 600 }}>
                Search
              </button>
            </div>
            <div className="categories">
              <div className="category-chips" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                {['All', 'Appetizers', 'Main Course', 'Desserts', 'Beverages'].map(cat => (
                  <div
                    key={cat}
                    className={`category-chip${selectedCategory === cat ? ' active' : ''}`}
                    style={{
                      background: selectedCategory === cat ? '#900' : '#eee',
                      color: selectedCategory === cat ? '#fff' : '#333',
                      fontWeight: selectedCategory === cat ? 700 : 400,
                      borderRadius: '2rem',
                      padding: '0.5rem 1.2rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </div>
            <h2>Our Menu</h2>
            {(!Array.isArray(filteredMenuItems) || filteredMenuItems.length === 0) ? (
              <div className="loading-indicator">
                <p>No menu items found.</p>
              </div>
            ) : (
              <div className="menu-cards">
                {filteredMenuItems.map((item) => (
                  <div className="menu-card" key={item.menu_id || item.id}>
                    <div className="menu-card-image" style={{ backgroundImage: `url('${getMenuImage(item.name)}')` }}></div>
                    <div className="menu-card-content">
                      <h3>{item.name}</h3>
                      <p className="menu-card-description">{item.description}</p>
                      <div className="menu-card-ratings">
                        {item.average_rating !== undefined && (
                          <span className="rating-stars">
                            {'★'.repeat(Math.round(item.average_rating))}{'☆'.repeat(5 - Math.round(item.average_rating))} ({item.review_count} reviews)
                          </span>
                        )}
                      </div>
                      <div className="menu-card-footer">
                        <p className="menu-card-price">${item.price}</p>
                        <button className="add-button" onClick={() => handleAddToCart(item)} style={{ background: '#900', color: '#fff', borderRadius: '50%', width: 36, height: 36, fontSize: 22, fontWeight: 700, border: 'none', cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'reservations' && (
          <section className="reservations-section">
            <h2>Book a Table</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="reservation-check">
              <h3>Check Your Reservations</h3>
              <div className="check-reservations-form">
                <div className="search-bar">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                  <button onClick={fetchUserReservations}>SEARCH</button>
                </div>
              </div>

              {showUserReservations && (
                <div className="user-reservations">
                  <h4>Your Reservations</h4>
                  {userReservations.length === 0 ? (
                    <p>No reservations found for this email.</p>
                  ) : (
                    <div className="reservations-list">
                      {userReservations.map(reservation => (
                        <div
                          key={reservation.reservation_id}
                          className={`reservation-card ${reservation.status}`}
                          style={{ marginBottom: '20px' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                            {/* Left side: Details and Cancel button */}
                            <div className="reservation-details" style={{ flex: 1, paddingRight: '20px' }}>
                              <h4>Table for {reservation.table_capacity} people</h4>
                              <p>{formatDate(reservation.reservation_date)}</p>
                              <p>{formatTime(reservation.time_slot)}</p>
                              <span
                                className={`status ${reservation.status}`}
                                style={{
                                  display: 'block', // Ensure it takes its own line
                                  marginBottom: '10px', // Space below the status text
                                  color: reservation.status === 'confirmed' ? '#28a745' : 'inherit',
                                  fontWeight: reservation.status === 'confirmed' ? 'bold' : 'normal'
                                }}
                              >
                                {reservation.status}
                              </span>
                              {reservation.status === 'confirmed' && (
                                <button
                                  className="cancel-button"
                                  onClick={() => cancelReservation(reservation.reservation_id)}
                                  style={{
                                    background: '#b22222',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '8px 12px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.85em',
                                    textAlign: 'center',
                                    marginTop: '5px', // Adjusted space above the cancel button
                                    display: 'inline-block',
                                    transition: 'background-color 0.2s ease',
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#9a1d1d'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#b22222'}
                                  disabled={loading}
                                >
                                  CANCEL
                                </button>
                              )}
                            </div>

                            {/* Right side: QR code ONLY */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              marginLeft: '10px',
                              minWidth: '90px'
                            }}>
                              <div className="qr-code-container" style={{ textAlign: 'center' }}>
                                <QRCodeCanvas
                                  value={String(reservation.reservation_id)}
                                  size={80}
                                  bgColor={"#ffffff"}
                                  fgColor={"#000000"}
                                  level={"L"}
                                  includeMargin={false}
                                />
                                <p style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '5px', color: '#666' }}>
                                  ID: {reservation.reservation_id}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleReservationSubmit} className="reservation-form">
              <div className="form-card">
                <h3>Reservation Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={reservationForm.date}
                      onChange={handleInputChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="time">Time</label>
                    <select
                      id="time"
                      name="time"
                      value={reservationForm.time}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a time</option>
                      <option value="17:00:00">5:00 PM</option>
                      <option value="17:30:00">5:30 PM</option>
                      <option value="18:00:00">6:00 PM</option>
                      <option value="18:30:00">6:30 PM</option>
                      <option value="19:00:00">7:00 PM</option>
                      <option value="19:30:00">7:30 PM</option>
                      <option value="20:00:00">8:00 PM</option>
                      <option value="20:30:00">8:30 PM</option>
                      <option value="21:00:00">9:00 PM</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="partySize">Party Size</label>
                    <input
                      type="number"
                      id="partySize"
                      name="partySize"
                      min="1"
                      max="20"
                      value={reservationForm.partySize}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {availableTables && availableTables.length > 0 ? (
                  <div className="available-tables" style={{ marginTop: '20px' }}>
                    <h3>Tables</h3>
                    <div className="table-options" style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '10px',
                      marginTop: '15px'
                    }}>
                      {availableTables.map(table => (
                        <div
                          key={table.table_id}
                          className={`table-option ${reservationForm.tableId === table.table_id ? 'selected' : ''} ${!table.is_available ? 'unavailable' : ''}`}
                          onClick={() => table.is_available === 1 && handleTableSelect(table.table_id)}
                          style={{
                            padding: '15px',
                            borderRadius: '8px',
                            border: reservationForm.tableId === table.table_id
                              ? '2px solid #900'
                              : table.is_available === 1
                                ? '1px solid #ddd'
                                : '1px solid #ffcccc',
                            backgroundColor: reservationForm.tableId === table.table_id
                              ? '#fff5f5'
                              : table.is_available === 1
                                ? '#fff'
                                : '#fff5f5',
                            cursor: table.is_available === 1 ? 'pointer' : 'not-allowed',
                            minWidth: '150px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            position: 'relative',
                            opacity: table.is_available === 1 ? 1 : 0.7
                          }}
                        >
                          {table.is_available === 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%) rotate(-45deg)',
                              fontSize: '24px',
                              color: '#ff0000',
                              fontWeight: 'bold',
                              textShadow: '0 0 3px rgba(255,255,255,0.8)',
                              zIndex: 1
                            }}>
                              ✕
                            </div>
                          )}
                          <div className="table-number" style={{ 
                            fontWeight: 'bold', 
                            fontSize: '16px',
                            color: table.is_available === 1 ? '#000' : '#999'
                          }}>
                            Table {table.table_id}
                          </div>
                          <div className="table-capacity" style={{ 
                            color: table.is_available === 1 ? '#666' : '#999',
                            marginTop: '5px'
                          }}>
                            {table.capacity_display}
                          </div>
                          {reservationForm.tableId === table.table_id && (
                            <div className="table-selected" style={{
                              color: '#900',
                              marginTop: '8px',
                              fontWeight: 'bold'
                            }}>✓ Selected</div>
                          )}
                          {table.is_available === 0 && (
                            <div style={{
                              color: '#ff0000',
                              marginTop: '8px',
                              fontSize: '12px',
                              textAlign: 'center'
                            }}>
                              Already Booked
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  reservationForm.date && reservationForm.time && reservationForm.partySize ? (
                    <div style={{
                      marginTop: '20px',
                      padding: '15px',
                      backgroundColor: '#fff5f5',
                      borderRadius: '8px',
                      border: '1px solid #ffcccc',
                      color: '#d00'
                    }}>
                      {error || 'No tables available for this date, time, and party size. Please try a different combination.'}
                    </div>
                  ) : null
                )}
              </div>

              <div className="form-card">
                <h3>Contact Information</h3>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={reservationForm.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Your full name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={reservationForm.email}
                    onChange={handleInputChange}
                    required
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="form-card">
                <div className="form-group">
                  <label htmlFor="message">Special Requests (Optional)</label>
                  <textarea
                    id="message"
                    name="message"
                    value={reservationForm.message}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Any special requests or dietary requirements?"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="mailingList"
                    name="mailingList"
                    checked={reservationForm.mailingList}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="mailingList">Sign up for our mailing list to receive special offers</label>
                </div>
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? 'PROCESSING...' : 'BOOK TABLE'}
              </button>
            </form>
          </section>
        )}

        {activeTab === 'reviews' && (
          <section className="reviews-section">
            <h2>Customer Reviews</h2>
            <div className="rating-summary">
              <div className="average-rating">
                <h3>4.8</h3>
                <div className="stars">{'★'.repeat(5)}</div>
                <p>Based on {reviews.length} reviews</p>
              </div>
            </div>

            <div className="reviews-filter">
              <h3>Filter Reviews</h3>
              <div className="star-filters">
                <button 
                  className={`star-filter ${selectedRatingFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedRatingFilter('all')}
                  style={{
                    background: selectedRatingFilter === 'all' ? '#b22222' : '#eee',
                    color: selectedRatingFilter === 'all' ? '#fff' : '#333',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    marginRight: '8px'
                  }}
                >
                  All
                </button>
                {[5, 4, 3, 2, 1].map(rating => (
                  <button
                    key={rating}
                    className={`star-filter ${selectedRatingFilter === rating.toString() ? 'active' : ''}`}
                    onClick={() => setSelectedRatingFilter(rating.toString())}
                    style={{
                      background: selectedRatingFilter === rating.toString() ? '#b22222' : '#eee',
                      color: selectedRatingFilter === rating.toString() ? '#fff' : '#333',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      marginRight: '8px'
                    }}
                  >
                    {rating}★
                  </button>
                ))}
              </div>
            </div>

            {(!Array.isArray(filteredReviews) || filteredReviews.length === 0) ? (
              <div className="loading-indicator">
                <p>No reviews found for the selected filter.</p>
              </div>
            ) : (
              <div className="reviews-list">
                {filteredReviews.map((review) => (
                  <div className="review-card" key={review.review_id || review.id}>
                    <div className="review-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">
                          {(review.reviewer_name || 'Happy Customer').charAt(0)}
                        </div>
                        <div>
                          <h4>{review.reviewer_name || 'Happy Customer'}</h4>
                          <p className="review-date">{formatDate(review.review_date || review.created_at)}</p>
                        </div>
                      </div>
                      <div className="stars">
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                    <h3 className="dish-name">{review.dish_name || 'Delicious Dish'}</h3>
                    <p className="review-text">{review.review_text || review.comment}</p>
                    <div className="review-actions">
                      <button className="helpful-button">
                        <span>👍</span> Helpful
                      </button>
                      <button className="report-button">
                        Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button 
              className="add-review-button"
              onClick={() => setShowReviewForm(true)}
              style={{
                background: '#b22222',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '4px',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              WRITE A REVIEW
            </button>

            {/* Review Form Modal */}
            {showReviewForm && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: '#fff',
                  padding: '2rem',
                  borderRadius: '8px',
                  width: '90%',
                  maxWidth: '500px',
                  position: 'relative'
                }}>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    ×
                  </button>

                  <h2 style={{ marginBottom: '1.5rem' }}>Write a Review</h2>
                  
                  {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
                  
                  <form onSubmit={handleReviewSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem' }}>User ID</label>
                      <input
                        type="number"
                        name="user_id"
                        value={reviewForm.user_id}
                        onChange={handleReviewInputChange}
                        required
                        min="1"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #ccc'
                        }}
                        placeholder="Enter your user ID"
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Dish</label>
                      <select
                        name="menu_id"
                        value={reviewForm.menu_id}
                        onChange={handleReviewInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #ccc'
                        }}
                      >
                        <option value="">Select a dish</option>
                        {menuItems.map(item => (
                          <option key={item.menu_id} value={item.menu_id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem' }}>Rating</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '1.5rem',
                              cursor: 'pointer',
                              color: star <= reviewForm.rating ? '#ffd700' : '#ccc'
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem' }}>Your Review</label>
                      <textarea
                        name="review_text"
                        value={reviewForm.review_text}
                        onChange={handleReviewInputChange}
                        required
                        rows="4"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #ccc'
                        }}
                        placeholder="Share your experience with this dish..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        background: '#b22222',
                        color: '#fff',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '4px',
                        border: 'none',
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      {loading ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'admin' && (
          <section className="admin-panel-section" style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            {!isAdminLoggedIn ? (
              <>
                <h2>Admin Login</h2>
                {adminPanelError && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{adminPanelError}</div>}
                {adminPanelMessage && <div className="success-message" style={{ color: 'green', marginBottom: '10px' }}>{adminPanelMessage}</div>}
                <form onSubmit={handleAdminLogin} className="admin-login-form">
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label htmlFor="adminEmail" style={{ display: 'block', marginBottom: '5px' }}>Email</label>
                    <input
                      type="email"
                      id="adminEmail"
                      name="email"
                      value={adminCredentials.email}
                      onChange={handleAdminInputChange}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label htmlFor="adminPassword" style={{ display: 'block', marginBottom: '5px' }}>Password</label>
                    <input
                      type="password"
                      id="adminPassword"
                      name="password"
                      value={adminCredentials.password}
                      onChange={handleAdminInputChange}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>
                  <button type="submit" className="submit-button" disabled={loading} style={{ padding: '10px 20px', background: '#b22222', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {loading ? 'LOGGING IN...' : 'LOGIN'}
                  </button>
                </form>

              </>
            ) : (
              <div className="admin-dashboard">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2>Admin Dashboard</h2>
                  <button onClick={handleAdminLogout} className="submit-button" style={{ padding: '8px 15px', background: '#555', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    LOGOUT
                  </button>
                </div>

                {adminPanelError && <div className="error-message" style={{ color: 'red', marginBottom: '10px', border: '1px solid red', padding: '10px', borderRadius: '4px' }}>{adminPanelError}</div>}
                {adminPanelMessage && <div className="success-message" style={{ color: 'green', marginBottom: '10px', border: '1px solid green', padding: '10px', borderRadius: '4px' }}>{adminPanelMessage}</div>}
                {loading && <p>Loading data...</p>}

                {/* Reservation Analysis Report Section */}
                <div className="admin-section" style={{ marginBottom: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '8px', background: '#fff' }}>
                  <h3 style={{ marginBottom: '20px', color: '#333' }}>Reservation Analysis Report</h3>
                  
                  {(!Array.isArray(allReservationsForAdmin) || allReservationsForAdmin.length === 0) ? (
                    <p>No reservation data available for analysis.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                      {/* Peak Hours Analysis */}
                      <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                        <h4 style={{ marginBottom: '15px', color: '#444' }}>Peak Hours Analysis</h4>
                        {(() => {
                          // Filter out cancelled reservations and ensure time_slot is in correct format
                          const timeSlots = allReservationsForAdmin
                            .filter(r => r.status !== 'cancelled' && r.time_slot)
                            .map(r => {
                              // Ensure time_slot is in HH:mm:ss format
                              const [hours, minutes, seconds] = r.time_slot.split(':').map(Number);
                              return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${(seconds || 0).toString().padStart(2, '0')}`;
                            });
                          
                          const timeCount = timeSlots.reduce((acc, time) => {
                            acc[time] = (acc[time] || 0) + 1;
                            return acc;
                          }, {});

                          const peakHours = Object.entries(timeCount)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 3);

                          return (
                            <div>
                              <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Most Popular Time Slots:</p>
                              {peakHours.map(([time, count]) => (
                                <div key={time} style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  padding: '8px',
                                  background: '#fff',
                                  marginBottom: '5px',
                                  borderRadius: '4px',
                                  border: '1px solid #eee'
                                }}>
                                  <span>{formatTime(time)}</span>
                                  <span style={{ fontWeight: 'bold', color: '#b22222' }}>{count} reservations</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Reservation Status Distribution */}
                      <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                        <h4 style={{ marginBottom: '15px', color: '#444' }}>Reservation Status Distribution</h4>
                        {(() => {
                          const statusCount = allReservationsForAdmin.reduce((acc, res) => {
                            acc[res.status] = (acc[res.status] || 0) + 1;
                            return acc;
                          }, {});

                          const total = Object.values(statusCount).reduce((a, b) => a + b, 0);

                          return (
                            <div>
                              {Object.entries(statusCount).map(([status, count]) => (
                                <div key={status} style={{ marginBottom: '10px' }}>
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    marginBottom: '5px'
                                  }}>
                                    <span style={{ textTransform: 'capitalize' }}>{status}</span>
                                    <span>{count} ({((count/total)*100).toFixed(1)}%)</span>
                                  </div>
                                  <div style={{
                                    height: '8px',
                                    background: '#e9ecef',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{
                                      width: `${(count/total)*100}%`,
                                      height: '100%',
                                      background: status === 'confirmed' ? '#28a745' : 
                                                status === 'cancelled' ? '#dc3545' : 
                                                '#ffc107',
                                      borderRadius: '4px'
                                    }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Recent Activity */}
                      <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                        <h4 style={{ marginBottom: '15px', color: '#444' }}>Recent Activity</h4>
                        {(() => {
                          const recentReservations = [...allReservationsForAdmin]
                            .sort((a, b) => new Date(b.reservation_date) - new Date(a.reservation_date))
                            .slice(0, 5);

                          return (
                            <div>
                              {recentReservations.map(res => {
                                // Ensure time_slot is in HH:mm:ss format
                                const [hours, minutes, seconds] = res.time_slot.split(':').map(Number);
                                const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${(seconds || 0).toString().padStart(2, '0')}`;
                                
                                return (
                                  <div key={res.reservation_id} style={{
                                    padding: '10px',
                                    background: '#fff',
                                    marginBottom: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #eee',
                                    fontSize: '0.9em'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                      <span style={{ fontWeight: 'bold' }}>ID: {res.reservation_id}</span>
                                      <span style={{ 
                                        color: res.status === 'confirmed' ? '#28a745' : 
                                               res.status === 'cancelled' ? '#dc3545' : 
                                               '#ffc107',
                                        textTransform: 'capitalize'
                                      }}>{res.status}</span>
                                    </div>
                                    <div style={{ color: '#666' }}>
                                      {formatDate(res.reservation_date)} at {formatTime(formattedTime)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                {/* Update Menu Item Stock Section */}
                <div className="admin-section" style={{ marginBottom: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
                  <h3>Update Menu Item Stock</h3>
                  {(!Array.isArray(menuItems) || menuItems.length === 0) ? (
                    <p>No menu items loaded or found.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Current Stock (if known)</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>New Stock</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuItems.map(item => (
                          <tr key={item.menu_id}>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.menu_id}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.name}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.quantity_in_stock !== undefined ? item.quantity_in_stock : 'N/A'}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                              <input
                                type="number"
                                min="0"
                                placeholder="Enter new stock"
                                value={menuStockInputs[item.menu_id] || ''}
                                onChange={(e) => handleMenuStockInputChange(item.menu_id, e.target.value)}
                                style={{ padding: '5px', width: '100px', borderRadius: '4px', border: '1px solid #ccc' }}
                              />
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                              <button
                                onClick={() => handleUpdateMenuItemStock(item.menu_id)}
                                disabled={loading || menuStockInputs[item.menu_id] === undefined || menuStockInputs[item.menu_id].trim() === ''}
                                style={{ padding: '5px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                Update
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Manage Reservations Section */}
                <div className="admin-section" style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
                  <h3>Manage Reservations</h3>
                  {(!Array.isArray(allReservationsForAdmin) || allReservationsForAdmin.length === 0) ? (
                    <p>No reservations found or loaded.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Time</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Update Status</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allReservationsForAdmin.map(res => (
                          <tr key={res.reservation_id}>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{res.reservation_id}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(res.reservation_date)}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatTime(res.time_slot)}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{res.status}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                              <select
                                value={reservationStatusInputs[res.reservation_id] || ''}
                                onChange={(e) => handleReservationStatusInputChange(res.reservation_id, e.target.value)}
                                style={{ padding: '5px', marginRight: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                              >
                                <option value="">Select Status</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="pending">Pending</option>
                                
                              </select>
                              <button
                                onClick={() => handleAdminUpdateReservationStatus(res.reservation_id)}
                                disabled={loading || !reservationStatusInputs[res.reservation_id]}
                                style={{ padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                Set Status
                              </button>
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                              <button
                                onClick={() => handleAdminDeleteReservation(res.reservation_id)}
                                disabled={loading}
                                style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Cart Sidebar */}
      {showCartSidebar && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 350,
          height: '100vh',
          background: '#fff',
          boxShadow: '-2px 0 16px rgba(0,0,0,0.12)',
          zIndex: 200,
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Your Cart</h2>
          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {cart.map(item => (
                <div key={item.menu_id} style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
                  <img src={getMenuImage(item.name)} alt={item.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', marginRight: 12 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ color: '#888', fontSize: 14 }}>${item.price} x {item.quantity}</div>
                    <input type="number" min={1} value={item.quantity} onChange={e => handleUpdateQuantity(item.menu_id, Math.max(1, Number(e.target.value)))} style={{ width: 48, marginTop: 4 }} />
                  </div>
                  <button onClick={() => handleRemoveFromCart(item.menu_id)} style={{ background: 'none', border: 'none', color: '#900', fontWeight: 700, fontSize: 20, marginLeft: 8, cursor: 'pointer' }}>×</button>
                </div>
              ))}
            </div>
          )}
          {/* Last order summary row */}
          {lastOrder && (
            <div style={{ background: '#f7f7f9', borderRadius: 8, padding: '1rem', margin: '1rem 0', border: '1px solid #eee' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Last Order</div>
              <div>Order ID: {lastOrder.order_id}</div>
              <div>Total: ${lastOrder.total_price.toFixed(2)}</div>
              <div>Items: {lastOrder.item_count}</div>
              <div>Status: <span style={{ color: '#090' }}>{lastOrder.status}</span></div>
            </div>
          )}
          <div style={{ marginTop: 'auto' }}>
            <button onClick={handlePlaceOrder} style={{ background: '#900', color: '#fff', borderRadius: 8, padding: '0.9rem 2rem', fontWeight: 700, fontSize: 18, width: '100%', marginTop: 18 }}>
              Place Order
            </button>
            <button onClick={() => setShowCartSidebar(false)} style={{ background: 'none', color: '#900', border: 'none', fontWeight: 600, fontSize: 16, marginTop: 12, width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Cart Button in Navbar */}
      {!isAdminLoggedIn && (
        <button onClick={() => setShowCartSidebar(true)} style={{
          position: 'fixed',
          top: 90,
          right: 24,
          zIndex: 150,
          background: '#900',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: 48,
          height: 48,
          fontSize: 26,
          fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          cursor: 'pointer',
        }}>
          🛒
          {cart.length > 0 && (
            <span style={{ position: 'absolute', top: 6, right: 6, background: '#fff', color: '#900', borderRadius: '50%', fontSize: 14, fontWeight: 700, padding: '2px 7px', minWidth: 22, textAlign: 'center' }}>{cart.length}</span>
          )}
        </button>
      )}

      <footer style={{ width: '100vw', left: 0, right: 0, position: 'relative', background: '#222', color: '#fff', marginTop: '2rem', padding: 0 }}>
        <div className="footer-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
          <div className="footer-section">
            <h3>Hours</h3>
            <p>Monday - Friday: 5pm - 10pm</p>
            <p>Saturday - Sunday: 4pm - 11pm</p>
          </div>
          <div className="footer-section">
            <h3>Contact</h3>
            <p>123 Restaurant Street</p>
            <p>City, State 12345</p>
            <p>Phone: (123) 456-7890</p>
          </div>
          <div className="footer-section">
            <h3>Follow Us</h3>
            <div className="social-links">
              <a href="#" className="social-link" style={{ color: '#fff' }}>Facebook</a>
              <a href="#" className="social-link" style={{ color: '#fff' }}>Instagram</a>
              <a href="#" className="social-link" style={{ color: '#fff' }}>Twitter</a>
            </div>
          </div>
        </div>
        <div className="copyright" style={{ textAlign: 'center', padding: '1rem', background: '#181818', color: '#bbb' }}>
          <p>© 2023 Restaurant DB. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

