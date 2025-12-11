import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { CheckCircle, Clock, Award, Mic, FileText, Calendar, Video, BookOpen, MoreHorizontal, X, AlertCircle, PlusCircle, Users, ArrowRight, TrendingUp, Briefcase, Sparkles, Target, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateCareerInsights } from '../services/geminiService';
import { CareerAdvice } from '../types';

interface InterviewSession {
  id: string;
  company: string;
  role: string;
  date: string; // ISO date string YYYY-MM-DD
  time: string;
  type: 'Screening' | 'Technical' | 'System Design' | 'Behavioral' | 'Final Round' | 'Next Round';
  status: 'Scheduled' | 'Completed' | 'Passed' | 'Failed' | 'Pending';
}

const initialInterviews: InterviewSession[] = [
  { id: '1', company: 'Amazon', role: 'SDE II', date: '2023-10-24', time: '14:00', type: 'Technical', status: 'Passed' },
  { id: '2', company: 'Google', role: 'Frontend Eng', date: '2023-10-26', time: '10:00', type: 'Screening', status: 'Scheduled' },
  { id: '3', company: 'Netflix', role: 'Senior Eng', date: '2023-10-28', time: '11:00', type: 'System Design', status: 'Scheduled' },
  { id: '4', company: 'Meta', role: 'Product Manager', date: '2023-11-05', time: '09:00', type: 'Behavioral', status: 'Scheduled' },
];

