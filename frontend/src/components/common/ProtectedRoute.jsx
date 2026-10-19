import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-slate-200">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-brand-blue/20 border-t-brand-electric rounded-full animate-spin" />
          <div className="absolute w-8 h-8 rounded-full bg-brand-blue/30 blur-md animate-pulse" />
        </div>
        <p className="mt-4 text-sm font-medium tracking-wide text-slate-400 animate-pulse">
          Authenticating IntellMeet Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
