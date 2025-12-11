import React from 'react';
import { LayoutDashboard, FileText, Mic, Users, Award, Edit2, Star } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { UserState } from '../types';

interface SidebarProps {
  user: UserState;
  onEditProfile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onEditProfile }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/resume', label: 'Resume Optimizer', icon: <FileText size={20} /> },
    { path: '/prep', label: 'Interview Prep', icon: <Mic size={20} /> },
    { path: '/community', label: 'Community', icon: <Users size={20} /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 font-sans">
      <div className="p-6 border-b border-gray-100 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">O</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">OfferYou</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div 
          onClick={onEditProfile}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all transform hover:scale-[1.02] group relative overflow-hidden"
          title="Click to edit profile"
        >
          <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 size={14} className="text-white/80" />
          </div>

          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="relative">
              <img 
                src={user.avatar} 
                alt="User" 
                className="w-10 h-10 rounded-full border-2 border-white/30 object-cover bg-white"
              />
              {user.showAchievement && (
                <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full p-0.5 border border-white shadow-sm animate-in zoom-in">
                  <Star size={10} fill="currentColor" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium opacity-90 truncate">Welcome back,</p>
              <p className="font-bold truncate">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm relative z-10">
            <span className="text-xs font-medium uppercase tracking-wider opacity-80">Points</span>
            <div className="flex items-center gap-1">
              <Award size={16} className="text-yellow-300" />
              <span className="font-bold text-lg">{user.points}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;