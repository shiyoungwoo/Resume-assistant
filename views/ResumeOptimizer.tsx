import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Sparkles, Loader2, Copy, Check, Upload, FileText, Image as ImageIcon, PenTool, X, Edit3, Briefcase, Target } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { optimizeResume, generateCareerInsights, ContentInput } from '../services/geminiService';
import { CareerAdvice } from '../types';

const ResumeOptimizer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Resume State
  const [resumeMode, setResumeMode] = useState<'text' | 'file'>('text');
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<{ name: string; type: string; data: string } | null>(null);

  // JD State
  const [jdMode, setJdMode] = useState<'text' | 'file'>('text');
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState<{ name: string; type: string; data: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Career Navigator State
  const [careerAdvice, setCareerAdvice] = useState<CareerAdvice | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Check for manually built resume passed from builder
  useEffect(() => {
    if (location.state?.generatedResume) {
      setResumeText(location.state.generatedResume);
      setResumeMode('text');
      // Clear state so it doesn't persist on refresh if we don't want it to
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Debounced Career Analysis Logic
  useEffect(() => {
    const triggerAnalysis = async () => {
       const hasContent = (resumeMode === 'text' && resumeText.length > 50) || (resumeMode === 'file' && resumeFile);
       
       if (hasContent) {
          setLoadingAdvice(true);
          const resumeInput: ContentInput = resumeMode === 'text' 
            ? { type: 'text', content: resumeText }
            : { type: 'file', mimeType: resumeFile!.type, data: resumeFile!.data };
          
          // We pass an empty history for now as we are focusing on the resume analysis
          const advice = await generateCareerInsights(resumeInput, []);
          setCareerAdvice(advice);
          setLoadingAdvice(false);
       }
    };

    const handler = setTimeout(() => {
        triggerAnalysis();
    }, 2000); // 2 second debounce

    return () => clearTimeout(handler);
  }, [resumeText, resumeFile, resumeMode]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'jd') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (type === 'resume') {
        setResumeFile({ name: file.name, type: file.type, data: base64 });
        setResumeMode('file');
      } else {
        setJdFile({ name: file.name, type: file.type, data: base64 });
        setJdMode('file');
      }
    } catch (err) {
      console.error("File reading failed", err);
      alert("Failed to read file");
    }
  };

  const handleOptimize = async () => {
    const resumeInput: ContentInput = resumeMode === 'text' 
      ? { type: 'text', content: resumeText }
      : { type: 'file', mimeType: resumeFile!.type, data: resumeFile!.data };

    const jdInput: ContentInput = jdMode === 'text'
      ? { type: 'text', content: jdText }
      : { type: 'file', mimeType: jdFile!.type, data: jdFile!.data };

    if ((resumeMode === 'text' && !resumeText) || (resumeMode === 'file' && !resumeFile)) return;
    if ((jdMode === 'text' && !jdText) || (jdMode === 'file' && !jdFile)) return;

    setLoading(true);
    setResult(null);
    const optimizedText = await optimizeResume(resumeInput, jdInput);
    setResult(optimizedText);
    
    // SAVE RESUME CONTEXT FOR INTERVIEW PREP
    if (resumeMode === 'text' && resumeText) {
      localStorage.setItem('offerflow_resume_context', resumeText);
    } else if (resumeMode === 'file' && resumeFile) {
      localStorage.setItem('offerflow_resume_file_name', resumeFile.name);
    }
    
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoToRefine = () => {
    const originalContent = resumeMode === 'text' ? resumeText : `[Resume File: ${resumeFile?.name}] (Please use the suggestions to rebuild)`;

    navigate('/resume/refine', { 
      state: { 
        optimizationReport: result,
        originalResume: originalContent
      } 
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          Resume Optimizer <Sparkles className="text-yellow-500 fill-yellow-500" size={24} />
        </h2>
        <p className="text-gray-500 mt-1">
          Upload your resume (PDF/Image) or write one manually. Paste the JD or upload a screenshot.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        {/* Input Section */}
        <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2">
          
          {/* Resume Input Block */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col transition-all">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" /> Candidate Resume
              </label>
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setResumeMode('text')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${resumeMode === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Text / Manual
                </button>
                <button 
                   onClick={() => setResumeMode('file')}
                   className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${resumeMode === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Upload File
                </button>
              </div>
            </div>

            {resumeMode === 'text' ? (
              <div className="flex flex-col gap-3">
                <textarea
                  className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                  placeholder="Paste your existing resume content here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
                <div className="flex items-center gap-3">
                   <div className="h-px bg-gray-200 flex-1"></div>
                   <span className="text-xs text-gray-400 font-medium">OR</span>
                   <div className="h-px bg-gray-200 flex-1"></div>
                </div>
                <button 
                  onClick={() => navigate('/resume/build')}
                  className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-medium hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2"
                >
                  <PenTool size={18} /> Open Manual Resume Builder
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors relative">
                {resumeFile ? (
                   <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                         <FileText size={24} />
                      </div>
                      <p className="font-medium text-gray-900 text-sm truncate max-w-[200px]">{resumeFile.name}</p>
                      <button onClick={() => setResumeFile(null)} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                        <X size={12} /> Remove
                      </button>
                   </div>
                ) : (
                  <>
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-600">Click to upload or drag & drop</p>
                    <p className="text-xs text-gray-400 mt-1">Supports PDF, TXT, PNG, JPG</p>
                    <p className="text-[10px] text-gray-400 mt-2 italic">For Word/Excel, please save as PDF first.</p>
                    <input 
                      type="file" 
                      accept=".pdf,.txt,image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleFileUpload(e, 'resume')}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* JD Input Block */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col transition-all">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <ImageIcon size={18} className="text-indigo-600" /> Job Description
              </label>
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setJdMode('text')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${jdMode === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Text
                </button>
                <button 
                   onClick={() => setJdMode('file')}
                   className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${jdMode === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Screenshot
                </button>
              </div>
            </div>

             {jdMode === 'text' ? (
                <textarea
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                  placeholder="Paste the Job Description (JD) text here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
             ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors relative">
                  {jdFile ? (
                     <div className="flex flex-col items-center gap-2">
                        <img src={`data:${jdFile.type};base64,${jdFile.data}`} alt="JD Preview" className="h-16 object-contain rounded border border-gray-200" />
                        <p className="font-medium text-gray-900 text-sm truncate max-w-[200px]">{jdFile.name}</p>
                        <button onClick={() => setJdFile(null)} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                          <X size={12} /> Remove
                        </button>
                     </div>
                  ) : (
                    <>
                      <ImageIcon size={32} className="text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-600">Upload JD Screenshot</p>
                      <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, WEBP</p>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleFileUpload(e, 'jd')}
                      />
                    </>
                  )}
                </div>
             )}
          </div>

          {/* AI Career Navigator */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                 <Briefcase size={20} />
               </div>
               <div>
                 <h3 className="text-sm font-bold text-gray-900">AI Career Navigator</h3>
                 <p className="text-xs text-gray-500">Auto-generated based on uploaded resume</p>
               </div>
             </div>
             
             {loadingAdvice ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-500 gap-2">
                   <Loader2 className="animate-spin text-blue-500" />
                   <span className="text-xs">Analyzing career path...</span>
                </div>
             ) : careerAdvice ? (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    <div className="mb-3">
                       <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1">
                          <Target size={12} /> Recommended Path
                       </p>
                       <p className="text-lg font-bold text-gray-900">{careerAdvice.recommendedRole}</p>
                       <p className="text-xs text-blue-600 font-medium">{careerAdvice.industryFit}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-900 leading-relaxed mb-3">
                       {careerAdvice.rationale}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Strengths & Gaps</p>
                        <div className="flex flex-wrap gap-2">
                            {careerAdvice.strengths.slice(0, 2).map((s, i) => (
                                <span key={i} className="bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] font-medium border border-green-100">{s}</span>
                            ))}
                            {careerAdvice.improvementAreas.slice(0, 2).map((s, i) => (
                                <span key={i} className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-[10px] font-medium border border-orange-100">{s}</span>
                            ))}
                        </div>
                    </div>
                    <p className="mt-3 text-[10px] text-gray-400 italic">
                        * Provide more detailed experience for deeper insights.
                    </p>
                </div>
             ) : (
                <div className="text-center py-6 text-gray-400 text-xs">
                   <Briefcase size={32} className="mx-auto mb-2 opacity-50" />
                   <p>Upload or enter resume to unlock insights.</p>
                   <p className="mt-1 text-[10px] text-orange-400">Tip: More detail = Better advice!</p>
                </div>
             )}
          </div>

          <button
            onClick={handleOptimize}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all mt-auto ${
              loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.01]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Processing Files & Text...
              </>
            ) : (
              <>
                Analyze & Optimize <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Optimization Report</h3>
             {result && (
                <div className="flex gap-2">
                    <button 
                    onClick={copyToClipboard}
                    className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-600"
                    >
                    {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
             )}
          </div>
          <div className="flex-1 p-6 overflow-y-auto bg-white relative">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                <Loader2 size={48} className="animate-spin text-blue-500" />
                <p className="animate-pulse">Reading documents and analyzing match...</p>
              </div>
            ) : result ? (
              <div className="flex flex-col h-full">
                <div className="prose prose-sm max-w-none text-gray-700 mb-8 flex-1 overflow-y-auto">
                    <div className="whitespace-pre-wrap">{result}</div>
                </div>
                
                {/* Refine Button Area */}
                <div className="mt-4 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
                    <button 
                        onClick={handleGoToRefine}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                    >
                        <Edit3 size={18} /> Refine & Edit Resume with AI
                    </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 opacity-50">
                <FileText size={48} />
                <p>Upload files or enter text to see AI suggestions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeOptimizer;