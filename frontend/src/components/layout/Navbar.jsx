import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Building, Briefcase } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getLinks = () => {
    if (!user) return [{ label: 'Login', path: '/login' }];
    if (user.role === 'admin') return [
      { label: 'Dashboard', path: '/admin', icon: <Building size={18}/> }
    ];
    if (user.role === 'candidate') return [
      { label: 'Dashboard', path: '/candidate', icon: <User size={18}/> },
      { label: 'Jobs', path: '/jobs', icon: <Briefcase size={18}/> }
    ];
    if (user.role === 'interviewer') return [
      { label: 'Interviews', path: '/interviewer', icon: <Building size={18}/> }
    ];
    return [];
  };

  return (
    <nav className="bg-surface border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to={user ? `/${user.role}` : '/'} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                P
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                PIMS
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {getLinks().map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.path 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-textMuted hover:text-white hover:bg-slate-800'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            {user && (
              <button 
                onClick={logout}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-transparent hover:border-red-400/20"
              >
                <LogOut size={18} />
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
