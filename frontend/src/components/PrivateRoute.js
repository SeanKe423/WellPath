// Redirects users to the correct page based on their role to prevent unauthorized access
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const location = useLocation();
  
  console.log('PrivateRoute - Token:', token);
  console.log('PrivateRoute - User Role:', userRole);
  console.log('PrivateRoute - Required Role:', requiredRole);
  console.log('PrivateRoute - Current Path:', location.pathname);

  if (!token) {
    console.log('No token found, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific role is required, check if the user has that role
  if (requiredRole && userRole !== requiredRole) {
    console.log('Role mismatch - Required:', requiredRole, 'Current:', userRole);
    // Only redirect if we're not already on the correct page
    const currentPath = location.pathname;
    if (userRole === 'admin' && currentPath !== '/admin-dashboard') {
      console.log('Redirecting admin to admin dashboard');
      return <Navigate to="/admin-dashboard" replace />;
    } else if (userRole === 'institution' && currentPath !== '/dashboard') {
      console.log('Redirecting institution to dashboard');
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === 'user' && currentPath !== '/matches') {
      console.log('Redirecting user to matches');
      return <Navigate to="/matches" replace />;
    }
  }
  
  console.log('Rendering protected route content');
  return children;
};

export default PrivateRoute; 