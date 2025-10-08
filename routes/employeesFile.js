const express = require('express');
const router = express.Router();
const FileDatabase = require('../config/fileDatabase');

const db = new FileDatabase();

// Initialize sample data
db.initializeSampleData();

// Helper function to validate employee data
function validateEmployee(data, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate || data.firstName !== undefined) {
        if (!data.firstName || data.firstName.trim().length === 0) {
            errors.push('First name is required');
        }
    }
    
    if (!isUpdate || data.lastName !== undefined) {
        if (!data.lastName || data.lastName.trim().length === 0) {
            errors.push('Last name is required');
        }
    }
    
    if (!isUpdate || data.email !== undefined) {
        if (!data.email || data.email.trim().length === 0) {
            errors.push('Email is required');
        } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.email)) {
            errors.push('Please enter a valid email');
        }
    }
    
    if (!isUpdate || data.phone !== undefined) {
        if (!data.phone || !/^\d{10}$/.test(data.phone.replace(/\D/g, ''))) {
            errors.push('Please enter a valid 10-digit phone number');
        }
    }
    
    if (!isUpdate || data.position !== undefined) {
        if (!data.position || data.position.trim().length === 0) {
            errors.push('Position is required');
        }
    }
    
    if (!isUpdate || data.department !== undefined) {
        if (!data.department || data.department.trim().length === 0) {
            errors.push('Department is required');
        }
    }
    
    if (!isUpdate || data.salary !== undefined) {
        if (data.salary === undefined || data.salary === null || data.salary < 0) {
            errors.push('Salary must be a non-negative number');
        }
    }
    
    return errors;
}

// Get all employees with optional search and pagination
router.get('/', async (req, res) => {
    try {
        const { search, page = 1, limit = 10, sortBy = 'lastName', sortOrder = 'asc' } = req.query;
        const skip = (page - 1) * limit;

        // Build search query
        let query = {};
        if (search) {
            query = {
                $or: [
                    { firstName: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const result = await db.find(query, {
            sort,
            skip: parseInt(skip),
            limit: parseInt(limit)
        });

        const totalPages = Math.ceil(result.total / limit);

        res.json({
            employees: result.data,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalEmployees: result.total,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
    try {
        const employee = await db.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new employee
router.post('/', async (req, res) => {
    try {
        const errors = validateEmployee(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        const employee = await db.create(req.body);
        res.status(201).json(employee);
    } catch (error) {
        if (error.message === 'Email already exists') {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Update employee
router.put('/:id', async (req, res) => {
    try {
        const errors = validateEmployee(req.body, true);
        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        const employee = await db.update(req.params.id, req.body);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        if (error.message === 'Email already exists') {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Delete employee
router.delete('/:id', async (req, res) => {
    try {
        const employee = await db.delete(req.params.id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get employee statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const totalEmployees = await db.countDocuments({ isActive: { $ne: false } });
        
        const departmentStats = await db.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        const avgSalaryResult = await db.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, avgSalary: { $avg: '$salary' } } }
        ]);

        res.json({
            totalEmployees,
            departmentStats,
            averageSalary: avgSalaryResult[0]?.avgSalary || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;