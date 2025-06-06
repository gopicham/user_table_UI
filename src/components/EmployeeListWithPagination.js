import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import PdfDownloadButton from './PdfDownloadButton';

const apiUrl = process.env.REACT_APP_API_BASE_URL;

const PaginationControls = React.memo(({ currentPage, totalPages, handlePageClick, loading, generatePageNumbers }) => {
    return (
        <nav aria-label="Pagination" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button
                aria-label="Previous Page"
                onClick={() => handlePageClick(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                style={{
                    marginRight: '5px',
                    minWidth: '80px',
                    padding: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    backgroundColor: '#ffeb3b',
                    border: '1px solid #ffc107',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                }}
            >
                Previous
            </button>

            {generatePageNumbers().map((pageNumber, index) => (
                pageNumber === '...' ? (
                    <span key={index} style={{ margin: '0 5px', lineHeight: '40px' }}>...</span>
                ) : (
                    <button
                        key={pageNumber}
                        aria-label={`Page ${pageNumber}`}
                        onClick={() => handlePageClick(pageNumber)}
                        style={{
                            margin: '0 5px',
                            backgroundColor: currentPage === pageNumber ? '#ffc107' : '#ffeb3b',
                            color: currentPage === pageNumber ? '#333' : '#333',
                            minWidth: '40px',
                            padding: '10px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            border: `1px solid ${currentPage === pageNumber ? '#ff9800' : '#ffc107'}`,
                            borderRadius: '4px',
                            fontWeight: currentPage === pageNumber ? 'bold' : 'normal'
                        }}
                    >
                        {pageNumber}
                    </button>
                )
            ))}

            <button
                aria-label="Next Page"
                onClick={() => handlePageClick(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                style={{
                    marginLeft: '5px',
                    minWidth: '80px',
                    padding: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    backgroundColor: '#ffeb3b',
                    border: '1px solid #ffc107',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                }}
            >
                Next
            </button>
        </nav>
    );
});

PaginationControls.propTypes = {
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    handlePageClick: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    generatePageNumbers: PropTypes.func.isRequired,
};

const EmployeeListWithPagination = () => {
    const [employees, setEmployees] = useState([]);
    const [originalEmployees, setOriginalEmployees] = useState([]);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [employeesPerPage] = useState(10);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [bulkEdit, setBulkEdit] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        firstName: '',
        lastName: '',
        emailId: '',
        salary: '',
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            setError('User not authenticated. Please log in first.');
            setLoading(false);
            return;
        }

        fetchEmployees(token);
    }, [currentPage, employeesPerPage]);

    const fetchEmployees = (token) => {
        setLoading(true);
        setError(null);

        axios.get(`${apiUrl}/api/v1/employees?page=${currentPage}&limit=${employeesPerPage}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(response => {
            setEmployees(response.data.data);
            setOriginalEmployees(response.data.data);
            setTotalEmployees(response.data.totalCount);
            setLoading(false);
        })
        .catch(error => {
            console.error('Error fetching employee data:', error.response?.data || error.message);
            if (error.response?.status === 401) {
                setError('Session expired or unauthorized. Please log in again.');
            } else {
                setError('Failed to fetch employee data. Please try again later.');
            }
            setLoading(false);
        });
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('User not authenticated. Please log in first.');
            return;
        }

        try {
            setLoading(true);
            await axios.delete(
                `${apiUrl}/api/v1/employees/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            await fetchEmployees(token);
        } catch (error) {
            console.error('Error deleting employee:', error);
            setError('Failed to delete employee. Please try again.');
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('User not authenticated. Please log in first.');
            return;
        }

        try {
            setLoading(true);
            await axios.delete(
                '${apiUrl}/api/v1/employees/bulk',
                { 
                    data: { ids: selectedRows },
                    headers: { Authorization: `Bearer ${token}` } 
                }
            );
            
            await fetchEmployees(token);
            setSelectedRows([]);
        } catch (error) {
            console.error('Error deleting employees:', error);
            setError('Failed to delete employees. Please try again.');
            setLoading(false);
        }
    };

    const handleDeleteClick = (id) => {
        setEmployeeToDelete(id);
        setShowDeleteConfirm(true);
    };

    const handleBulkDeleteClick = () => {
        if (selectedRows.length > 0) {
            setShowDeleteConfirm(true);
        }
    };

    const handleConfirmDelete = async () => {
        if (employeeToDelete) {
            await handleDelete(employeeToDelete);
        } else if (selectedRows.length > 0) {
            await handleBulkDelete();
        }
        setShowDeleteConfirm(false);
        setEmployeeToDelete(null);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
        setEmployeeToDelete(null);
    };

    const handleAddEmployee = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('User not authenticated. Please log in first.');
            return;
        }

        try {
            setLoading(true);
            await axios.post(
                '${apiUrl}/api/v1/employees',
                {
                    ...newEmployee,
                    salary: parseFloat(newEmployee.salary),
                    createdDate: new Date().toISOString(),
                    updatedDate: new Date().toISOString()
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            await fetchEmployees(token);
            setShowAddForm(false);
            setNewEmployee({
                firstName: '',
                lastName: '',
                emailId: '',
                salary: '',
                createdDate: new Date().toISOString(),
                updatedDate: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error adding employee:', error);
            setError('Failed to add employee. Please try again.');
            setLoading(false);
        }
    };

    const handleNewEmployeeChange = (e) => {
        setNewEmployee({
            ...newEmployee,
            [e.target.name]: e.target.value
        });
    };

    const handleAddFormToggle = () => {
        setShowAddForm(!showAddForm);
        if (showAddForm) {
            setNewEmployee({
                firstName: '',
                lastName: '',
                emailId: '',
                salary: '',
                createdDate: new Date().toISOString(),
                updatedDate: new Date().toISOString()
            });
        }
    };

    const totalPages = Math.ceil(totalEmployees / employeesPerPage);

    const handlePageClick = useCallback(
        debounce((pageNumber) => {
            if (pageNumber >= 1 && pageNumber <= totalPages) {
                setCurrentPage(pageNumber);
                setEditingId(null);
                setBulkEdit(false);
                setSelectedRows([]);
            }
        }, 300),
        [totalPages]
    );

    const generatePageNumbers = useCallback(() => {
        const pageNumbers = [];
        const range = 2;
        const start = Math.max(1, currentPage - range);
        const end = Math.min(totalPages, currentPage + range);

        if (start > 1) {
            pageNumbers.push(1);
            if (start > 2) {
                pageNumbers.push('...');
            }
        }

        for (let i = start; i <= end; i++) {
            pageNumbers.push(i);
        }

        if (end < totalPages) {
            if (end < totalPages - 1) {
                pageNumbers.push('...');
            }
            pageNumbers.push(totalPages);
        }

        return pageNumbers;
    }, [currentPage, totalPages]);

    const handleEdit = (id) => {
        setEditingId(id);
        const employeeToEdit = employees.find(emp => emp.id === id);
        setEditData({ ...employeeToEdit });
    };

    const handleBulkEditToggle = () => {
        setBulkEdit(!bulkEdit);
        if (!bulkEdit) {
            setSelectedRows([]);
        }
    };

    const handleRowSelect = (id) => {
        setSelectedRows(prev => 
            prev.includes(id) 
                ? prev.filter(rowId => rowId !== id) 
                : [...prev, id]
        );
    };

    const handleInputChange = (e, field) => {
        if (editingId) {
            setEditData(prev => ({
                ...prev,
                [field]: e.target.value
            }));
        } else if (bulkEdit) {
            setEmployees(prev => 
                prev.map(emp => 
                    selectedRows.includes(emp.id) 
                        ? { ...emp, [field]: e.target.value } 
                        : emp
                )
            );
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEmployees([...originalEmployees]);
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('User not authenticated. Please log in first.');
            return;
        }

        try {
            setLoading(true);
            
            if (editingId) {
                await axios.put(
                    `${apiUrl}/api/v1/employees/${editingId}`,
                    {
                        ...editData,
                        salary: parseFloat(editData.salary),
                        updatedDate: new Date().toISOString()
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else if (bulkEdit && selectedRows.length > 0) {
                const updates = employees
                    .filter(emp => selectedRows.includes(emp.id))
                    .map(emp => ({
                        id: emp.id,
                        firstName: emp.firstName,
                        lastName: emp.lastName,
                        emailId: emp.emailId,
                        salary: parseFloat(emp.salary),
                        updatedDate: new Date().toISOString()
                    }));
                
                await axios.put(
                    '${apiUrl}/api/v1/employees/bulk',
                    { employees: updates },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            await fetchEmployees(token);
            setEditingId(null);
            setBulkEdit(false);
            setSelectedRows([]);
        } catch (error) {
            console.error('Error updating employee data:', error);
            setError('Failed to update employee data. Please try again.');
            setLoading(false);
        }
    };

    if (error === 'User not authenticated. Please log in first.' || error?.includes('unauthorized')) {
        return (
            <div style={{ 
                textAlign: 'center', 
                marginTop: '50px', 
                padding: '20px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeeba',
                borderRadius: '4px',
                maxWidth: '500px',
                marginLeft: 'auto',
                marginRight: 'auto'
            }}>
                <h2 style={{ color: '#856404' }}>{error}</h2>
                <button 
                    onClick={() => window.location.href = '/login'}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#ffc107',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        marginTop: '15px'
                    }}
                >
                    Go to Login
                </button>
            </div>
        );
    }

    if (loading && !editingId && !bulkEdit && !showAddForm) {
        return (
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                <h1 style={{ 
                    textAlign: 'center', 
                    padding: '15px',
                    backgroundColor: '#ffeb3b',
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    Employee Table
                </h1>
                {[...Array(employeesPerPage)].map((_, index) => (
                    <div 
                        key={index} 
                        style={{ 
                            width: '100%', 
                            height: '40px', 
                            margin: '10px 0', 
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            animation: 'pulse 1.5s infinite ease-in-out'
                        }}
                    ></div>
                ))}
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.03); }
                    100% { transform: scale(1); }
                }
            `}</style>
            
            <h1 style={{ 
                textAlign: 'center', 
                padding: '15px',
                backgroundColor: '#ffeb3b',
                borderRadius: '4px',
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                animation: 'pulse 2s infinite ease-in-out',
                transformOrigin: 'center'
            }}>
                Customer Order Details
            </h1>

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleAddFormToggle}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: showAddForm ? '#ff5722' : '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {showAddForm ? 'Cancel Add' : 'Add Employee'}
                    </button>
                    <button
                        onClick={handleBulkEditToggle}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: bulkEdit ? '#ff5722' : '#ffeb3b',
                            color: '#333',
                            border: '1px solid #ffc107',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {bulkEdit ? 'Cancel Bulk Edit' : 'Bulk Edit'}
                    </button>
                    <PdfDownloadButton />
                    {selectedRows.length > 0 && (
                        <button
                            onClick={handleBulkDeleteClick}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Delete Selected
                        </button>
                    )}
                </div>

                {(editingId || (bulkEdit && selectedRows.length > 0)) && (
                    <div>
                        <button
                            onClick={handleCancelEdit}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                marginRight: '10px'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#4caf50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            {showAddForm && (
                <div style={{ 
                    padding: '20px', 
                    marginBottom: '20px', 
                    backgroundColor: '#e8f5e9',
                    borderRadius: '4px',
                    border: '1px solid #c8e6c9'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Add New Employee</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={newEmployee.firstName}
                                onChange={handleNewEmployeeChange}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={newEmployee.lastName}
                                onChange={handleNewEmployeeChange}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                            <input
                                type="email"
                                name="emailId"
                                value={newEmployee.emailId}
                                onChange={handleNewEmployeeChange}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Salary</label>
                            <input
                                type="number"
                                name="salary"
                                value={newEmployee.salary}
                                onChange={handleNewEmployeeChange}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>
                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                            onClick={handleAddFormToggle}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddEmployee}
                            disabled={loading || !newEmployee.firstName || !newEmployee.lastName || !newEmployee.emailId || !newEmployee.salary}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#4caf50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                opacity: (loading || !newEmployee.firstName || !newEmployee.lastName || !newEmployee.emailId || !newEmployee.salary) ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Adding...' : 'Add Employee'}
                        </button>
                    </div>
                </div>
            )}

            <div style={{ 
                minHeight: '300px', 
                maxHeight: '500px', 
                overflowY: 'auto',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ 
                        backgroundColor: 'white',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        borderBottom: '2px solid #ff9800'  // Added border for better separation
                    }}>
                        <tr>
                            {bulkEdit && <th style={{ padding: '12px', width: '40px' }}></th>}
                            <th style={{ padding: '8px',  textAlign: 'left', borderBottom: '2px solidhsl(35, 17.60%, 67.60%)' }}>Employee ID</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ff9800' }}>First Name</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solidrgb(255, 152, 0)' }}>Last Name</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ff9800' }}>Email</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ff9800' }}>Salary</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ff9800' }}>Created Date</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ff9800' }}>Updated Date</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solidrgb(60, 0, 255)', width: '150px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees && employees.length > 0 ? (
                            employees.map((employee, index) => (
                                <tr key={index} style={{ 
                                    backgroundColor: index % 2 === 0 ? '#fff' : '#fffde7',
                                    borderBottom: '1px solid #eee'
                                }}>
                                    {bulkEdit && (
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(employee.id)}
                                                onChange={() => handleRowSelect(employee.id)}
                                            />
                                        </td>
                                    )}
                                    <td style={{ padding: '12px', wordBreak: 'break-word' }}>{employee.id}</td>
                                    <td style={{ padding: '12px', wordBreak: 'break-word' }}>
                                        {editingId === employee.id ? (
                                            <input
                                                type="text"
                                                value={editData.firstName}
                                                onChange={(e) => handleInputChange(e, 'firstName')}
                                                style={{ width: '100%', padding: '5px' }}
                                            />
                                        ) : bulkEdit && selectedRows.includes(employee.id) ? (
                                            <input
                                                type="text"
                                                value={employee.firstName}
                                                onChange={(e) => handleInputChange(e, 'firstName')}
                                                style={{ width: '100%', padding: '5px' }}
                                            />
                                        ) : (
                                            employee.firstName
                                        )}
                                    </td>
                                    <td style={{ padding: '12px', wordBreak: 'break-word' }}>
                                        {editingId === employee.id ? (
                                            <input
                                                type="text"
                                                value={editData.lastName}
                                                onChange={(e) => handleInputChange(e, 'lastName')}
                                                style={{ width: '100%', padding: '5px' }}
                                            />
                                        ) : bulkEdit && selectedRows.includes(employee.id) ? (
                                            <input
                                                type="text"
                                                value={employee.lastName}
                                                onChange={(e) => handleInputChange(e, 'lastName')}
                                                style={{ width: '100%', padding: '5px' }}
                                            />
                                        ) : (
                                            employee.lastName
                                        )}
                                    </td>
                                    <td style={{ padding: '12px', wordBreak: 'break-word' }}>
                                        {editingId === employee.id ? (
                                            <input
                                                type="email"
                                                value={editData.emailId}
                                                onChange={(e) => handleInputChange(e, 'emailId')}
                                                style={{ width: '100%', padding: '5px' }}
                                            />
                                        ) : bulkEdit && selectedRows.includes(employee.id) ? (
                                            <input
                                                type="email"
                                                value={employee.emailId}
                                                onChange={(e) => handleInputChange(e, 'emailId')}
                                                style={{ width: '100%', padding: '5px' }}
                                            />
                                        ) : (
                                            employee.emailId
                                        )}
                                    </td>
                                    <td style={{ padding: '12px', wordBreak: 'break-word' }}>
                                        {editingId === employee.id ? (
                                            <input
                                                type="number"
                                                value={editData.salary}
                                                onChange={(e) => handleInputChange(e, 'salary')}
                                                style={{ width: '100%', padding: '5px' }}
                                            />
                                        ) : bulkEdit && selectedRows.includes(employee.id) ? (
                                            <input
                                                type="number"
                                                value={employee.salary}
                                                onChange={(e) => handleInputChange(e, 'salary')}
                                                style={{ width: '100%', padding: '5px' }}
                                            />
                                        ) : (
                                            `$${employee.salary?.toLocaleString() || '0'}`
                                        )}
                                    </td>
                                    <td style={{ padding: '12px', wordBreak: 'break-word' }}>
                                        {new Date(employee.createdDate).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px', wordBreak: 'break-word' }}>
                                        {new Date(employee.updatedDate).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px', wordBreak: 'break-word' }}>
                                        {editingId === employee.id ? (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button 
                                                    onClick={handleSave}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: '#4caf50',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Save
                                                </button>
                                                <button 
                                                    onClick={handleCancelEdit}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: '#f44336',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button 
                                                    onClick={() => handleEdit(employee.id)}
                                                    disabled={bulkEdit}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: '#2196f3',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer',
                                                        opacity: bulkEdit ? 0.5 : 1
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(employee.id)}
                                                    disabled={bulkEdit || loading}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: '#f44336',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer',
                                                        opacity: (bulkEdit || loading) ? 0.5 : 1
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={bulkEdit ? "9" : "8"} style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff' }}>
                                    No employees found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                handlePageClick={handlePageClick}
                loading={loading}
                generatePageNumbers={generatePageNumbers}
            />

            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '5px',
                        maxWidth: '400px',
                        textAlign: 'center'
                    }}>
                        <h3>Confirm Delete</h3>
                        <p>
                            {employeeToDelete 
                                ? 'Are you sure you want to delete this employee?'
                                : `Are you sure you want to delete ${selectedRows.length} selected employees?`}
                        </p>
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button
                                onClick={handleCancelDelete}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={loading}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeListWithPagination;