import React, { useState,  useEffect  } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <-- IMPORT useAuth
import axios from '../api/axios';
import { db } from '../db';
import { FaUserCircle, FaWifi } from 'react-icons/fa';

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};


const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const isOnline = useOnlineStatus();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [cachedUsers, setCachedUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      const loadCachedUsers = async () => {
        try {
          // Fetch all users we have saved locally for the offline screen
          const users = await db.users.toArray();
          //setCachedUsers(users.filter(u => u.role === 'waiter')); // Only show waiters for offline login
          const activeStaff = users.filter(u => (u.role === 'waiter' || u.role === 'manager') && u.is_active);
          setCachedUsers(activeStaff);
        } catch (dbError) {
          console.error("Failed to load users from local database:", dbError);
          setError("Could not load offline profiles.");
        }
      };
      loadCachedUsers();
    }
  }, [isOnline]);

   const handleOnlineLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // --- CRUCIAL DEBUGGING STEP ---
    // This log will appear in your BROWSER'S developer console.
    console.log('ATTEMPTING TO SEND LOGIN REQUEST WITH:', { username, password });
    // ---

    try {
      const response = await axios.post('/auth/login', { username, password });
      const { user, token } = response.data;
      
      login(response.data);

      await db.users.put({
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        last_known_token: token 
      });

      /* if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/orders');
      } */
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'manager':
          navigate('/manager'); // <-- Send managers to their new dashboard
          break;
        case 'waiter':
          navigate('/order/create'); // Send waiters directly to create an order
          break;
        default:
          navigate('/login'); // Fallback to login if role is unknown
          break;
      }
    } catch (err) {
      console.error("Login API call failed:", err); // Add more detailed error logging
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };


  
// In src/pages/Login.jsx

const handleOfflineLogin = (user) => {
    // --- DEBUG LOG 1: What are we logging in with? ---
    console.log(
      `[LOGIN_PAGE] Unlocking OFFLINE session for: ${user.full_name} (ID: ${user.id}). Token being used:`, 
      user.last_known_token
    );
    
    login({
        user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role
        },
        token: user.last_known_token // Use the last good token we have for them
    });

    navigate('/order/create');
};

  // --- Render different UI based on online status ---
  if (isOnline) {
    // --- Online Login Form ---
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="p-8 bg-white rounded-lg shadow-xl w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">🍽️ MenuMaster</h1>
            <p className="text-gray-500">Sign in to your account</p>
          </div>
          {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-center mb-4">{error}</p>}
          <form onSubmit={handleOnlineLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  } else {
    // --- Offline "Unlock" Screen ---
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-800 text-white p-4">
        <div className="p-8 bg-gray-700 rounded-lg shadow-xl w-full max-w-md">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Offline Mode</h1>
                <p className="flex items-center justify-center gap-2 text-yellow-400 mt-2">
                    <FaWifi /> No Internet Connection
                </p>
            </div>
            <p className="text-center text-gray-300 mb-6">Select your profile to start your shift</p>
            <div className="space-y-3 max-h-60 overflow-y-auto">
                {cachedUsers.length > 0 ? (
                    cachedUsers.map(user => (
                        <button key={user.id} onClick={() => handleOfflineLogin(user)}
                          className="w-full flex items-center gap-4 p-4 bg-gray-600 rounded-lg hover:bg-indigo-500 transition-colors"
                        >
                            <FaUserCircle size={32} className="text-gray-400" />
                            <span className="font-semibold text-lg">{user.full_name || user.username}</span>
                        </button>
                    ))
                ) : (
                    <p className="text-center text-gray-400 py-8">
                        No waiter profiles are saved for offline use.
                        <br/>
                        Please connect to the internet and log in once to enable this feature.
                    </p>
                )}
            </div>
        </div>
      </div>
    );
  }
};
export default Login;