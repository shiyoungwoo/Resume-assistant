import React, { useState, useEffect, useRef } from 'react';
import { Mic, MessageSquare, BookOpen, Send, User, Bot, Play, Pause, RefreshCw, Sparkles, Globe, FileText, Briefcase, Bookmark, Video, VideoOff, Lock, AlertCircle, X, ArrowRight, Save, Wand2 } from 'lucide-react';
import { generateInterviewQuestions, generateSelfIntroFromResume, createMockInterviewChat, generateAnswerHelp } from '../services/geminiService';
import { ChatMessage, PrepTab, UserState } from '../types';
import { useLocation } from 'react-router-dom';

interface InterviewPrepProps {
  user?: UserState;
  onDeducePoints?: (amount: number) => boolean;
}

interface QuestionItem {
  id: string;
  question: string;
  type: string;
  source: string;
  hint: string;
  isBookmarked?: boolean;
  userAnswer?: string;
  aiFeedback?: string;
}

const MAX_FREE_MOCK_ATTEMPTS = 2;
const MOCK_COST = 200;

const InterviewPrep: React.FC<InterviewPrepProps> = ({ user, onDeducePoints }) => {
  const location = useLocation();
  const navState = location.state as { company?: string; role?: string } | null;

  const [activeTab, setActiveTab] = useState<PrepTab>(PrepTab.QUESTIONS);
  
  // Initialize state directly from navigation state for immediate visibility
  const [company, setCompany] = useState(navState?.company || '');
  const [role, setRole] = useState(navState?.role || '');
  
  // Question Bank State
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingAnswerHelp, setLoadingAnswerHelp] = useState<string | null>(null);

  // Self Intro State
  const [introDraft, setIntroDraft] = useState(''); // The user editable draft
  const [resumeContext, setResumeContext] = useState('');
  const [aiIntroData, setAiIntroData] = useState<{rationale: string, script: string} | null>(null);
  const [generatingIntro, setGeneratingIntro] = useState(false);

  // Mock Chat/Video State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSession, setChatSession] = useState<any>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Video specific
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mockAttempts, setMockAttempts] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasStartedVideo, setHasStartedVideo] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load persistence for Questions and Mock Usage
  useEffect(() => {
    // Load resume context if available
    const savedResume = localStorage.getItem('offerflow_resume_context');
    if (savedResume) setResumeContext(savedResume);

    if (company && role) {
        const storageKey = `prep_questions_${company}_${role}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            setQuestions(JSON.parse(saved));
        } else if (navState?.company) {
            // Only auto-generate if no saved data exists
            handleGenerateQuestions(navState.company, navState.role);
        }
    }
    
    // Load mock usage
    const usage = localStorage.getItem('offerflow_mock_usage');
    if (usage) {
        setMockAttempts(parseInt(usage));
    }
  }, [company, role]); // Depend on company/role to switch context

  // Save persistence
  useEffect(() => {
     if (company && role && questions.length > 0) {
         localStorage.setItem(`prep_questions_${company}_${role}`, JSON.stringify(questions));
     }
  }, [questions, company, role]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleGenerateQuestions = async (companyVal?: string, roleVal?: string) => {
    const c = companyVal || company;
    const r = roleVal || role;
    if (!c || !r) return;
    
    setLoadingQuestions(true);
    // Pass existing question texts to avoid duplicates
    const existingTexts = questions.map(q => q.question);
    const result = await generateInterviewQuestions(c, r, existingTexts);
    try {
        const cleanJson = result.replace(/```json\n?|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed)) {
            const newQuestions = parsed.map((q: any) => ({ ...q, id: Date.now().toString() + Math.random() }));
            // Prepend new questions but keep existing ones
            setQuestions(prev => [...prev, ...newQuestions]); 
        }
    } catch (e) {
        console.error("Failed to parse questions JSON", e);
    }
    setLoadingQuestions(false);
  };

  const toggleBookmark = (id: string) => {
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, isBookmarked: !q.isBookmarked } : q));
  };

  const updateAnswer = (id: string, text: string) => {
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, userAnswer: text } : q));
  };

  const handleGetAnswerHelp = async (id: string) => {
      const q = questions.find(item => item.id === id);
      if (!q) return;
      setLoadingAnswerHelp(id);
      const help = await generateAnswerHelp(q.question, q.userAnswer || '');
      setQuestions(prev => prev.map(item => item.id === id ? { ...item, aiFeedback: help } : item));
      setLoadingAnswerHelp(null);
  };

  const sortedQuestions = [...questions].sort((a, b) => {
      // Bookmarked first
      if (a.isBookmarked && !b.isBookmarked) return -1;
      if (!a.isBookmarked && b.isBookmarked) return 1;
      // Then those with answers
      if (a.userAnswer && !b.userAnswer) return -1;
      if (!a.userAnswer && b.userAnswer) return 1;
      return 0;
  });

  const handleGenerateIntro = async () => {
    if (!resumeContext) {
        alert("No resume found. Please optimize your resume first to generate a tailored intro.");
        return;
    }
    if (!company || !role) {
        alert("Please enter target company and role.");
        return;
    }
    setGeneratingIntro(true);
    const result = await generateSelfIntroFromResume(resumeContext, role, company);
    if (result) {
        setAiIntroData(result);
    }
    setGeneratingIntro(false);
  };

  const transferScript = () => {
    if (aiIntroData?.script) {
        setIntroDraft(aiIntroData.script);
    }
  };

  // --- MOCK INTERVIEW LOGIC ---

  const requestPermissions = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
        setPermissionGranted(true);
        return true;
    } catch (err) {
        console.error("Error accessing media devices.", err);
        alert("Camera/Microphone access denied. Please enable permissions to use Video Mock Mode.");
        return false;
    }
  };

  const startMockSession = async () => {
      if (!company || !role) return;

      // Check limits
      if (mockAttempts >= MAX_FREE_MOCK_ATTEMPTS) {
          setShowPaymentModal(true);
          return;
      }

      // Check permissions
      const granted = await requestPermissions();
      if (!granted) return;

      setHasStartedVideo(true);
      setIsVideoMode(true);
      setChatHistory([]); // Clear previous chat
      
      // Increment usage
      const newCount = mockAttempts + 1;
      setMockAttempts(newCount);
      localStorage.setItem('offerflow_mock_usage', newCount.toString());

      // Init AI
      const chat = createMockInterviewChat(company, role);
      setChatSession(chat);
      setIsChatLoading(true);
      
      try {
        const result = await chat.sendMessage({ message: "Start the interview." });
        setChatHistory([{
            id: 'init',
            role: 'model',
            text: result.text || "Hello, let's begin the interview. Please introduce yourself.",
            timestamp: Date.now()
        }]);
      } catch (e) {
        console.error(e);
      }
      setIsChatLoading(false);
  };

  const handlePayPoints = () => {
      if (onDeducePoints && onDeducePoints(MOCK_COST)) {
          // Reset attempts logic or just allow one pass?
          // For simplicity, we just decrement attempts by 1 to allow another go, or set a "paid" flag.
          // Let's just decrease the counter by 1 to give a free slot.
          const newCount = Math.max(0, mockAttempts - 1);
          setMockAttempts(newCount);
          localStorage.setItem('offerflow_mock_usage', newCount.toString());
          setShowPaymentModal(false);
          startMockSession();
      } else {
          alert("Insufficient points!");
      }
  };

  const stopVideoSession = () => {
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsVideoMode(false);
      setHasStartedVideo(false);
      setPermissionGranted(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatSession) return;
    
    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: chatInput,
        timestamp: Date.now()
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
        const result = await chatSession.sendMessage({ message: userMsg.text });
        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: result.text || "I didn't catch that.",
            timestamp: Date.now()
        };
        setChatHistory(prev => [...prev, aiMsg]);
    } catch (e) {
        console.error(e);
    }
    setIsChatLoading(false);
  };

  const getSourceIcon = (sourceType: string) => {
      switch(sourceType?.toLowerCase()) {
          case 'community': return <Globe size={14} className="text-green-500" />;
          case 'resume': return <FileText size={14} className="text-blue-500" />;
          case 'role': return <Briefcase size={14} className="text-orange-500" />;
          default: return <Sparkles size={14} className="text-purple-500" />;
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
       <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Interview Prep Station</h2>
        <p className="text-gray-500 mt-1">Simulate environments and get prepared for {company || 'your target company'}.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Target Company</label>
            <input 
                type="text" 
                placeholder="e.g. Google" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
            />
        </div>
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Target Role</label>
            <input 
                type="text" 
                placeholder="e.g. Senior Frontend Engineer" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                value={role}
                onChange={(e) => setRole(e.target.value)}
            />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
        {[
            { id: PrepTab.QUESTIONS, label: 'Question Bank', icon: <BookOpen size={18} /> },
            { id: PrepTab.SELF_INTRO, label: 'Self Intro', icon: <User size={18} /> },
            { id: PrepTab.MOCK_INTERVIEW, label: 'AI Mock Interview', icon: <MessageSquare size={18} /> },
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if(activeTab === PrepTab.MOCK_INTERVIEW && isVideoMode) stopVideoSession(); }}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
                    activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                }`}
            >
                {tab.icon} {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
            </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
        
        {/* QUESTIONS TAB */}
        {activeTab === PrepTab.QUESTIONS && (
            <div className="p-8 h-full overflow-y-auto">
                {!questions.length && !loadingQuestions ? (
                    <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
                        <div className="bg-blue-50 p-4 rounded-full mb-4">
                            <BookOpen size={32} className="text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Generate Smart Questions</h3>
                        <p className="text-gray-500 mb-6">Based on: <br/> • Community shared experiences <br/> • Resume gaps & extensions <br/> • Job Description & Culture</p>
                        <button 
                            onClick={() => handleGenerateQuestions()}
                            disabled={!company || !role || loadingQuestions}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingQuestions ? 'Analyzing...' : 'Generate Questions'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 pb-20">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Predicted Questions</h3>
                                <p className="text-xs text-gray-500">Auto-saved to your browser</p>
                            </div>
                            <button onClick={() => handleGenerateQuestions()} className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 hover:bg-blue-100 transition-colors">
                                <RefreshCw size={14} /> Add More Angles
                            </button>
                        </div>
                        {loadingQuestions && (
                             <div className="flex items-center justify-center py-6 bg-gray-50 rounded-xl mb-4">
                                <Sparkles className="animate-spin text-purple-500 mr-2" />
                                <span className="text-gray-500 text-sm">Hunting for fresh interview perspectives...</span>
                             </div>
                        )}
                        {sortedQuestions.map((q) => (
                            <div key={q.id} className={`bg-white border rounded-xl transition-all duration-300 ${q.isBookmarked ? 'border-blue-200 shadow-md ring-1 ring-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-gray-100 border border-gray-200 text-[10px] px-2 py-0.5 rounded-full font-medium text-gray-500 flex items-center gap-1 uppercase tracking-wide">
                                                {getSourceIcon(q.source)}
                                                {q.source || 'General'}
                                            </span>
                                            <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">{q.type}</span>
                                        </div>
                                        <button onClick={() => toggleBookmark(q.id)} className={`transition-colors ${q.isBookmarked ? 'text-blue-500 fill-blue-500' : 'text-gray-300 hover:text-blue-400'}`}>
                                            <Bookmark size={20} />
                                        </button>
                                    </div>
                                    <p className="font-bold text-gray-800 text-lg mb-2">{q.question}</p>
                                    <div className="bg-yellow-50/50 p-2 rounded-lg border border-yellow-100 mb-4 inline-block">
                                        <p className="text-xs text-yellow-800 font-medium">💡 Hint: <span className="font-normal opacity-90">{q.hint}</span></p>
                                    </div>

                                    {/* Answer Section */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Your Answer</label>
                                        <div className="relative">
                                            <textarea 
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none resize-y min-h-[80px]"
                                                placeholder="Draft your answer here..."
                                                value={q.userAnswer || ''}
                                                onChange={(e) => updateAnswer(q.id, e.target.value)}
                                            />
                                            <button 
                                                onClick={() => handleGetAnswerHelp(q.id)}
                                                disabled={loadingAnswerHelp === q.id}
                                                className="absolute bottom-3 right-3 p-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-md shadow-sm hover:scale-105 transition-transform"
                                                title="Get AI Feedback"
                                            >
                                                {loadingAnswerHelp === q.id ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                            </button>
                                        </div>
                                        {q.aiFeedback && (
                                            <div className="mt-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-sm text-indigo-900 animate-in slide-in-from-top-2">
                                                <div className="flex items-center gap-2 font-bold mb-1 text-indigo-700">
                                                    <Bot size={14} /> AI Coach
                                                </div>
                                                <div className="whitespace-pre-wrap leading-relaxed opacity-90">{q.aiFeedback}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* SELF INTRO TAB */}
        {activeTab === PrepTab.SELF_INTRO && (
            <div className="flex h-full flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200">
                {/* LEFT: AI Generator */}
                <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <Wand2 size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">AI Architect</h3>
                            <p className="text-xs text-gray-500">
                                {resumeContext 
                                    ? "Resume Loaded & Ready" 
                                    : "No Resume Context (Please Optimize Resume first)"}
                            </p>
                        </div>
                    </div>

                    {!aiIntroData ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-6 text-sm">
                                I will analyze your resume against the {company} {role} position 
                                to build a strategic self-introduction.
                            </p>
                            <button 
                                onClick={handleGenerateIntro}
                                disabled={!resumeContext || generatingIntro}
                                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                            >
                                {generatingIntro ? <RefreshCw className="animate-spin" /> : <Sparkles size={18} />}
                                Generate Strategy & Script
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl">
                                <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <Bot size={16} /> AI Rationale
                                </h4>
                                <p className="text-sm text-yellow-900 leading-relaxed italic">
                                    "{aiIntroData.rationale}"
                                </p>
                            </div>
                            
                            <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                                <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                                    Draft Script
                                </h4>
                                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                    {aiIntroData.script}
                                </p>
                            </div>

                            <button 
                                onClick={transferScript}
                                className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                Use this Script <ArrowRight size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT: Editor */}
                <div className="w-full md:w-1/2 p-6 flex flex-col bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Your Script (Editor)</h3>
                                <p className="text-xs text-gray-500">Polish & Personalize</p>
                            </div>
                        </div>
                        <button className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
                            <Save size={14} /> Auto-saving
                        </button>
                    </div>

                    <textarea 
                        className="flex-1 w-full p-5 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 leading-relaxed text-base"
                        placeholder="Transfer the script here or start writing..."
                        value={introDraft}
                        onChange={(e) => setIntroDraft(e.target.value)}
                    />
                    
                    <div className="mt-4 flex justify-end">
                        <button 
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
                            onClick={() => alert("Script Saved!")}
                        >
                            Save Final Version
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* MOCK INTERVIEW TAB */}
        {activeTab === PrepTab.MOCK_INTERVIEW && (
            <div className="flex flex-col h-full relative">
                {!hasStartedVideo ? (
                     <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
                        <div className="bg-purple-50 p-6 rounded-full mb-6 relative">
                            <Video size={48} className="text-purple-600" />
                            <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white">
                                LIVE
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Video Mock Interview</h3>
                        <p className="text-gray-500 mb-6 leading-relaxed">
                            Experience a realistic interview simulation. 
                            Enable your camera and microphone to interact with the AI Interviewer.
                        </p>
                        
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-8 w-full">
                            <div className="flex justify-between items-center text-sm mb-2">
                                <span className="text-gray-600">Free Attempts Remaining:</span>
                                <span className="font-bold text-gray-900">{Math.max(0, MAX_FREE_MOCK_ATTEMPTS - mockAttempts)} / {MAX_FREE_MOCK_ATTEMPTS}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-purple-600 h-2 rounded-full transition-all" 
                                    style={{ width: `${Math.min(100, (mockAttempts / MAX_FREE_MOCK_ATTEMPTS) * 100)}%` }}
                                ></div>
                            </div>
                            {mockAttempts >= MAX_FREE_MOCK_ATTEMPTS && (
                                <p className="text-xs text-orange-600 mt-2 font-medium flex items-center justify-center gap-1">
                                    <Lock size={12} /> Limit reached. Use points to continue.
                                </p>
                            )}
                        </div>

                        <button 
                            onClick={startMockSession}
                            disabled={!company || !role}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform hover:scale-105"
                        >
                            <Video size={20} /> Start Video Session
                        </button>
                    </div>
                ) : (
                    <div className="flex h-full bg-gray-900 relative">
                        {/* Main Video Area (Split Screen) */}
                        <div className="flex-1 flex flex-col md:flex-row">
                            
                            {/* AI Avatar / Visualizer */}
                            <div className="flex-1 bg-gray-800 flex flex-col items-center justify-center p-4 border-r border-gray-700 relative">
                                <div className="w-32 h-32 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-2xl mb-6 relative">
                                    <Bot size={64} className="text-white" />
                                    {isChatLoading && (
                                        <div className="absolute inset-0 border-4 border-white/30 rounded-full animate-ping"></div>
                                    )}
                                </div>
                                <h3 className="text-white font-bold text-xl">{company} Interviewer</h3>
                                <p className="text-blue-200 text-sm">AI Recruiter</p>
                                
                                {/* Audio Visualizer Bars (Simulated) */}
                                <div className="flex gap-1 mt-8 h-8 items-end">
                                    {[1,2,3,4,5].map(i => (
                                        <div key={i} className={`w-2 bg-blue-400 rounded-t-sm ${isChatLoading ? 'animate-pulse' : 'h-2'}`} style={{height: isChatLoading ? `${Math.random() * 24 + 8}px` : '4px', animationDuration: '0.4s'}}></div>
                                    ))}
                                </div>
                            </div>

                            {/* User Webcam */}
                            <div className="flex-1 bg-black relative overflow-hidden group">
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    muted 
                                    playsInline 
                                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                                />
                                <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-xs font-medium backdrop-blur-sm">
                                    You
                                </div>
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={stopVideoSession} className="bg-red-600 p-2 rounded-full text-white hover:bg-red-700" title="End Call">
                                        <VideoOff size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Chat Overlay / Sidebar */}
                        <div className="w-full md:w-80 bg-white border-l border-gray-200 flex flex-col shadow-xl z-10 absolute md:relative right-0 h-full">
                             <div className="p-4 border-b border-gray-200 bg-gray-50 font-bold text-gray-700 flex justify-between items-center">
                                 <span>Interview Log</span>
                                 <button onClick={stopVideoSession} className="md:hidden text-gray-500"><X size={20}/></button>
                             </div>
                             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                                {chatHistory.map((msg) => (
                                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[90%] p-3 rounded-xl text-sm ${
                                            msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-br-none' 
                                            : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                        }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                             </div>
                             <div className="p-3 border-t border-gray-200 bg-gray-50">
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                                        placeholder="Type answer..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={!chatInput.trim() || isChatLoading}
                                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 text-center">Speak clearly or type your response.</p>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock size={32} className="text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Limit Reached</h3>
                  <p className="text-gray-500 mb-6">
                      You have used your 2 free mock interview sessions. 
                      Unlock another session by redeeming community points.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Cost</span>
                      <span className="font-bold text-gray-900 flex items-center gap-1">
                          {MOCK_COST} pts
                      </span>
                  </div>
                  
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setShowPaymentModal(false)}
                        className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handlePayPoints}
                        className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                      >
                          Pay & Start
                      </button>
                  </div>
                  {user && (
                      <p className="text-xs text-gray-400 mt-4">Your Balance: {user.points} pts</p>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

export default InterviewPrep;
