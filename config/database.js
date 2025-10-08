const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

async function connectDB() {
    try {
        // Try to connect to MongoDB first
        if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'mongodb://localhost:27017/employee_management') {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('Connected to MongoDB');
            return;
        }

        // Try local MongoDB
        try {
            await mongoose.connect('mongodb://localhost:27017/employee_management', {
                serverSelectionTimeoutMS: 3000 // 3 second timeout
            });
            console.log('Connected to local MongoDB');
            return;
        } catch (localError) {
            console.log('Local MongoDB not available, using in-memory database...');
            
            // Use in-memory MongoDB for testing/demo
            mongoServer = await MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();
            await mongoose.connect(mongoUri);
            console.log('Connected to in-memory MongoDB for testing');
            
            // Seed some sample data for demonstration
            await seedSampleData();
        }
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
}

async function seedSampleData() {
    const Employee = require('../models/Employee');
    
    // Check if we already have data
    const count = await Employee.countDocuments();
    if (count > 0) {
        console.log('Sample data already exists');
        return;
    }

    // Create sample employees
    const sampleEmployees = [
        {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@company.com',
            phone: '5551234567',
            position: 'Software Engineer',
            department: 'Engineering',
            salary: 75000,
            hireDate: new Date('2023-01-15')
        },
        {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@company.com',
            phone: '5551234568',
            position: 'Product Manager',
            department: 'Product',
            salary: 85000,
            hireDate: new Date('2023-02-01')
        },
        {
            firstName: 'Mike',
            lastName: 'Johnson',
            email: 'mike.johnson@company.com',
            phone: '5551234569',
            position: 'UI/UX Designer',
            department: 'Design',
            salary: 65000,
            hireDate: new Date('2023-03-10')
        },
        {
            firstName: 'Sarah',
            lastName: 'Williams',
            email: 'sarah.williams@company.com',
            phone: '5551234570',
            position: 'DevOps Engineer',
            department: 'Engineering',
            salary: 80000,
            hireDate: new Date('2023-01-20')
        },
        {
            firstName: 'David',
            lastName: 'Brown',
            email: 'david.brown@company.com',
            phone: '5551234571',
            position: 'Marketing Manager',
            department: 'Marketing',
            salary: 70000,
            hireDate: new Date('2023-04-05')
        }
    ];

    try {
        await Employee.insertMany(sampleEmployees);
        console.log('Sample employee data created successfully');
    } catch (error) {
        console.error('Error creating sample data:', error);
    }
}

async function closeDB() {
    try {
        await mongoose.connection.close();
        if (mongoServer) {
            await mongoServer.stop();
        }
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error closing database:', error);
    }
}

module.exports = { connectDB, closeDB };