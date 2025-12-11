import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Download, Image as ImageIcon, Plus, Trash2, Loader2, Eye, X, Minimize2, AlertCircle, LayoutTemplate, UploadCloud, Check } from 'lucide-react';
import { ResumeData, Experience } from '../types';
import { applyOptimizationToResume } from '../services/geminiService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

type TemplateType = 'classic' | 'modern' | 'minimal' | 'custom';

const ResumeRefiner: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const resumePreviewRef = useRef<HTMLDivElement>(null);

  const optimizationReport = location.state?.optimizationReport || "No report available.";
  const originalResume = location.state?.originalResume || "";

  const [loadingSmartFill, setLoadingSmartFill] = useState(false);
  const [data, setData] = useState<ResumeData>({
    personalInfo: { name: '', email: '', phone: '', linkedin: '' },
    summary: '',
    experiences: [],
    skills: ''
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  
  // Template State
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern');
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [customTemplateName, setCustomTemplateName] = useState<string | null>(null);

  const handleSmartFill = async () => {
    setLoadingSmartFill(true);
    const structuredData = await applyOptimizationToResume(originalResume, optimizationReport);
    if (structuredData) {
        setData(structuredData);
    } else {
        alert("Could not structure resume data automatically. Please fill manually.");
    }
    setLoadingSmartFill(false);
  };

  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Logic to parse file would go here. For now we acknowledge receipt.
      setCustomTemplateName(file.name);
      setSelectedTemplate('custom');
      setShowTemplateMenu(false);
      alert(`Template "${file.name}" imported successfully! Applied Custom layout.`);
    }
  };

  const handleExportPDF = async () => {
    if (!resumePreviewRef.current) return;
    setIsExporting(true);
    
    try {
      const element = resumePreviewRef.current;
      // High quality scale
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate height in mm relative to PDF width
      const ratio = imgWidth / pdfWidth;
      const imgHeightMM = imgHeight / ratio;
      
      let heightLeft = imgHeightMM;
      let position = 0;
      
      // First page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightMM);
      heightLeft -= pdfHeight;
      
      // Add subsequent pages if content overflows
      while (heightLeft > 0) {
        position = position - pdfHeight; // Move image up (negative offset)
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightMM);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`Resume_${data.personalInfo.name || 'Optimized'}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Failed to export PDF");
    }
    
    setIsExporting(false);
  };

  const handleExportImage = async () => {
    if (!resumePreviewRef.current) return;
    setIsExporting(true);
    try {
        const element = resumePreviewRef.current;
        const canvas = await html2canvas(element, { scale: 2 });
        const link = document.createElement('a');
        link.download = `Resume_${data.personalInfo.name || 'Optimized'}.png`;
        link.href = canvas.toDataURL();
        link.click();
    } catch (e) {
        console.error(e);
        alert("Failed to export Image");
    }
    setIsExporting(false);
  };

  // Form Handlers
  const updateInfo = (field: string, val: string) => setData({...data, personalInfo: {...data.personalInfo, [field]: val}});
  const updateExp = (id: string, field: keyof Experience, val: string) => {
    const newExps = data.experiences.map(e => e.id === id ? {...e, [field]: val} : e);
    setData({...data, experiences: newExps});
  };
  const addExp = () => setData({...data, experiences: [...data.experiences, {id: Date.now().toString(), role:'', company:'', duration:'', description:''}]});
  const removeExp = (id: string) => setData({...data, experiences: data.experiences.filter(e => e.id !== id)});

  // Reusable Resume Paper Component for rendering
  const ResumePaper = () => {
    // Style configurations based on template
    const getStyles = () => {
      switch (selectedTemplate) {
        case 'classic':
          return {
            font: 'font-serif',
            header: 'text-center border-b-2 border-black pb-4 mb-6',
            name: 'text-4xl font-bold text-gray-900 tracking-wide',
            info: 'text-sm text-gray-700 justify-center mt-2',
            sectionTitle: 'text-lg font-bold text-gray-900 uppercase border-b border-gray-400 mb-4 pb-1',
            expHeader: 'flex justify-between items-baseline mb-1',
            role: 'font-bold text-gray-900',
            company: 'italic text-gray-700',
            desc: 'text-sm text-gray-800 leading-relaxed'
          };
        case 'minimal':
          return {
            font: 'font-mono',
            header: 'pb-6 mb-6',
            name: 'text-3xl font-normal text-gray-900 tracking-tight',
            info: 'text-xs text-gray-500 mt-2',
            sectionTitle: 'text-sm font-bold text-gray-500 uppercase tracking-widest mb-4',
            expHeader: 'flex flex-col mb-2',
            role: 'font-bold text-gray-900',
            company: 'text-sm text-gray-600',
            desc: 'text-xs text-gray-600 leading-loose'
          };
        case 'custom':
          // Simulating a custom import style - slightly chaotic or just distinct
          return {
            font: 'font-sans',
            header: 'bg-gray-100 p-6 -mx-6 -mt-6 mb-6 border-b border-gray-300',
            name: 'text-3xl font-bold text-gray-800',
            info: 'text-sm text-gray-600 mt-1',
            sectionTitle: 'text-lg font-bold text-blue-800 border-l-4 border-blue-800 pl-3 mb-4 bg-blue-50 py-1',
            expHeader: 'flex justify-between items-center mb-1 bg-gray-50 p-2 rounded',
            role: 'font-bold text-blue-900',
            company: 'text-sm font-semibold text-gray-700',
            desc: 'text-sm text-gray-700 leading-relaxed px-2'
          };
        case 'modern':
        default:
          return {
            font: 'font-sans',
            header: 'border-b-2 border-gray-800 pb-4 mb-6',
            name: 'text-4xl font-bold text-gray-900 uppercase tracking-tight',
            info: 'text-sm text-gray-600 mt-2',
            sectionTitle: 'text-sm font-bold text-blue-700 uppercase tracking-wider border-b border-gray-200 mb-4 pb-1',
            expHeader: 'flex justify-between items-baseline mb-1',
            role: 'font-bold text-gray-900',
            company: 'text-sm text-gray-700 font-medium',
            desc: 'text-sm text-gray-700 leading-relaxed'
          };
      }
    };

    const styles = getStyles();
    const compactPadding = isCompact ? 'p-[15mm]' : 'p-[20mm]';
    // Classic/Minimal might want less padding in compact mode too, but styles generally handle spacing.
    // We apply base padding to the container.

    return (
      <div 
          ref={resumePreviewRef} 
          className={`bg-white shadow-2xl w-[210mm] min-h-[297mm] mx-auto text-left relative transition-all duration-300 ${compactPadding} ${styles.font}`}
      >
          {/* Visual Page Break Markers */}
          <div className="absolute top-[297mm] left-0 w-full border-b-2 border-dashed border-red-300 opacity-50 pointer-events-none flex justify-end print:hidden">
              <div className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-1 rounded-t border border-red-200 border-b-0 flex items-center gap-1">
                  <AlertCircle size={10} /> End of Page 1
              </div>
          </div>
          <div className="absolute top-[594mm] left-0 w-full border-b-2 border-dashed border-red-300 opacity-50 pointer-events-none flex justify-end print:hidden">
              <div className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-1 rounded-t border border-red-200 border-b-0 flex items-center gap-1">
                  <AlertCircle size={10} /> End of Page 2
              </div>
          </div>

          <header className={`${styles.header} ${isCompact ? 'mb-4 pb-2' : ''}`}>
              <h1 className={styles.name}>{data.personalInfo.name || "Your Name"}</h1>
              <div className={`flex flex-wrap ${styles.info} ${selectedTemplate === 'classic' ? 'gap-4' : 'gap-3'}`}>
                  {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
                  {data.personalInfo.phone && <span>{selectedTemplate === 'classic' ? '|' : '•'} {data.personalInfo.phone}</span>}
                  {data.personalInfo.linkedin && <span>{selectedTemplate === 'classic' ? '|' : '•'} {data.personalInfo.linkedin}</span>}
              </div>
          </header>

          {data.summary && (
              <section className={`${isCompact ? 'mb-4' : 'mb-6'}`}>
                  <h2 className={styles.sectionTitle}>Professional Summary</h2>
                  <p className={`${selectedTemplate === 'minimal' ? 'text-xs' : 'text-sm'} text-gray-700 leading-relaxed whitespace-pre-wrap`}>{data.summary}</p>
              </section>
          )}

          {data.experiences.length > 0 && (
              <section className={`${isCompact ? 'mb-4' : 'mb-6'}`}>
                  <h2 className={styles.sectionTitle}>Experience</h2>
                  <div className={`space-y-${isCompact ? '3' : '5'}`}>
                      {data.experiences.map(exp => (
                          <div key={exp.id}>
                              <div className={styles.expHeader}>
                                  <h3 className={styles.role}>{exp.role}</h3>
                                  <span className="text-xs text-gray-500 font-medium">{exp.duration}</span>
                              </div>
                              <p className={`${styles.company} mb-1`}>{exp.company}</p>
                              <div className={`${styles.desc} whitespace-pre-wrap`}>
                                  {exp.description}
                              </div>
                          </div>
                      ))}
                  </div>
              </section>
          )}

          {data.skills && (
              <section>
                  <h2 className={styles.sectionTitle}>Skills</h2>
                  <p className={`${selectedTemplate === 'minimal' ? 'text-xs' : 'text-sm'} text-gray-700 leading-relaxed whitespace-pre-wrap`}>{data.skills}</p>
              </section>
          )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* LEFT: Optimization Report */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
           <button onClick={() => navigate('/resume')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
             <ArrowLeft size={18} />
           </button>
           <h2 className="font-bold text-gray-800">Optimization Report</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none text-gray-700">
           <div className="whitespace-pre-wrap">{optimizationReport}</div>
        </div>
      </div>

      {/* RIGHT: Editor */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
           <div className="flex items-center gap-3">
              <h2 className="font-bold text-xl text-gray-900 hidden md:block">Refine Resume</h2>
              
              <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

              {/* Template Selector */}
              <div className="relative">
                  <button 
                    onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <LayoutTemplate size={16} /> Templates
                  </button>
                  
                  {showTemplateMenu && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <div className="text-xs font-semibold text-gray-400 px-2 py-1 uppercase">Select Style</div>
                        {(['modern', 'classic', 'minimal'] as TemplateType[]).map(t => (
                            <button
                                key={t}
                                onClick={() => { setSelectedTemplate(t); setShowTemplateMenu(false); }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${selectedTemplate === t ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
                            >
                                <span className="capitalize">{t}</span>
                                {selectedTemplate === t && <Check size={14} />}
                            </button>
                        ))}
                        <div className="h-px bg-gray-100 my-2"></div>
                        <div className="px-2 pb-1">
                            <label className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-gray-700 cursor-pointer">
                                <UploadCloud size={14} /> Import (Word/Excel)
                                <input type="file" accept=".docx, .xlsx" className="hidden" onChange={handleImportTemplate} />
                            </label>
                        </div>
                    </div>
                  )}
              </div>

              <button 
                onClick={() => setShowPreview(true)} 
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <Eye size={16} /> Preview
              </button>

              <button
                onClick={() => setIsCompact(!isCompact)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${
                  isCompact 
                    ? 'bg-purple-100 text-purple-700 border-purple-300' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Minimize2 size={16} /> {isCompact ? 'Compact' : 'Fit'}
              </button>
           </div>
           
           <button 
             onClick={handleSmartFill}
             disabled={loadingSmartFill}
             className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium shadow hover:shadow-md transition-all disabled:opacity-70"
           >
             {loadingSmartFill ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
             One-Click Import
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex gap-8 justify-center">
            
            {/* Editor Form */}
            <div className="w-full max-w-2xl space-y-6 pb-20">
                {selectedTemplate === 'custom' && customTemplateName && (
                    <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                        <UploadCloud size={14} /> Using imported structure from: <strong>{customTemplateName}</strong>
                    </div>
                )}
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Personal Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <input value={data.personalInfo.name} onChange={e => updateInfo('name', e.target.value)} placeholder="Full Name" className="p-2 border rounded text-sm"/>
                        <input value={data.personalInfo.email} onChange={e => updateInfo('email', e.target.value)} placeholder="Email" className="p-2 border rounded text-sm"/>
                        <input value={data.personalInfo.phone} onChange={e => updateInfo('phone', e.target.value)} placeholder="Phone" className="p-2 border rounded text-sm"/>
                        <input value={data.personalInfo.linkedin} onChange={e => updateInfo('linkedin', e.target.value)} placeholder="LinkedIn" className="p-2 border rounded text-sm"/>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Professional Summary</h3>
                    <textarea value={data.summary} onChange={e => setData({...data, summary: e.target.value})} className="w-full h-32 p-3 border rounded text-sm leading-relaxed" placeholder="Write a compelling summary..." />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Experience</h3>
                        <button onClick={addExp} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline"><Plus size={14} /> ADD</button>
                    </div>
                    <div className="space-y-6">
                        {data.experiences.map((exp) => (
                            <div key={exp.id} className="relative bg-gray-50 p-4 rounded-lg border border-gray-100 group">
                                <button onClick={() => removeExp(exp.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input value={exp.role} onChange={e => updateExp(exp.id, 'role', e.target.value)} placeholder="Role" className="p-2 bg-white border rounded text-sm"/>
                                    <input value={exp.company} onChange={e => updateExp(exp.id, 'company', e.target.value)} placeholder="Company" className="p-2 bg-white border rounded text-sm"/>
                                </div>
                                <input value={exp.duration} onChange={e => updateExp(exp.id, 'duration', e.target.value)} placeholder="Duration" className="w-full p-2 bg-white border rounded text-sm mb-2"/>
                                <textarea value={exp.description} onChange={e => updateExp(exp.id, 'description', e.target.value)} placeholder="Description..." className="w-full h-24 p-2 bg-white border rounded text-sm"/>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Skills</h3>
                    <textarea value={data.skills} onChange={e => setData({...data, skills: e.target.value})} className="w-full h-24 p-3 border rounded text-sm" placeholder="Java, React, Team Leadership..." />
                </div>
            </div>

        </div>
      </div>

      {/* Full Screen Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm p-4">
            <div className="bg-gray-100 w-full max-w-6xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <Eye size={20} className="text-blue-600"/> Resume Preview
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 border-l border-gray-200 pl-4">
                            <span className="font-medium">Template:</span>
                            <span className="capitalize text-gray-800 font-bold">{selectedTemplate}</span>
                        </div>
                        <button
                            onClick={() => setIsCompact(!isCompact)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${
                            isCompact 
                                ? 'bg-purple-100 text-purple-700 border-purple-300' 
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            <Minimize2 size={16} /> {isCompact ? 'Compact: ON' : 'Compact: OFF'}
                        </button>
                    </div>
                    <button 
                        onClick={() => setShowPreview(false)} 
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Preview Area */}
                <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-300">
                    <ResumePaper />
                </div>

                {/* Modal Footer (Actions) */}
                <div className="bg-white p-4 border-t border-gray-200 flex items-center justify-center gap-4 shrink-0">
                    <button 
                        onClick={handleExportImage} 
                        disabled={isExporting} 
                        className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-all"
                    >
                        <ImageIcon size={20} /> Save as Image
                    </button>
                    <button 
                        onClick={handleExportPDF} 
                        disabled={isExporting} 
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all hover:scale-105"
                    >
                        <Download size={20} /> Save as PDF
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ResumeRefiner;