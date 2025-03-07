### Project Setup Guide
=====================
This README provides detailed instructions for setting up the project from scratch. The project consists of both frontend and backend components.

### Prerequisites
Before starting, ensure you have the following installed:

Node.js (LTS version recommended)
Git
SQL Server (or access to a SQL Server instance)
VS Code or your preferred code editor

### Repository Setup

Clone the repository:
```
clone [repository-url]
cd [project-folder]
```


### Backend Setup

1. Navigate to the Backend Directory
bashCopycd backend
2. Install Dependencies
```
npm install
```
3. Environment Configuration
Create a .env file in the backend directory using the provided template:
Copy the example environment file
```
cp .env.example .env
```

Edit the .env file with your SQL Server details:

CopyDB_SERVER=your_server_name\\your_instance_name
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=1433

Notes:

Replace your_server_name\\your_instance_name with your SQL Server instance (ex: DESKTOP-ABC123\\SQLEXPRESS)
Make sure to use double backslashes (\) in the server name
If you're using a local default instance, you can use localhost
Verify your SQL Server port (default is 1433)

4. Database Setup

Make sure your SQL Server is running
Create a new database with the name specified in your .env file
Execute any required initialization scripts (details in the database section below)

5. Start the Backend Server
```
node server.js
```