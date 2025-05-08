// src/App.js

import React from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import EmployeeListWithPagination from './components/EmployeeListWithPagination';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/employees" element={<EmployeeListWithPagination />} />
                <Route path="*" element={<LoginPage />} />
            </Routes>
        </Router>
    );
}

export default App;

