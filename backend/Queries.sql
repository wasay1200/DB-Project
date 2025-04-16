-- Users Stored Procedures
CREATE PROCEDURE GetAllUsers
AS
BEGIN
    -- Retrieve all user records from the Users table
    SELECT * FROM Users;
END
GO

CREATE PROCEDURE GetUserByEmail
    @email NVARCHAR(100)
AS
BEGIN
    -- Check if user exists by email
    SELECT * FROM Users WHERE email = @email;
END
GO

CREATE PROCEDURE CreateUser
    @name NVARCHAR(100),
    @email NVARCHAR(100),
    @password NVARCHAR(255),
    @role NVARCHAR(20) = 'customer'
AS
BEGIN
    -- Insert new user if not exists
    INSERT INTO Users (name, email, password, role) 
    VALUES (@name, @email, @password, @role);
    
    SELECT SCOPE_IDENTITY() AS user_id;
END
GO

-- Tables Stored Procedures
CREATE PROCEDURE GetAllTables
AS
BEGIN
    -- Retrieve all table records from the Tables table
    SELECT * FROM Tables;
END
GO

CREATE PROCEDURE GetAvailableTables
    @date DATE,
    @time TIME,
    @partySize INT
AS
BEGIN
    -- Finds available tables matching or exceeding party size
    -- Excludes tables already reserved for the specified date and time
    -- Orders results from closest to perfect capacity match
    SELECT 
        t.*,
        CASE 
            WHEN t.capacity = @partySize THEN 'Perfect Fit'
            ELSE CONCAT('Seats ', t.capacity)
        END AS capacity_display
    FROM Tables t
    WHERE t.capacity >= @partySize
    AND t.table_id NOT IN (
        SELECT r.table_id FROM Reservations r
        WHERE r.reservation_date = @date
        AND r.time_slot = @time
        AND r.status != 'cancelled'
    )
    ORDER BY ABS(t.capacity - @partySize) ASC;
END
GO

CREATE PROCEDURE CheckTableAvailability
    @table_id INT,
    @reservation_date DATE,
    @time_slot TIME
AS
BEGIN
    -- Check if table is available for reservation
    SELECT COUNT(*) AS reservation_count 
    FROM Reservations 
    WHERE table_id = @table_id 
    AND reservation_date = @reservation_date 
    AND time_slot = @time_slot 
    AND status != 'cancelled';
END
GO

-- Reservations Stored Procedures
CREATE PROCEDURE GetAllReservations
AS
BEGIN
    -- Retrieve all reservations joined with user information
    -- Sorted by most recent reservation date and time
    SELECT r.*, u.name AS customer_name, u.email 
    FROM Reservations r
    JOIN Users u ON r.user_id = u.user_id
    ORDER BY r.reservation_date DESC, r.time_slot DESC;
END
GO

CREATE PROCEDURE GetReservationsByEmail
    @email NVARCHAR(100)
AS
BEGIN
    -- Retrieve reservations for a specific customer by email
    -- Includes table capacity information
    -- Sorted by most recent reservation
    SELECT r.*, t.capacity AS table_capacity 
    FROM Reservations r
    JOIN Users u ON r.user_id = u.user_id
    JOIN Tables t ON r.table_id = t.table_id
    WHERE u.email = @email
    ORDER BY r.reservation_date DESC, r.time_slot DESC;
END
GO

CREATE PROCEDURE CreateReservation
    @user_id INT,
    @table_id INT,
    @reservation_date DATE,
    @time_slot TIME,
    @party_size INT = NULL,
    @special_requests NVARCHAR(MAX) = NULL
AS
BEGIN
    -- Insert new reservation
    INSERT INTO Reservations (user_id, table_id, reservation_date, time_slot, status)
    VALUES (@user_id, @table_id, @reservation_date, @time_slot, 'confirmed');
    
    SELECT SCOPE_IDENTITY() AS reservation_id;
END
GO

CREATE PROCEDURE UpdateReservationStatus
    @reservation_id INT,
    @status NVARCHAR(20)
AS
BEGIN
    -- Update the status of a specific reservation
    UPDATE Reservations SET status = @status WHERE reservation_id = @reservation_id;
    SELECT @@ROWCOUNT AS affected_rows;
END
GO

-- Menu Stored Procedures
CREATE PROCEDURE GetMenuItemsWithRatings
AS
BEGIN
    -- Retrieve menu items with their average ratings and review count
    -- Grouped by menu item details
    -- Ordered by category and name
   SELECT 
            m.name, m.price,
           COALESCE(AVG(dr.rating), 0) AS average_rating,
           COUNT(dr.review_id) AS review_count
           FROM Menu m
           LEFT JOIN Dish_Reviews dr ON m.menu_id = dr.menu_id
           GROUP BY m.name,m.price
           ORDER BY m.name;
END
GO

