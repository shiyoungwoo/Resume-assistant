
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { X, User, Mail, Phone, MapPin, Linkedin, CreditCard, Activity, Calendar, Camera, Star } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import ResumeOptimizer from './views/ResumeOptimizer';
import ResumeBuilder from './views/ResumeBuilder';
import ResumeRefiner from './views/ResumeRefiner';
import InterviewPrep from './views/InterviewPrep';
import Community from './views/Community';
import { UserState } from './types';

const App: React.FC = () => {
  // Extended User State
  const [user, setUser] = useState<UserState>({
    name: 'Alex Johnson',
    points: 1250,
    avatar: 'https://picsum.photos/id/237/200/200',
    email: 'alex.johnson@example.com',
    phone: '+1 (555) 012-3456',
    linkedin: 'linkedin.com/in/alexjohnson',
    location: 'San Francisco, CA',
    status: 'Open to Opportunities',
    gender: 'Male',
    age: '28',
    idCard: 'ID-88392019',
    showAchievement: true
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleAddPoints = (amount: number) => {
    setUser(prev => ({ ...prev, points: prev.points + amount }));
  };

  const handleDeducePoints = (amount: number) => {
    if (user.points >= amount) {
      setUser(prev => ({ ...prev, points: prev.points - amount }));
      return true;
    }
    return false;
  };

  const handleUpdateProfile = (field: keyof UserState, value: any) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-[#F3F4F6]">
        <Routes>
          <Route path="/resume/build" element={<ResumeBuilder />} />
          <Route path="/resume/refine" element={<ResumeRefiner />} />
          <Route path="*" element={
            <>
              <Sidebar user={user} onEditProfile={() => setIsProfileOpen(true)} />
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/resume" element={<ResumeOptimizer />} />
                  <Route path="/prep" element={<InterviewPrep user={user} onDeducePoints={handleDeducePoints} />} />
                  <Route path="/community" element={<Community onAddPoints={handleAddPoints} />} />
                </Routes>
              </main>
            </>
          } />
        </Routes>

        {/* Profile Editor Modal */}
        {isProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shrink-0 relative">
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
                <div className="flex items-center gap-6">
                  <div className="relative group">
                     <img 
                       src={user.avatar} 
                       alt={user.name} 
                       className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-gray-200"
                     />
                     <button className="absolute bottom-0 right-0 p-2 bg-gray-900 text-white rounded-full hover:bg-gray-700 border-2 border-white shadow-sm transition-colors">
                       <Camera size={14} />
                     </button>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <p className="text-blue-100 flex items-center gap-2 mt-1">
                       <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.status?.includes('Open') ? 'bg-green-400/20 text-green-100 border border-green-400/30' : 'bg-gray-400/20'}`}>
                         {user.status || 'Set Status'}
                       </span>
                    </p>
                  </div>
                  <div className="ml-auto text-right hidden sm:block">
                     <p className="text-xs uppercase tracking-wider opacity-70 mb-1">Current Points</p>
                     <p className="text-3xl font-bold">{user.points}</p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
                   <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <User size={20} className="text-blue-600"/> Personal Information
                   </h3>
                   <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100">
                     <input 
                        type="checkbox" 
                        checked={user.showAchievement} 
                        onChange={(e) => handleUpdateProfile('showAchievement', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                     />
                     <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        Show Badge <Star size={12} className="text-yellow-500 fill-yellow-500" />
                     </span>
                   </label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                      <User size={14} /> Full Name
                    </label>
                    <input 
                      type="text" 
                      value={user.name}
                      onChange={(e) => handleUpdateProfile('name', e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                      <CreditCard size={14} /> ID Card / Passport
                    </label>
                    <input 
                      type="text" 
                      value={user.idCard || ''}
                      onChange={(e) => handleUpdateProfile('idCard', e.target.value)}
                      placeholder="Enter ID Number"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                      <Mail size={14} /> Email Address
                    </label>
                    <input 
                      type="email" 
                      value={user.email || ''}
                      onChange={(e) => handleUpdateProfile('email', e.target.value)}
                      placeholder="name@example.com"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                      <Phone size={14} /> Phone Number
                    </label>
                    <input 
                      type="tel" 
                      value={user.phone || ''}
                      onChange={(e) => handleUpdateProfile('phone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                      <Linkedin size={14} /> LinkedIn URL
                    </label>
                    <input 
                      type="text" 
                      value={user.linkedin || ''}
                      onChange={(e) => handleUpdateProfile('linkedin', e.target.value)}
                      placeholder="linkedin.com/in/username"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-900 text-blue-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                      <MapPin size={14} /> Location
                    </label>
                    <input 
                      type="text" 
                      value={user.location || ''}
                      onChange={(e) => handleUpdateProfile('location', e.target.value)}
                      placeholder="City, Country"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                      <User size={14} /> Gender
                    </label>
                    <select 
                      value={user.gender || ''}
                      onChange={(e) => handleUpdateProfile('gender', e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-900"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                      <Calendar size={14} /> Age
                    </label>
                    <input 
                      type="number" 
                      value={user.age || ''}
                      onChange={(e) => handleUpdateProfile('age', e.target.value)}
                      placeholder="Age"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-900"
                    />
                  </div>
                  
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                      <Activity size={14} /> Current Status
                    </label>
                    <select 
                      value={user.status || ''}
                      onChange={(e) => handleUpdateProfile('status', e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-900"
                    >
                      <option value="Open to Opportunities">Open to Opportunities</option>
                      <option value="Actively Interviewing">Actively Interviewing</option>
                      <option value="Not Looking">Not Looking</option>
                      <option value="Student">Student</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:scale-105"
                >
                  Save Changes
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;