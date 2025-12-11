import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';

interface Experience {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

const ResumeBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [personalInfo, setPersonalInfo] = useState({ name: '', email: '', phone: '', linkedin: '' });
  const [summary, setSummary] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([
    { id: '1', role: '', company: '', duration: '', description: '' }
  ]);
  const [skills, setSkills] = useState('');

  const addExperience = () => {
    setExperiences([...experiences, { id: Date.now().toString(), role: '', company: '', duration: '', description: '' }]);
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setExperiences(experiences.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  };

  const handleSave = () => {
    // Format the resume into a string
    const formattedResume = `
# ${personalInfo.name}
${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.linkedin}

## Professional Summary
${summary}

## Experience
${experiences.map(exp => `
### ${exp.role} at ${exp.company}
${exp.duration}
${exp.description}
`).join('\n')}

## Skills
${skills}
    `.trim();

    // Navigate back to optimizer with the data
    navigate('/resume', { state: { generatedResume: formattedResume } });
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/resume')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={20} /> Back to Optimizer
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Manual Resume Builder</h2>
        <button 
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Save size={18} /> Save & Use
        </button>
      </div>

      <div className="space-y-6">
        {/* Personal Info */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" placeholder="Full Name" className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={personalInfo.name} onChange={e => setPersonalInfo({...personalInfo, name: e.target.value})}
            />
            <input 
              type="email" placeholder="Email" className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={personalInfo.email} onChange={e => setPersonalInfo({...personalInfo, email: e.target.value})}
            />
            <input 
              type="text" placeholder="Phone" className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={personalInfo.phone} onChange={e => setPersonalInfo({...personalInfo, phone: e.target.value})}
            />
            <input 
              type="text" placeholder="LinkedIn URL" className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={personalInfo.linkedin} onChange={e => setPersonalInfo({...personalInfo, linkedin: e.target.value})}
            />
          </div>
        </section>

        {/* Summary */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Professional Summary</h3>
          <textarea 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
            placeholder="Brief overview of your career..."
            value={summary} onChange={e => setSummary(e.target.value)}
          />
        </section>

        {/* Experience */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
            <h3 className="text-lg font-bold text-gray-800">Work Experience</h3>
            <button onClick={addExperience} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors">
              <Plus size={16} /> Add Role
            </button>
          </div>
          <div className="space-y-6">
            {experiences.map((exp, index) => (
              <div key={exp.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100 relative group">
                <button 
                  onClick={() => removeExperience(exp.id)} 
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={18} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 pr-8">
                  <input 
                    type="text" placeholder="Job Title" className="p-2 bg-white border border-gray-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
                    value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)}
                  />
                  <input 
                    type="text" placeholder="Company" className="p-2 bg-white border border-gray-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
                    value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)}
                  />
                  <input 
                    type="text" placeholder="Duration (e.g. 2020 - Present)" className="p-2 bg-white border border-gray-200 rounded outline-none focus:ring-1 focus:ring-blue-500 md:col-span-2"
                    value={exp.duration} onChange={e => updateExperience(exp.id, 'duration', e.target.value)}
                  />
                </div>
                <textarea 
                  placeholder="Key responsibilities and achievements..." 
                  className="w-full p-2 bg-white border border-gray-200 rounded outline-none focus:ring-1 focus:ring-blue-500 h-24 resize-none"
                  value={exp.description} onChange={e => updateExperience(exp.id, 'description', e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Skills</h3>
          <textarea 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
            placeholder="List your technical and soft skills (comma separated)..."
            value={skills} onChange={e => setSkills(e.target.value)}
          />
        </section>
      </div>
    </div>
  );
};

export default ResumeBuilder;
