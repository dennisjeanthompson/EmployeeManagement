# Employee Management System

A full-stack Node.js Employee Management System with a modern web interface. This application allows you to manage employee records with full CRUD (Create, Read, Update, Delete) operations, search functionality, and responsive design.

## Features

### Backend Features
- ✅ RESTful API with Express.js
- ✅ MongoDB database with Mongoose ODM
- ✅ Employee data validation
- ✅ Search and pagination
- ✅ Employee statistics and analytics
- ✅ Error handling and data validation
- ✅ CORS enabled for cross-origin requests

### Frontend Features  
- ✅ Responsive web interface
- ✅ Employee listing with pagination
- ✅ Add/Edit employee forms
- ✅ Search and filter functionality
- ✅ Statistics dashboard
- ✅ Modern UI with Font Awesome icons
- ✅ Modal dialogs for forms
- ✅ Real-time form validation

### Employee Data Model
- First Name & Last Name
- Email (unique)
- Phone Number  
- Position/Job Title
- Department
- Salary
- Hire Date
- Active Status

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with responsive design
- **Icons**: Font Awesome
- **Additional**: CORS, dotenv for environment variables

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd EmployeeManagement
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env` (if needed)
   - Update MongoDB connection string:
   ```
   MONGODB_URI=mongodb://localhost:27017/employee_management
   PORT=3000
   NODE_ENV=development
   ```

4. **Start MongoDB**
   - For local MongoDB: `mongod`
   - Or use MongoDB Atlas cloud service

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Or production mode
   npm start
   ```

6. **Access the application**
   - Open your browser and visit: `http://localhost:3000`

## API Endpoints

### Employee Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | Get all employees (with pagination and search) |
| GET | `/api/employees/:id` | Get specific employee by ID |
| POST | `/api/employees` | Create new employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |
| GET | `/api/employees/stats/summary` | Get employee statistics |

### Query Parameters for GET `/api/employees`

- `search` - Search term (searches name, email, position, department)
- `page` - Page number for pagination (default: 1)
- `limit` - Number of results per page (default: 10)
- `sortBy` - Field to sort by (default: lastName)
- `sortOrder` - Sort direction: asc or desc (default: asc)

### Example API Requests

```bash
# Get all employees
curl http://localhost:3000/api/employees

# Search employees
curl http://localhost:3000/api/employees?search=john

# Get paginated results
curl http://localhost:3000/api/employees?page=2&limit=5

# Create new employee
curl -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john.doe@example.com",
    "phone": "1234567890",
    "position": "Software Engineer",
    "department": "Engineering",
    "salary": 75000,
    "hireDate": "2023-01-15"
  }'
```

## Project Structure

```
EmployeeManagement/
├── models/
│   └── Employee.js          # Mongoose employee model
├── routes/
│   └── employees.js         # Employee API routes
├── public/
│   ├── css/
│   │   └── style.css        # Application styles
│   ├── js/
│   │   └── app.js          # Frontend JavaScript
│   └── index.html          # Main HTML page
├── server.js               # Main server file
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Usage Guide

### Adding Employees
1. Click the "Add Employee" button
2. Fill in all required fields in the modal form
3. Click "Add Employee" to save

### Editing Employees
1. Click the "Edit" button next to any employee
2. Modify the fields in the modal form
3. Click "Update Employee" to save changes

### Searching and Filtering
1. Use the search box to find employees by name, email, position, or department
2. Use the sort dropdowns to order results
3. Navigate through pages using pagination controls

### Viewing Statistics
- The dashboard shows total employees, departments, and average salary
- Statistics update automatically when employees are added, edited, or deleted

## Development

### Scripts
- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with auto-restart

### Adding New Features
1. Backend changes: Add routes in `routes/employees.js`
2. Database changes: Modify the schema in `models/Employee.js`
3. Frontend changes: Update `public/index.html`, `public/css/style.css`, or `public/js/app.js`

## Database Schema

The Employee model includes the following fields with validation:

```javascript
{
  firstName: String (required, trimmed)
  lastName: String (required, trimmed)
  email: String (required, unique, lowercase, validated)
  phone: String (required, 10 digits)
  position: String (required, trimmed)
  department: String (required, trimmed)
  salary: Number (required, minimum 0)
  hireDate: Date (required, defaults to now)
  isActive: Boolean (defaults to true)
  createdAt: Date (automatic)
  updatedAt: Date (automatic)
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For questions or issues, please create an issue in the repository or contact the development team.