const activityData = [
  { name: 'Applications', value: 12 },
  { name: 'Interviews', value: 3 },
  { name: 'Offers', value: 1 },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<InterviewSession[]>(initialInterviews);
  
  // Modal State
  const [selectedInterview, setSelectedInterview] = useState<InterviewSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [outcome, setOutcome] = useState<'Passed' | 'Failed' | 'Pending'>('Pending');
  const [hasNextRound, setHasNextRound] = useState(false);
  const [nextRoundDate, setNextRoundDate] = useState('');
  const [nextRoundTime, setNextRoundTime] = useState('');

  // Career Advice State
  const [careerAdvice, setCareerAdvice] = useState<CareerAdvice | null>(null);

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Load advice on mount
  useEffect(() => {
    const fetchAdvice = async () => {
      const resumeContext = localStorage.getItem('offerflow_resume_context');
      if (resumeContext && interviews.length > 0 && !careerAdvice) {
        // Simple filter for history
        const history = interviews.map(i => ({ role: i.role, company: i.company, status: i.status }));
        const advice = await generateCareerInsights(
          { type: 'text', content: resumeContext },
          history
        );
        setCareerAdvice(advice);
      }
    };
    fetchAdvice();
  }, [interviews]);

  const handleUpdateClick = (interview: InterviewSession) => {
    setSelectedInterview(interview);
    setOutcome(interview.status === 'Scheduled' ? 'Pending' : (interview.status as any));
    setHasNextRound(false);
    setNextRoundDate('');
    setNextRoundTime('');
    setIsModalOpen(true);
  };

  const handleSaveResult = () => {
    if (!selectedInterview) return;

    // 1. Update current interview status
    const updatedInterviews = interviews.map(i => 
      i.id === selectedInterview.id ? { ...i, status: outcome } : i
    );

    // 2. If Passed and has next round, create new entry
    if (outcome === 'Passed' && hasNextRound && nextRoundDate) {
      const newInterview: InterviewSession = {
        id: Date.now().toString(),
        company: selectedInterview.company,
        role: selectedInterview.role,
        date: nextRoundDate,
        time: nextRoundTime || '10:00',
        type: 'Next Round', 
        status: 'Scheduled'
      };
      updatedInterviews.push(newInterview);
      // Sort by date (simple string sort for demo)
      updatedInterviews.sort((a, b) => a.date.localeCompare(b.date));
    }

    setInterviews(updatedInterviews);
    setIsModalOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Passed': return 'bg-green-100 text-green-700 border-green-200';
      case 'Failed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getUrgencyStyles = (dateStr: string, status: string) => {
    if (status !== 'Scheduled') return 'border-gray-100 bg-gray-50 opacity-75';

    const interviewDate = new Date(dateStr);
    const now = new Date();
    // Reset time for accurate day comparison
    now.setHours(0,0,0,0);
    const target = new Date(interviewDate);
    target.setHours(0,0,0,0);

    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays < 0) return 'border-gray-200 bg-gray-50'; // Past but marked scheduled?
    if (diffDays <= 2) return 'border-red-200 bg-red-50/50 ring-1 ring-red-100'; // Very Urgent
    if (diffDays <= 7) return 'border-yellow-200 bg-yellow-50/50 ring-1 ring-yellow-100'; // Coming soon
    return 'border-gray-100 hover:border-blue-200 bg-white';
  };

  const getUrgencyLabel = (dateStr: string, status: string) => {
     if (status !== 'Scheduled') return null;
     const interviewDate = new Date(dateStr);
     const now = new Date();
     now.setHours(0,0,0,0);
     const target = new Date(interviewDate);
     target.setHours(0,0,0,0);
     const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

     if (diffDays === 0) return <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full animate-pulse">TODAY</span>;
     if (diffDays === 1) return <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">TOMORROW</span>;
     if (diffDays <= 2) return <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">URGENT</span>;
     if (diffDays <= 7) return <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">THIS WEEK</span>;
     return null;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 mt-1">Let's find the job that fits you best. Leverage AI and community insights to succeed.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Mock Interviews', value: '12', icon: <Mic className="text-purple-500" />, change: '+2 this week' },
          { label: 'Career Match', value: careerAdvice?.industryFit || 'Analyzing...', icon: <TrendingUp className="text-blue-500" />, change: 'Top Industry' },
          { label: 'Community Points', value: '850', icon: <Award className="text-yellow-500" />, change: 'Top 10%' },
          { label: 'Upcoming Interviews', value: interviews.filter(i => i.status === 'Scheduled').length.toString(), icon: <Video className="text-orange-500" />, change: 'Check Schedule' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                {React.cloneElement(stat.icon as React.ReactElement<any>, { size: 24 })}
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{stat.change}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1 truncate">{stat.value}</h3>
            <p className="text-gray-500 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Section: Interview Schedule */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Schedule */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
              <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="text-blue-600" size={20} /> Interview Schedule
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Today is <span className="text-blue-600">{todayStr}</span></p>
              </div>
              <button className="text-sm text-blue-600 font-medium hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors border border-blue-100">
                + Add New
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {interviews.length === 0 ? (
                <div className="text-center py-10 text-gray-400">No interviews scheduled.</div>
              ) : (
                interviews.map((interview) => (
                  <div key={interview.id} className={`flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-xl border transition-all ${getUrgencyStyles(interview.date, interview.status)}`}>
                    {/* Date Box */}
                    <div className="flex-shrink-0 w-full md:w-20 bg-white rounded-lg border border-gray-200 p-2 text-center shadow-sm relative overflow-hidden">
                      {/* Urgency Stripe */}
                      {getUrgencyLabel(interview.date, interview.status) && <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>}
                      
                      <p className="text-xs text-gray-500 uppercase font-bold">{new Date(interview.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                      <p className="text-xl font-bold text-gray-800">{new Date(interview.date).getDate()}</p>
                      <p className="text-xs text-gray-400">{interview.time}</p>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-lg truncate">{interview.company}</h4>
                        {getUrgencyLabel(interview.date, interview.status)}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${getStatusColor(interview.status)}`}>
                          {interview.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-medium truncate">{interview.role}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Video size={12} /> {interview.type} Round
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="w-full md:w-auto mt-2 md:mt-0 flex flex-row gap-2">
                      {interview.status === 'Scheduled' && (
                          <>
                              <button 
                                  onClick={() => navigate('/prep', { state: { company: interview.company, role: interview.role } })}
                                  title="Practice Mock Interview"
                                  className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors border border-purple-100"
                              >
                                  <Mic size={18} />
                              </button>
                              <button 
                                  onClick={() => navigate('/community')}
                                  title="Find Company Tips"
                                  className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                              >
                                  <Users size={18} />
                              </button>
                          </>
                      )}
                      <button 
                        onClick={() => handleUpdateClick(interview)}
                        className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm whitespace-nowrap"
                      >
                        {interview.status === 'Completed' || interview.status === 'Scheduled' ? 'Update Result' : 'View Details'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Side Chart/List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-8 h-fit">
          
          <div>
             <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
               <BookOpen size={16} className="text-blue-500" /> Mock & Prep Tasks
             </h4>
             <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 transition-colors hover:bg-blue-100 cursor-pointer">
                  <div className="bg-blue-200 p-2 rounded-lg text-blue-700">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Google Mock Interview</p>
                    <p className="text-xs text-blue-600 font-medium">Tonight, 8:00 PM</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100 transition-colors hover:bg-purple-100 cursor-pointer">
                  <div className="bg-purple-200 p-2 rounded-lg text-purple-700">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Revise Resume for Meta</p>
                    <p className="text-xs text-purple-600 font-medium">Due Today</p>
                  </div>
                </div>
             </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Application Funnel</h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB"/>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {activityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#93C5FD' : index === 1 ? '#60A5FA' : '#2563EB'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {isModalOpen && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Interview Feedback</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">How did the interview go?</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Passed', 'Failed', 'Pending'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setOutcome(status)}
                      className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                        outcome === status 
                        ? status === 'Passed' ? 'border-green-500 bg-green-50 text-green-700' : status === 'Failed' ? 'border-red-500 bg-red-50 text-red-700' : 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-gray-100 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {outcome === 'Passed' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer ${hasNextRound ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`} onClick={() => setHasNextRound(!hasNextRound)}>
                      {hasNextRound && <CheckCircle size={14} className="text-white" />}
                    </div>
                    <label className="text-sm font-bold text-gray-800 cursor-pointer select-none" onClick={() => setHasNextRound(!hasNextRound)}>
                      Is there a next round?
                    </label>
                  </div>

                  {hasNextRound && (
                    <div className="grid grid-cols-2 gap-3 pl-8">
                       <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
                          <input 
                            type="date" 
                            className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
                            value={nextRoundDate}
                            onChange={(e) => setNextRoundDate(e.target.value)}
                          />
                       </div>
                       <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Time</label>
                          <input 
                            type="time" 
                            className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
                            value={nextRoundTime}
                            onChange={(e) => setNextRoundTime(e.target.value)}
                          />
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSaveResult} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm">Save Update</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;