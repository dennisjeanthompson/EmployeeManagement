class EmployeeManager {
    constructor() {
        this.currentPage = 1;
        this.limit = 10;
        this.searchTerm = '';
        this.sortBy = 'lastName';
        this.sortOrder = 'asc';
        this.editingEmployeeId = null;
        
        this.initializeEventListeners();
        this.loadEmployees();
        this.loadStats();
    }

    initializeEventListeners() {
        // Modal controls
        document.getElementById('add-employee-btn').addEventListener('click', () => this.openModal());
        document.getElementById('cancel-btn').addEventListener('click', () => this.closeModal());
        document.querySelectorAll('.close').forEach(close => {
            close.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Form submission
        document.getElementById('employee-form').addEventListener('submit', (e) => this.handleSubmit(e));

        // Search and filters
        document.getElementById('search-input').addEventListener('input', (e) => this.handleSearch(e));
        document.getElementById('sort-by').addEventListener('change', (e) => this.handleSort(e));
        document.getElementById('sort-order').addEventListener('change', (e) => this.handleSort(e));

        // Pagination
        document.getElementById('prev-page').addEventListener('click', () => this.previousPage());
        document.getElementById('next-page').addEventListener('click', () => this.nextPage());

        // Confirmation modal
        document.getElementById('confirm-cancel').addEventListener('click', () => this.closeConfirmModal());
        document.getElementById('confirm-ok').addEventListener('click', () => this.confirmDelete());

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // Set default hire date to today
        document.getElementById('hireDate').value = new Date().toISOString().split('T')[0];
    }

    async loadEmployees() {
        this.showLoading(true);
        
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.limit,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder
            });

            if (this.searchTerm) {
                params.append('search', this.searchTerm);
            }

            const response = await fetch(`/api/employees?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.renderEmployees(data.employees);
            this.updatePagination(data.pagination);
            
        } catch (error) {
            console.error('Error loading employees:', error);
            this.showError('Failed to load employees. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/employees/stats/summary');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            document.getElementById('total-employees').textContent = data.totalEmployees;
            document.getElementById('total-departments').textContent = data.departmentStats.length;
            document.getElementById('avg-salary').textContent = 
                `$${Math.round(data.averageSalary).toLocaleString()}`;
                
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    renderEmployees(employees) {
        const tbody = document.getElementById('employee-tbody');
        
        if (employees.length === 0) {
            document.getElementById('no-results').classList.remove('hidden');
            tbody.innerHTML = '';
            return;
        }

        document.getElementById('no-results').classList.add('hidden');
        
        tbody.innerHTML = employees.map(employee => `
            <tr class="fade-in">
                <td class="employee-name">${this.escapeHtml(employee.fullName)}</td>
                <td class="employee-email">${this.escapeHtml(employee.email)}</td>
                <td>${this.escapeHtml(employee.phone)}</td>
                <td>${this.escapeHtml(employee.position)}</td>
                <td>${this.escapeHtml(employee.department)}</td>
                <td class="employee-salary">$${employee.salary.toLocaleString()}</td>
                <td>${new Date(employee.hireDate).toLocaleDateString()}</td>
                <td class="employee-actions">
                    <button class="btn btn-small btn-secondary" onclick="employeeManager.editEmployee('${employee._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-small btn-danger" onclick="employeeManager.deleteEmployee('${employee._id}', '${this.escapeHtml(employee.fullName)}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updatePagination(pagination) {
        document.getElementById('page-info').textContent = 
            `Page ${pagination.currentPage} of ${pagination.totalPages}`;
        
        document.getElementById('prev-page').disabled = !pagination.hasPrev;
        document.getElementById('next-page').disabled = !pagination.hasNext;
    }

    openModal(employee = null) {
        const modal = document.getElementById('employee-modal');
        const form = document.getElementById('employee-form');
        const title = document.getElementById('modal-title');
        const submitText = document.getElementById('submit-text');

        if (employee) {
            title.textContent = 'Edit Employee';
            submitText.textContent = 'Update Employee';
            this.populateForm(employee);
            this.editingEmployeeId = employee._id;
        } else {
            title.textContent = 'Add Employee';
            submitText.textContent = 'Add Employee';
            form.reset();
            document.getElementById('hireDate').value = new Date().toISOString().split('T')[0];
            this.editingEmployeeId = null;
        }

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal = null) {
        if (!modal) {
            modal = document.getElementById('employee-modal');
        }
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.editingEmployeeId = null;
    }

    closeConfirmModal() {
        document.getElementById('confirm-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    populateForm(employee) {
        const form = document.getElementById('employee-form');
        
        form.firstName.value = employee.firstName;
        form.lastName.value = employee.lastName;
        form.email.value = employee.email;
        form.phone.value = employee.phone;
        form.position.value = employee.position;
        form.department.value = employee.department;
        form.salary.value = employee.salary;
        form.hireDate.value = new Date(employee.hireDate).toISOString().split('T')[0];
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const employee = Object.fromEntries(formData.entries());
        
        // Convert salary to number
        employee.salary = parseFloat(employee.salary);
        
        try {
            const url = this.editingEmployeeId 
                ? `/api/employees/${this.editingEmployeeId}`
                : '/api/employees';
            
            const method = this.editingEmployeeId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(employee)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save employee');
            }
            
            this.closeModal();
            this.loadEmployees();
            this.loadStats();
            this.showSuccess(this.editingEmployeeId ? 'Employee updated successfully!' : 'Employee added successfully!');
            
        } catch (error) {
            console.error('Error saving employee:', error);
            this.showError(error.message);
        }
    }

    async editEmployee(id) {
        try {
            const response = await fetch(`/api/employees/${id}`);
            
            if (!response.ok) {
                throw new Error('Failed to load employee data');
            }
            
            const employee = await response.json();
            this.openModal(employee);
            
        } catch (error) {
            console.error('Error loading employee:', error);
            this.showError('Failed to load employee data');
        }
    }

    deleteEmployee(id, name) {
        this.deleteEmployeeId = id;
        document.getElementById('confirm-message').textContent = 
            `Are you sure you want to delete "${name}"?`;
        document.getElementById('confirm-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    async confirmDelete() {
        try {
            const response = await fetch(`/api/employees/${this.deleteEmployeeId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete employee');
            }
            
            this.closeConfirmModal();
            this.loadEmployees();
            this.loadStats();
            this.showSuccess('Employee deleted successfully!');
            
        } catch (error) {
            console.error('Error deleting employee:', error);
            this.showError('Failed to delete employee');
        }
    }

    handleSearch(e) {
        this.searchTerm = e.target.value.trim();
        this.currentPage = 1;
        this.debounceSearch();
    }

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.loadEmployees();
        }, 300);
    }

    handleSort(e) {
        const target = e.target;
        
        if (target.id === 'sort-by') {
            this.sortBy = target.value;
        } else if (target.id === 'sort-order') {
            this.sortOrder = target.value;
        }
        
        this.currentPage = 1;
        this.loadEmployees();
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadEmployees();
        }
    }

    nextPage() {
        this.currentPage++;
        this.loadEmployees();
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const tableSection = document.querySelector('.table-section');
        
        if (show) {
            loading.classList.remove('hidden');
            tableSection.style.opacity = '0.5';
        } else {
            loading.classList.add('hidden');
            tableSection.style.opacity = '1';
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove existing messages
        document.querySelectorAll('.error, .success').forEach(el => el.remove());
        
        const messageEl = document.createElement('div');
        messageEl.className = type;
        messageEl.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(messageEl, container.firstChild.nextSibling);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
const employeeManager = new EmployeeManager();