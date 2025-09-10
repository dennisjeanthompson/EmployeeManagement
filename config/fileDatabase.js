const fs = require('fs').promises;
const path = require('path');

class FileDatabase {
    constructor() {
        this.dataFile = path.join(__dirname, '..', 'data', 'employees.json');
        this.counterFile = path.join(__dirname, '..', 'data', 'counter.json');
        this.ensureDataDirectory();
    }

    async ensureDataDirectory() {
        try {
            await fs.mkdir(path.dirname(this.dataFile), { recursive: true });
        } catch (error) {
            // Directory already exists
        }
    }

    async loadData() {
        try {
            const data = await fs.readFile(this.dataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // File doesn't exist or is empty
            return [];
        }
    }

    async saveData(employees) {
        await this.ensureDataDirectory();
        await fs.writeFile(this.dataFile, JSON.stringify(employees, null, 2));
    }

    async getNextId() {
        try {
            const counterData = await fs.readFile(this.counterFile, 'utf8');
            const counter = JSON.parse(counterData);
            counter.value += 1;
            await fs.writeFile(this.counterFile, JSON.stringify(counter));
            return counter.value.toString();
        } catch (error) {
            // Counter file doesn't exist, create it
            const counter = { value: 1 };
            await fs.writeFile(this.counterFile, JSON.stringify(counter));
            return "1";
        }
    }

    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    async find(query = {}, options = {}) {
        const employees = await this.loadData();
        let filtered = employees;

        // Apply search filter
        if (query.$or) {
            const searchTerm = query.$or[0].firstName.$regex.toLowerCase();
            filtered = employees.filter(emp => 
                emp.firstName.toLowerCase().includes(searchTerm) ||
                emp.lastName.toLowerCase().includes(searchTerm) ||
                emp.email.toLowerCase().includes(searchTerm) ||
                emp.position.toLowerCase().includes(searchTerm) ||
                emp.department.toLowerCase().includes(searchTerm)
            );
        }

        // Apply sorting
        if (options.sort) {
            const sortField = Object.keys(options.sort)[0];
            const sortOrder = options.sort[sortField];
            filtered.sort((a, b) => {
                const aVal = a[sortField] || '';
                const bVal = b[sortField] || '';
                if (sortOrder === 1) {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
        }

        // Apply pagination
        const skip = options.skip || 0;
        const limit = options.limit || filtered.length;
        const result = filtered.slice(skip, skip + limit);

        return {
            data: result,
            total: filtered.length
        };
    }

    async findById(id) {
        const employees = await this.loadData();
        return employees.find(emp => emp._id === id);
    }

    async create(employeeData) {
        const employees = await this.loadData();
        
        // Check for duplicate email
        const existingEmployee = employees.find(emp => emp.email === employeeData.email);
        if (existingEmployee) {
            throw new Error('Email already exists');
        }

        const newEmployee = {
            _id: this.generateId(),
            ...employeeData,
            firstName: employeeData.firstName?.trim(),
            lastName: employeeData.lastName?.trim(),
            email: employeeData.email?.toLowerCase().trim(),
            position: employeeData.position?.trim(),
            department: employeeData.department?.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
        };

        // Add virtual fullName
        newEmployee.fullName = `${newEmployee.firstName} ${newEmployee.lastName}`;

        employees.push(newEmployee);
        await this.saveData(employees);
        return newEmployee;
    }

    async update(id, updateData) {
        const employees = await this.loadData();
        const index = employees.findIndex(emp => emp._id === id);
        
        if (index === -1) {
            return null;
        }

        // Check for duplicate email (excluding current employee)
        if (updateData.email) {
            const existingEmployee = employees.find(emp => emp.email === updateData.email && emp._id !== id);
            if (existingEmployee) {
                throw new Error('Email already exists');
            }
        }

        const updatedEmployee = {
            ...employees[index],
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        // Add virtual fullName
        updatedEmployee.fullName = `${updatedEmployee.firstName} ${updatedEmployee.lastName}`;

        employees[index] = updatedEmployee;
        await this.saveData(employees);
        return updatedEmployee;
    }

    async delete(id) {
        const employees = await this.loadData();
        const index = employees.findIndex(emp => emp._id === id);
        
        if (index === -1) {
            return null;
        }

        const deletedEmployee = employees[index];
        employees.splice(index, 1);
        await this.saveData(employees);
        return deletedEmployee;
    }

    async countDocuments(query = {}) {
        const result = await this.find(query);
        return result.total;
    }

    async aggregate(pipeline) {
        const employees = await this.loadData();
        
        // Simple aggregation for department stats
        if (pipeline.some(stage => stage.$group && stage.$group._id === '$department')) {
            const departmentStats = {};
            employees.forEach(emp => {
                if (emp.isActive !== false) {
                    departmentStats[emp.department] = (departmentStats[emp.department] || 0) + 1;
                }
            });
            
            return Object.keys(departmentStats).map(dept => ({
                _id: dept,
                count: departmentStats[dept]
            })).sort((a, b) => b.count - a.count);
        }

        // Simple aggregation for average salary
        if (pipeline.some(stage => stage.$group && stage.$group.avgSalary)) {
            const activeEmployees = employees.filter(emp => emp.isActive !== false);
            const totalSalary = activeEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
            const avgSalary = activeEmployees.length > 0 ? totalSalary / activeEmployees.length : 0;
            
            return [{ _id: null, avgSalary }];
        }

        return [];
    }

    async initializeSampleData() {
        const employees = await this.loadData();
        if (employees.length > 0) {
            return; // Already have data
        }

        const sampleEmployees = [
            {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@company.com',
                phone: '5551234567',
                position: 'Software Engineer',
                department: 'Engineering',
                salary: 75000,
                hireDate: '2023-01-15T00:00:00.000Z'
            },
            {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@company.com',
                phone: '5551234568',
                position: 'Product Manager',
                department: 'Product',
                salary: 85000,
                hireDate: '2023-02-01T00:00:00.000Z'
            },
            {
                firstName: 'Mike',
                lastName: 'Johnson',
                email: 'mike.johnson@company.com',
                phone: '5551234569',
                position: 'UI/UX Designer',
                department: 'Design',
                salary: 65000,
                hireDate: '2023-03-10T00:00:00.000Z'
            },
            {
                firstName: 'Sarah',
                lastName: 'Williams',
                email: 'sarah.williams@company.com',
                phone: '5551234570',
                position: 'DevOps Engineer',
                department: 'Engineering',
                salary: 80000,
                hireDate: '2023-01-20T00:00:00.000Z'
            },
            {
                firstName: 'David',
                lastName: 'Brown',
                email: 'david.brown@company.com',
                phone: '5551234571',
                position: 'Marketing Manager',
                department: 'Marketing',
                salary: 70000,
                hireDate: '2023-04-05T00:00:00.000Z'
            }
        ];

        for (const employee of sampleEmployees) {
            await this.create(employee);
        }

        console.log('Sample employee data created successfully');
    }
}

module.exports = FileDatabase;