import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:8080/api/v1/login', {
                usernameOrEmail,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const token = response.data.tokens?.accessToken;
            if (token) {
                localStorage.setItem('token', token);
                navigate('/employees');
            } else {
                setError('Invalid response from server. Token not received.');
            }
        } catch (err) {
            console.error('Login failed:', err);
            setError(err.response?.data?.message || 'Invalid username or password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ 
            maxWidth: '400px', 
            margin: '100px auto', 
            padding: '20px', 
            border: '1px solid #ccc', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            backgroundColor: '#ffeb3b' // Yellow background
        }}>
            <h2 style={{ 
                textAlign: 'center', 
                marginBottom: '20px',
                color: '#333', // Dark text for better contrast on yellow
                textShadow: 'none' // Removed text shadow
            }}>
                Login
            </h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>Username</label>
                    <input
                        type="text"
                        value={usernameOrEmail}
                        onChange={(e) => setUsernameOrEmail(e.target.value)}
                        required
                        style={{ 
                            width: '100%', 
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            backgroundColor: '#fff' // White background for inputs
                        }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ 
                            width: '100%', 
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            backgroundColor: '#fff' // White background for inputs
                        }}
                    />
                </div>
                {error && (
                    <div style={{ 
                        color: 'red', 
                        marginBottom: '15px',
                        padding: '10px',
                        backgroundColor: '#ffebee',
                        borderRadius: '4px'
                    }}>
                        {error}
                    </div>
                )}
                <button 
                    type="submit" 
                    disabled={isLoading}
                    style={{ 
                        width: '100%', 
                        padding: '12px', 
                        backgroundColor: '#007bff', 
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        opacity: isLoading ? 0.7 : 1
                    }}
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;