-- Create Database
CREATE DATABASE RestaurantDB;
GO

-- Use the Database
USE RestaurantDB;
GO

-- Create Tables
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('customer', 'admin', 'staff')) NOT NULL
);

CREATE TABLE Tables (
    table_id INT IDENTITY(1,1) PRIMARY KEY,
    capacity INT NOT NULL
);

CREATE TABLE Reservations (
    reservation_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    table_id INT NOT NULL,
    reservation_date DATE NOT NULL,
    time_slot TIME NOT NULL,
    status VARCHAR(20) CHECK (status IN ('confirmed', 'cancelled', 'pending')) DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (table_id) REFERENCES Tables(table_id)
);

CREATE TABLE Menu (
    menu_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

CREATE TABLE Orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    reservation_id INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (reservation_id) REFERENCES Reservations(reservation_id)
);

CREATE TABLE Order_Items (
    order_item_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    menu_id INT NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (menu_id) REFERENCES Menu(menu_id)
);

CREATE TABLE Dish_Reviews (
    review_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    menu_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (menu_id) REFERENCES Menu(menu_id)
);

CREATE TABLE Staff (
    staff_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    role VARCHAR(50) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Staff_Ratings (
    rating_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    staff_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
);

CREATE TABLE QR_Codes (
    qr_id INT IDENTITY(1,1) PRIMARY KEY,
    reservation_id INT NOT NULL,
    qr_code VARCHAR(255) NOT NULL,
    FOREIGN KEY (reservation_id) REFERENCES Reservations(reservation_id)
);
GO

-- Insert Data into Users
INSERT INTO Users (name, email, password, role) VALUES
('John Doe', 'john@example.com', 'hashed_password', 'customer'),
('Jane Smith', 'jane@example.com', 'hashed_password', 'admin'),
('Alice Brown', 'alice@example.com', 'hashed_password', 'staff');
GO

-- Insert Data into Tables
INSERT INTO Tables (capacity) VALUES
(2), (4), (6), (8);
GO

-- Insert Data into Reservations
INSERT INTO Reservations (user_id, table_id, reservation_date, time_slot, status) VALUES
(1, 1, '2025-02-20', '18:00:00', 'confirmed'),
(1, 2, '2025-02-21', '19:00:00', 'pending'),
(2, 3, '2025-02-22', '20:00:00', 'cancelled');
GO

-- Insert Data into Menu
INSERT INTO Menu (name, price) VALUES
('Margherita Pizza', 12.99),
('Pasta Alfredo', 14.99),
('Caesar Salad', 8.99);
GO

-- Insert Data into Orders
INSERT INTO Orders (user_id, reservation_id, total_price) VALUES
(1, 1, 27.98),
(1, 2, 14.99),
(2, 3, 8.99);
GO

-- Insert Data into Order_Items
INSERT INTO Order_Items (order_id, menu_id, quantity) VALUES
(1, 1, 2),
(2, 2, 1),
(3, 3, 1);
GO

-- Insert Data into Dish_Reviews
INSERT INTO Dish_Reviews (user_id, menu_id, rating, review_text) VALUES
(1, 1, 5, 'Delicious pizza!'),
(2, 2, 4, 'Very creamy and tasty.'),
(1, 3, 3, 'A bit too sour for my taste.');
GO

-- Insert Data into Staff
INSERT INTO Staff (user_id, role) VALUES
(3, 'Chef'),
(2, 'Waiter');
GO

-- Insert Data into Staff_Ratings
INSERT INTO Staff_Ratings (user_id, staff_id, rating, feedback) VALUES
(1, 1, 5, 'Great chef!'),
(2, 2, 4, 'Very polite waiter.');
GO

-- Insert Data into QR_Codes
INSERT INTO QR_Codes (reservation_id, qr_code) VALUES
(1, 'QR12345'),
(2, 'QR67890'),
(3, 'QR11223');
GO

-- Select Data from All Tables
SELECT * FROM Users;
SELECT * FROM Tables;
SELECT * FROM Reservations;
SELECT * FROM Menu;
SELECT * FROM Orders;
SELECT * FROM Order_Items;
SELECT * FROM Dish_Reviews;
SELECT * FROM Staff;
SELECT * FROM Staff_Ratings;
SELECT * FROM QR_Codes;
GO