-- Dish Reviews Stored Procedures
CREATE PROCEDURE CreateDishReview
    @user_id INT,
    @menu_id INT,
    @rating INT,
    @comment NVARCHAR(MAX) = NULL
AS
BEGIN
    -- Insert a new dish review with current timestamp
    -- Returns the newly created review's ID
    INSERT INTO Dish_Reviews (user_id, menu_id, rating,review_text)
    VALUES (@user_id, @menu_id, @rating,@comment);
    
    SELECT SCOPE_IDENTITY() AS review_id;
END
GO

CREATE PROCEDURE GetDishReviews
AS
BEGIN
    -- Retrieve dish reviews with associated user and menu item information
    SELECT 
        dr.*, u.name AS reviewer_name, m.name AS dish_name
    FROM Dish_Reviews dr
    JOIN Users u ON dr.user_id = u.user_id
    JOIN Menu m ON dr.menu_id = m.menu_id
END
GO

-- Orders Stored Procedures
CREATE PROCEDURE GetAllOrders
AS
BEGIN
    -- Retrieve all order records from the Orders table
    SELECT * FROM Orders;
END
GO

CREATE PROCEDURE GetAllOrderItems
AS
BEGIN
    -- Retrieve all order item records from the Order_Items table
    SELECT * FROM Order_Items;
END
GO

CREATE PROCEDURE CreateOrder
    @user_id INT,
    @reservation_id INT = NULL,
    @total_price DECIMAL(10,2)
AS
BEGIN
    -- Insert a new order with pending status
    INSERT INTO Orders (user_id, reservation_id, total_price, order_date, status)
    VALUES (@user_id, @reservation_id, @total_price, GETDATE(), 'pending');
    
    SELECT SCOPE_IDENTITY() AS order_id;
END
GO

CREATE PROCEDURE CreateOrderItem
    @order_id INT,
    @menu_id INT,
    @quantity INT
AS
BEGIN
    -- Insert order items
    INSERT INTO Order_Items (order_id, menu_id, quantity)
    VALUES (@order_id, @menu_id, @quantity);
END
GO

CREATE PROCEDURE GetUserOrders
    @user_id INT
AS
BEGIN
    -- Retrieve user's orders with item count
 
    SELECT 
        o.order_id, o.total_price,
        COUNT(oi.order_item_id) AS item_count
    FROM Orders o
    JOIN Order_Items oi ON o.order_id = oi.order_id
    WHERE o.user_id = @user_id
    GROUP BY o.order_id, o.total_price
END
GO

CREATE PROCEDURE GetOrderDetails
    @order_id INT
AS
BEGIN
    -- Retrieve order details with customer information
    SELECT 
        o.*, u.name AS customer_name, u.email AS customer_email
    FROM Orders o
    JOIN Users u ON o.user_id = u.user_id
    WHERE o.order_id = @order_id;

    -- Retrieve order items with menu item details
    SELECT 
        oi.*, m.name AS item_name
    FROM Order_Items oi
    JOIN Menu m ON oi.menu_id = m.menu_id
    WHERE oi.order_id = @order_id;
END
GO

CREATE PROCEDURE UpdateOrderStatus
    @order_id INT,
    @status NVARCHAR(20)
AS
BEGIN
    -- Update the status of a specific order
    UPDATE Orders SET status = @status WHERE order_id = @order_id;
    SELECT @@ROWCOUNT AS affected_rows;
END
GO

-- Staff Stored Procedures
CREATE PROCEDURE GetAllStaff
AS
BEGIN
    -- Retrieve all staff records from the Staff table
    SELECT * FROM Staff;
END
GO

CREATE PROCEDURE GetAllStaffRatings
AS
BEGIN
    -- Retrieve all staff rating records from the Staff_Ratings table
    SELECT * FROM Staff_Ratings;
END
GO

CREATE PROCEDURE GetStaffRatings
    @staff_id INT
AS
BEGIN
    -- Retrieve ratings for a specific staff member
    -- Includes reviewer's name
    -- Sorted by most recent rating
    SELECT sr.*, u.name AS user_name
    FROM Staff_Ratings sr
    JOIN Users u ON sr.user_id = u.user_id
    WHERE sr.staff_id = @staff_id
    ORDER BY sr.rating_id DESC;
END
GO

CREATE PROCEDURE CreateStaffRating
    @staff_id INT,
    @user_id INT,
    @rating INT,
    @feedback NVARCHAR(MAX) = NULL
AS
BEGIN
    -- Insert a new staff rating
    INSERT INTO Staff_Ratings (staff_id, user_id, rating, feedback)
    VALUES (@staff_id, @user_id, @rating, @feedback);
END
GO

-- Additional Miscellaneous Stored Procedures
CREATE PROCEDURE GetAllQRCodes
AS
BEGIN
    -- Retrieve all QR code records from the QR_Codes table
    SELECT * FROM QR_Codes;
END
GO