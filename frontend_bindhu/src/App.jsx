import { useState, useRef, useEffect } from 'react';
import { Upload, Github, User, Send, CheckCircle2, AlertCircle, Sparkles, BookOpen, ChevronRight } from 'lucide-react';

export default function App() {
  const [file, setFile] = useState(null);
  const [github, setGithub] = useState('');
  const [targetRole, setTargetRole] = useState('Machine Learning Engineer');
  
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [resumeText, setResumeText] = useState('');
  
  const [interviewMode, setInterviewMode] = useState(false);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [interviewing, setInterviewing] = useState(false);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file || !github) return alert("Please provide both a resume and GitHub username");
    
    setLoading(true);
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("github_username", github);
    formData.append("target_role", targetRole);

    try {
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if(data.analysis) {
        setAnalysis(data.analysis);
        setResumeText(data.resume_text);
      } else {
        alert("Error analyzing: " + JSON.stringify(data));
      }
    } catch (err) {
      alert("API Error: " + err);
    }
    setLoading(false);
  };

  const startInterview = async () => {
    setInterviewMode(true);
    setChat([{ role: 'system', content: 'Initializing interview...' }]);
    setInterviewing(true);
    
    try {
      const res = await fetch("http://localhost:8000/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          target_role: targetRole,
          chat_history: [],
          latest_user_answer: ""
        })
      });
      const data = await res.json();
      setChat([
        { role: 'assistant', content: data.next_question }
      ]);
    } catch (err) {
      setChat([{ role: 'system', content: 'Failed to connect.' }]);
    }
    setInterviewing(false);
  };

  const sendMessage = async () => {
    if(!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChat(prev => [...prev, { role: 'user', content: userMsg }, { role: 'system', content: 'Typing...' }]);
    setInterviewing(true);
    
    try {
      const res = await fetch("http://localhost:8000/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          target_role: targetRole,
          chat_history: chat.filter(c => c.role !== 'system').map(c => ({
            role: c.role === 'assistant' ? 'INTERVIEWER' : 'CANDIDATE',
            content: c.content
          })),
          latest_user_answer: userMsg
        })
      });
      
      const data = await res.json();
      setChat(prev => {
        const newChat = [...prev];
        newChat.pop(); // remove typing...
        
        // Add feedback system message
        newChat.push({ 
          role: 'feedback', 
          score: data.accuracy_score, 
          content: data.feedback 
        });
        
        if (data.next_question) {
          newChat.push({ role: 'assistant', content: data.next_question });
        }
        
        if (data.is_concluded) {
          newChat.push({ role: 'system', content: 'Interview Concluded. Great job!' });
        }
        
        return newChat;
      });
    } catch (err) {
      setChat(prev => {
        const newChat = [...prev];
        newChat.pop();
        newChat.push({ role: 'system', content: 'Network error.' });
        return newChat;
      });
    }
    setInterviewing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 text-blue-600">
            <Sparkles size={32} />
            <h1 className="text-2xl font-bold text-slate-800">AI Career Copilot</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User size={20} className="text-blue-500" /> Candidate Profile
              </h2>
              
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Target Role</label>
                  <input 
                    type="text" 
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">GitHub Username</label>
                  <div className="relative">
                    <Github className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={github}
                      onChange={e => setGithub(e.target.value)}
                      placeholder="torvalds"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Resume (PDF)</label>
                  <label className="flex items-center justify-center w-full px-4 py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Upload size={18} />
                      <span className="text-sm">{file ? file.name : 'Upload PDF'}</span>
                    </div>
                    <input type="file" className="hidden" accept=".pdf" onChange={e => setFile(e.target.files[0])} />
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {loading ? 'Analyzing...' : 'Analyze Profile'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Results & Chat */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Analysis Results */}
            {analysis && !interviewMode && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gap Analysis</h2>
                    <p className="text-slate-500 mt-1">Comparison against {targetRole} requirements</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-extrabold text-blue-600">{analysis.readiness_score}%</div>
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Readiness</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                    <h3 className="font-semibold text-green-800 flex items-center gap-2 mb-3"><CheckCircle2 size={18} /> Key Strengths</h3>
                    <ul className="space-y-2 text-sm text-green-700">
                      {analysis.strengths.map((s,i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                    <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3"><AlertCircle size={18} /> Skill Gaps</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skill_gaps.map((g,i) => <span key={i} className="px-2 py-1 bg-white text-red-600 rounded-md shadow-sm text-xs font-medium border border-red-100">{g}</span>)}
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-amber-50 border border-amber-100 rounded-xl mb-8">
                  <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3"><BookOpen size={18} /> Recommendations</h3>
                  <ul className="space-y-2 text-sm text-amber-900">
                    {analysis.recommendations.map((r,i) => <li key={i}>• {r}</li>)}
                  </ul>
                </div>

                <button 
                  onClick={startInterview}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2 text-lg"
                >
                  Start Mock Interview <ChevronRight size={24} />
                </button>
              </div>
            )}

            {/* Mock Interview Interface */}
            {interviewMode && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px] animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-indigo-600 p-4 text-white">
                  <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles size={20}/> Adaptive Technical Interview</h3>
                  <p className="text-indigo-200 text-sm opacity-90">Role: {targetRole}</p>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
                  {chat.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'feedback' ? (
                        <div className="bg-white border border-indigo-100 p-3 rounded-xl w-3/4 shadow-sm my-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded">Score: {msg.score}/10</span>
                            <span className="text-xs text-slate-500 font-medium uppercase">Feedback</span>
                          </div>
                          <p className="text-sm text-slate-600">{msg.content}</p>
                        </div>
                      ) : msg.role === 'system' ? (
                        <div className="w-full text-center text-xs text-slate-400 my-2 italic">{msg.content}</div>
                      ) : (
                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-tl-sm'}`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-slate-100">
                  <div className="flex gap-2 relative">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !interviewing && sendMessage()}
                      placeholder="Type your answer..."
                      disabled={interviewing}
                      className="flex-1 py-3 pl-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <button 
                      onClick={sendMessage}
                      disabled={interviewing || !chatInput.trim()}
                      className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!analysis && !interviewMode && !loading && (
              <div className="h-full flex items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-100 border-dashed text-slate-400 text-center">
                <div>
                  <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Upload a profile to begin analysis</p>
                  <p className="text-sm mt-2">The AI will evaluate the resume and GitHub portfolio against your target role.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
