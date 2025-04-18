import React, {useState, useEffect} from 'react';
import './App.css';

function App() {
  const [data, setData] = useState(null);

  // Function to fetch data from API
  const fetchData = async (endpoint) => {
    try {
      const response = await fetch(`http://localhost:5000/api/${endpoint}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setData(result); // Store data in state
      console.log(result); // Log data to console
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="App">
      <h1>DB Project</h1>
      <p align="left" className="Body">
        Query1: 
        <button onClick={() => fetchData('dish-reviews')}>Select Dish-reviews</button>
        <br/>
        Query2:
        <button onClick={() => fetchData('dish-reviews/detailed')}>Select Detailed Dish-reviews</button>
        <br/>
        Query3:
        <button onClick={() => fetchData('menu')}>Select Menu</button>
        <br/>
        Query4:
        <button onClick={() => fetchData('menu/with-ratings')}>Select Menu with ratings</button>
        <br/>
        Query5:
        <button onClick={() => fetchData('orders')}>Select Orders</button>
        <br/>
        Query6:
        <button onClick={() => fetchData('orders/items')}>Select Order-items</button>
        <br/>
        Query7:
        <button onClick={() => fetchData('reservations')}>Select Reservations</button>
        <br/>
        Query8:
        <button onClick={() => fetchData('reservations/users')}>Select Users</button>
        <br/>
        Query9:
        <button onClick={() => fetchData('reservations/tables')}>Select Tables</button>
        <br/>
        Query10:
        <button onClick={() => fetchData('staff-ratings')}>Select Staff Ratings</button>
        <br/>
     
      </p>

      {/* Display fetched data */}
      {data && (
        <div>
          <h2>Results:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
