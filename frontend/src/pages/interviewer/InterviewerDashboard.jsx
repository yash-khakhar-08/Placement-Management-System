import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { Briefcase, Users, ClipboardCheck, MessageSquare, Lock, Calendar, History, Search, XCircle, PlayCircle, Filter, Clock, CheckCircle2, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const InterviewerDashboard = () => {
  const { user } = useAuth();
  
  // Dashboard Core State
  const [activeTab, setActiveTab] = useState('pool'); // 'pool', 'history'
  const [loading, setLoading] = useState(true);

  // Pool State
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Evaluation Box State
  const [evaluatingCandidate, setEvaluatingCandidate] = useState(null);
  const [evalHistory, setEvalHistory] = useState([]);
  const [expandedHistoryDriveId, setExpandedHistoryDriveId] = useState(null);
  const initialFeedbackData = { 
    question_asked: '', 
    public_feedback: '', 
    private_feedback: '', 
    result: 'pending' 
  };
  const [feedbackData, setFeedbackData] = useState(initialFeedbackData);

  // History State
  const [fullHistory, setFullHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filterYear, setFilterYear] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterCollege, setFilterCollege] = useState('All');

  useEffect(() => {
    fetchDrives();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (selectedDrive) {
      const updatedDrive = drives.find(d => d.id === selectedDrive.id);
      if (updatedDrive) {
         const activeCandidates = updatedDrive.applications?.filter(a => ['applied', 'in_progress', 'hold', 'in_interview'].includes(a.status)) || [];
         setSelectedDrive({...updatedDrive, activeCandidates});
      }
    }
  }, [drives]);

  const fetchDrives = async () => {
    try {
      const res = await api.get('/rounds/interviewer/assigned');
      setDrives(res.data);
    } catch (error) {
      toast.error('Failed to load assigned drives');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/feedback/history');
      setFullHistory(res.data || []);
    } catch (error) {
       console.error("Failed to load history", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // --- POOL LOGIC ---
  const lockCandidateForEvaluation = async (app) => {
    try {
      const res = await api.post('/feedback/lock', { applicationId: app.id });
      setEvaluatingCandidate(app);
      setEvalHistory(res.data.history || []);
      setExpandedHistoryDriveId(null);
      setFeedbackData(initialFeedbackData);
      
      setDrives(prevDrives => prevDrives.map(d => {
         if (d.id === selectedDrive?.id) {
           return {
             ...d,
             applications: d.applications.map(a => a.id === app.id ? {...a, status: 'in_interview'} : a)
           };
         }
         return d;
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Candidate busy or unavailable.');
    }
  };

  const unlockCandidate = async () => {
    if (!evaluatingCandidate) return;
    try {
       await api.post('/feedback/unlock', { applicationId: evaluatingCandidate.id });
       setEvaluatingCandidate(null);
       fetchDrives();
    } catch (error) {
       toast.error('Failed to unlock. Refresh the page.');
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!evaluatingCandidate) return;

    const matchRound = selectedDrive.rounds?.find(r => r.round_number === evaluatingCandidate.current_round);
    if (!matchRound) return toast.error('Fatal error: Round config not found in drive mapping.');

    try {
      await api.post('/feedback', {
        ...feedbackData,
        candidate_id: evaluatingCandidate.candidate?.id,
        round_id: matchRound.id
      });
      toast.success('Feedback submitted successfully!');
      setFeedbackData(initialFeedbackData);
      setEvaluatingCandidate(null);
      fetchDrives(); 
      fetchHistory(); // refresh history so they see it
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    }
  };

  // --- HISTORY FILTERS LOGIC ---
  const filteredHistory = useMemo(() => {
    let result = fullHistory;
    
    if (filterYear !== 'All') {
      result = result.filter(fb => new Date(fb.createdAt).getFullYear().toString() === filterYear);
    }
    
    if (filterMonth !== 'All') {
      const monthIdx = MONTHS.indexOf(filterMonth);
      result = result.filter(fb => new Date(fb.createdAt).getMonth() === monthIdx);
    }
    
    if (filterCollege !== 'All') {
      result = result.filter(fb => {
         const collegeName = fb.round?.placement?.college_name || fb.round?.placement?.job_role || 'Unknown';
         return collegeName === filterCollege;
      });
    }

    return result;
  }, [fullHistory, filterYear, filterMonth, filterCollege]);

  const uniqueYears = useMemo(() => {
    const years = fullHistory.map(fb => new Date(fb.createdAt).getFullYear());
    return [...new Set(years)].sort((a,b) => b-a);
  }, [fullHistory]);

  const uniqueColleges = useMemo(() => {
    const colleges = fullHistory.map(fb => fb.round?.placement?.college_name || fb.round?.placement?.job_role || 'Unknown');
    return [...new Set(colleges)].filter(Boolean).sort();
  }, [fullHistory]);

  const getDriveStatusProps = (date) => {
      const today = new Date().toISOString().split('T')[0];
      const normDate = (date || '').split('T')[0];
      if (normDate < today) return { label: 'Completed', color: 'bg-slate-700 text-slate-300 border-slate-600', active: false };
      if (normDate === today) return { label: 'Active / Ongoing', color: 'bg-green-500/20 text-green-400 border-green-500/30', active: true };
      return { label: 'Upcoming', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', active: false };
  };

  const historyByPlacement = useMemo(() => {
    const groups = {};
    if (!evalHistory) return [];
    evalHistory.forEach(h => {
       const pRef = h.round?.placement;
       if (!pRef) return;
       if (!groups[pRef.id]) {
         groups[pRef.id] = {
           id: pRef.id,
           name: pRef.type === 'college' ? pRef.college_name : `Walkin: ${pRef.job_role}`,
           date: pRef.date,
           feedbacks: []
         };
       }
       groups[pRef.id].feedbacks.push(h);
    });
    return Object.values(groups);
  }, [evalHistory]);

  if (loading) return <div className="p-20 text-center"><div className="animate-spin h-8 w-8 mx-auto border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col md:flex-row w-full bg-background mt-[-16px]">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 flex-shrink-0 bg-slate-900/50 border-r border-slate-800 md:min-h-screen flex flex-row md:flex-col sticky top-16 md:h-[calc(100vh-64px)] z-10 custom-scrollbar overflow-x-auto overflow-y-hidden md:overflow-y-auto">
        <div className="p-4 md:p-6 pb-2 w-full flex md:flex-col gap-4">
           
           <div className="hidden md:flex items-center gap-3 mb-6 bg-slate-800 p-3 rounded-xl border border-slate-700">
             <div className="bg-secondary/20 p-2 rounded-lg">
               <ClipboardCheck size={28} className="text-secondary"/>
             </div>
             <div>
               <p className="font-bold text-white text-sm">Interviewer Desk</p>
               <p className="text-[10px] text-textMuted uppercase tracking-wider">{user?.name}</p>
             </div>
           </div>
           
           <h2 className="hidden md:block text-[10px] font-bold text-textMuted uppercase tracking-wider mb-2">Workspace</h2>
           
           <nav className="flex md:flex-col gap-2 w-full">
             <button 
               onClick={() => setActiveTab('pool')}
               className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === 'pool' ? 'bg-secondary/20 text-secondary border border-secondary/30 shadow-sm' : 'text-textMuted hover:bg-slate-800 hover:text-white border border-transparent'}`}
             >
               <Users size={18} />
               Evaluation Pool
             </button>
             <button 
               onClick={() => {
                 setActiveTab('upcoming');
                 setEvaluatingCandidate(null);
               }}
               className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === 'upcoming' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-sm' : 'text-textMuted hover:bg-slate-800 hover:text-white border border-transparent'}`}
             >
               <Calendar size={18} />
               Upcoming Drives
             </button>
             <button 
               onClick={() => setActiveTab('history')}
               className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === 'history' ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm' : 'text-textMuted hover:bg-slate-800 hover:text-white border border-transparent'}`}
             >
               <History size={18} />
               Assessment History
             </button>
           </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 p-4 lg:p-8 bg-slate-950/50 h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* POOL TAB */}
          {activeTab === 'pool' && (() => {
            const today = new Date().toISOString().split('T')[0];
            const activeDrives = drives.filter(d => (d.date || '').split('T')[0] === today);
            
            return (
            <div className="animate-fade-in space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-4">
                 <div>
                   <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-secondary to-blue-400">Active Drive Queue</h1>
                   <p className="text-textMuted text-sm">Pick idle candidates strictly from your assigned drives happening today.</p>
                 </div>
              </div>

              <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8`}>
                 {/* Left Col: Drives & Candidates */}
                 <div className={`space-y-6 transition-all duration-300 ${evaluatingCandidate ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
                   
                   <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                      {activeDrives.length === 0 ? <p className="text-textMuted">No active drives assigned for today.</p> : activeDrives.map(d => {
                        const activeCandidates = d.applications?.filter(a => ['applied', 'in_progress', 'hold', 'in_interview'].includes(a.status)) || [];
                        const isSelected = selectedDrive?.id === d.id;
                        const statusProps = getDriveStatusProps(d.date);

                        return (
                          <div 
                            key={d.id} 
                            onClick={() => {
                              setSelectedDrive({...d, activeCandidates});
                              setSearchQuery('');
                            }}
                            className={`flex-shrink-0 w-80 card cursor-pointer transition-all duration-300 border-t-[3px] snap-start relative
                              ${statusProps.active ? 'border-t-green-500' : 'border-t-slate-600'}
                              ${isSelected ? 'bg-slate-800/80 ring-1 ring-secondary/30 scale-100' : 'hover:bg-slate-800/50 scale-95 opacity-80'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-white tracking-wide">{d.college_name || d.job_role || 'Walk-in'}</h3>
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${statusProps.color}`}>
                                {statusProps.label}
                              </span>
                            </div>
                            <p className="text-xs text-textMuted flex items-center gap-1 mb-4"><Calendar size={12}/> {(d.date || '').split('T')[0]}</p>
                            
                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-700">
                              <p className="text-xs text-secondary bg-secondary/10 border border-secondary/20 py-1 px-2 rounded font-semibold">{activeCandidates.length} Candidates Pending</p>
                            </div>
                          </div>
                        );
                      })}
                   </div>

                   {selectedDrive && !evaluatingCandidate && (
                      <div className="card shadow-[0_0_30px_rgba(14,165,233,0.05)] border-secondary/20 animate-slide-up mt-8">
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-700">
                           <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users className="text-secondary" size={20}/> Candidate Roster</h3>
                           <div className="relative">
                             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                             <input 
                               type="text" 
                               placeholder="Search name..." 
                               className="input-field pl-9 py-1.5 text-sm w-full md:w-64 focus:w-full transition-all bg-slate-900 focus:bg-slate-950 border-slate-700" 
                               value={searchQuery}
                               onChange={e => setSearchQuery(e.target.value)}
                             />
                           </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedDrive.activeCandidates
                              .filter(c => c.candidate?.name.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map(app => {
                                const isLockedByMe = app.status === 'in_interview' && app.locked_by_id === user?.id;
                                const isLocked = app.status === 'in_interview' && !isLockedByMe;
                                
                                const isSelectedDriveActive = selectedDrive?.date === new Date().toISOString().split('T')[0];
                                
                                return (
                                  <div key={app.id} className={`p-4 rounded-xl border flex flex-col justify-between h-full transition-all 
                                        ${isLocked ? 'bg-slate-800/20 border-slate-800 opacity-50 grayscale cursor-not-allowed' : !isSelectedDriveActive ? 'bg-slate-800/50 border-slate-700 opacity-80' : isLockedByMe ? 'bg-secondary/5 border-secondary ring-1 ring-secondary/50' : 'bg-slate-800/80 border-slate-700 hover:border-secondary/50 shadow-lg'}`}>
                                     <div>
                                        <h4 className="font-bold text-lg text-white">{app.candidate?.name}</h4>
                                        <div className="mt-2 space-y-1">
                                           <p className="text-xs flex items-center gap-2 text-textMuted"><Clock size={12}/> Application Status: <span className={isLockedByMe ? 'text-secondary font-bold' : ''}>{app.status}</span></p>
                                        </div>
                                        <span className="inline-block mt-3 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                                          Stage: Round {app.current_round}
                                        </span>
                                     </div>
                                     <button 
                                        onClick={() => lockCandidateForEvaluation(app)}
                                        disabled={isLocked || !isSelectedDriveActive}
                                        className={`mt-5 py-2 w-full text-sm font-semibold rounded-lg flex justify-center items-center gap-2 transition-all
                                           ${(isLocked || !isSelectedDriveActive) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : isLockedByMe ? 'bg-secondary hover:bg-secondary/80 text-white shadow-lg shadow-secondary/20' : 'bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20'}`}
                                     >
                                        {isLocked ? <><Lock size={14}/> Busy</> : !isSelectedDriveActive ? <><Lock size={14}/> Drive Inactive</> : isLockedByMe ? <><PlayCircle size={14}/> Resume Evaluation</> : 'Start Interaction'}
                                     </button>
                                  </div>
                                );
                            })}
                            
                            {selectedDrive.activeCandidates.length === 0 && (
                              <div className="col-span-full py-16 text-center text-textMuted border border-dashed border-slate-700 rounded-xl bg-slate-800/30">
                                 <Users size={40} className="mx-auto mb-3 opacity-30"/>
                                 <p className="font-medium text-slate-300">No candidates available.</p>
                                 <p className="text-sm mt-1">Wait for candidates to apply or advance to your round.</p>
                              </div>
                            )}
                         </div>
                      </div>
                   )}
                 </div>

                 {/* Right Col: Evaluation Form */}
                 {evaluatingCandidate && (
                   <div className="lg:col-span-8 space-y-6 animate-slide-up">
                     <div className="card bg-slate-900 border-secondary shadow-[0_0_40px_rgba(14,165,233,0.1)]">
                       <div className="flex flex-col md:flex-row justify-between md:items-start border-b border-slate-700 pb-4 mb-6 gap-4">
                          <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                              {evaluatingCandidate.candidate?.name} 
                              <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded uppercase tracking-wider border border-red-500/30 animate-pulse flex items-center gap-1">
                                <Lock size={10}/> Locked
                              </span>
                            </h2>
                            <p className="text-textMuted text-sm font-medium mt-1">Stage: Round <span className="text-secondary">{evaluatingCandidate.current_round}</span> of {selectedDrive?.number_of_rounds}</p>
                          </div>
                          <button onClick={unlockCandidate} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
                            <XCircle size={14}/> Cancel & Relinquish Lock
                          </button>
                       </div>

                       {/* History Section Grouped by Drive */}
                       {historyByPlacement.length > 0 && (
                         <div className="mb-8 p-5 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                            <h3 className="font-semibold text-white flex items-center gap-2 tracking-wide"><History size={16} className="text-primary"/> Historical Context Drives</h3>
                            <div className="space-y-3">
                              {historyByPlacement.map(group => (
                                <div key={group.id} className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/40">
                                  <button 
                                    type="button"
                                    onClick={() => setExpandedHistoryDriveId(expandedHistoryDriveId === group.id ? null : group.id)}
                                    className={`w-full flex items-center justify-between p-3 text-sm font-semibold transition-colors ${expandedHistoryDriveId === group.id ? 'bg-primary/20 text-primary' : 'hover:bg-slate-800 text-slate-300'}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Briefcase size={14}/>
                                      <span className="text-left font-bold">{group.name}</span>
                                      {group.feedbacks[0]?.round?.placement?.date && (
                                        <span className="text-textMuted text-xs font-normal ml-2 flex items-center gap-1.5 opacity-80 hidden md:flex">
                                           | <Calendar size={12}/> {group.feedbacks[0].round.placement.date} 
                                           | <MapPin size={12}/> {group.feedbacks[0].round.placement.location}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-1 rounded">{group.feedbacks.length} Rounds Evaluated</span>
                                  </button>
                                  
                                  {expandedHistoryDriveId === group.id && (
                                    <div className="p-4 bg-slate-950/50 space-y-4 border-t border-primary/20">
                                      {group.feedbacks.map(h => (
                                        <div key={h.id} className="border-l-2 border-primary/50 pl-4 py-1">
                                           <div className="flex flex-wrap items-center gap-2 mb-2">
                                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-700 text-slate-300">Round {h.round?.round_number}</span>
                                              <span className={`text-[10px] uppercase font-bold tracking-wider ${h.result === 'selected' ? 'text-green-400' : 'text-orange-400'}`}>Result: {h.result}</span>
                                              {h.interviewer && (
                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider ml-auto bg-slate-800 px-2 py-0.5 rounded">
                                                  Assessed By: {h.interviewer.name}
                                                </span>
                                              )}
                                           </div>
                                           <p className="text-sm text-slate-300 font-medium mb-3 border-b border-slate-700/50 pb-2">Task: {h.question_asked}</p>
                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                              <div className="bg-green-500/5 p-3 rounded-lg border border-green-500/10">
                                                  <span className="text-green-500/50 font-semibold uppercase tracking-wider block mb-1">Public Feedback</span>
                                                  {h.public_feedback}
                                              </div>
                                              <div className="bg-orange-500/5 p-3 rounded-lg border border-orange-500/10">
                                                  <span className="text-orange-500/50 font-semibold uppercase tracking-wider block mb-1">Private Notes</span>
                                                  {h.private_feedback}
                                              </div>
                                           </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                         </div>
                       )}

                       {/* Current Evaluation Form */}
                       <form onSubmit={submitFeedback} className="space-y-6 pt-2">
                          <div>
                            <h3 className="font-bold text-lg text-white mb-1">Current Assessment</h3>
                            <p className="text-xs text-secondary py-1 px-2 bg-secondary/10 border border-secondary/20 inline-block rounded font-medium">Criteria: {selectedDrive?.rounds?.find(r => r.round_number === evaluatingCandidate.current_round)?.criteria || 'General'}</p>
                          </div>

                          <div className="space-y-5 border-l-4 border-secondary pl-5 py-2">
                             <div>
                               <label className="label text-white">Question / Task Given</label>
                               <input required className="input-field bg-slate-800 placeholder:text-slate-600 focus:border-secondary/50 text-white" placeholder="e.g. System Design Strategy, Coding Task Details..." value={feedbackData.question_asked} onChange={e => setFeedbackData({...feedbackData, question_asked: e.target.value})} />
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                               <div>
                                 <label className="label flex items-center gap-2 text-green-400">
                                   <MessageSquare size={14}/> Public Candidate Feedback
                                 </label>
                                 <textarea rows="4" required className="input-field bg-slate-800 border-green-500/20 focus:border-green-500/50 text-white resize-y" placeholder="Constructive feedback summarizing performance..." value={feedbackData.public_feedback} onChange={e => setFeedbackData({...feedbackData, public_feedback: e.target.value})}></textarea>
                               </div>

                               <div>
                                 <label className="label flex items-center gap-2 text-orange-400">
                                   <Lock size={14}/> Interviewer Private Notes
                                 </label>
                                 <textarea rows="4" required className="input-field bg-slate-800 border-orange-500/20 focus:border-orange-500/50 text-white resize-y" placeholder="Candid notes strictly for internal HR assessment..." value={feedbackData.private_feedback} onChange={e => setFeedbackData({...feedbackData, private_feedback: e.target.value})}></textarea>
                               </div>
                             </div>
                          </div>

                          <div className="pt-4 mt-6 border-t border-slate-700/50">
                             <label className="label text-lg mb-3">Assessment Outcome</label>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <label className={`flex flex-col border-2 rounded-xl p-3 cursor-pointer transition-all duration-200 justify-center items-center h-20 ${feedbackData.result === 'selected' ? 'border-secondary bg-secondary/10' : 'border-slate-700 hover:border-secondary/50 bg-slate-800/50'}`}>
                                   <input type="radio" name="result" value="selected" checked={feedbackData.result === 'selected'} onChange={() => setFeedbackData({...feedbackData, result: 'selected'})} className="sr-only"/>
                                   <span className="font-bold text-center text-sm md:text-base text-secondary">{evaluatingCandidate.current_round >= selectedDrive?.number_of_rounds ? 'Select strictly for Role' : 'Promote to Next Round'}</span>
                                </label>
                                
                                {evaluatingCandidate.current_round < selectedDrive?.number_of_rounds && (
                                  <label className={`flex flex-col border-2 rounded-xl p-3 cursor-pointer transition-all duration-200 justify-center items-center h-20 ${feedbackData.result === 'hold' ? 'border-yellow-500 bg-yellow-500/10' : 'border-slate-700 hover:border-yellow-500/50 bg-slate-800/50'}`}>
                                     <input type="radio" name="result" value="hold" checked={feedbackData.result === 'hold'} onChange={() => setFeedbackData({...feedbackData, result: 'hold'})} className="sr-only"/>
                                     <span className="font-bold text-center text-sm md:text-base text-yellow-500">Flag for Revision/Hold</span>
                                  </label>
                                )}

                                <label className={`flex flex-col border-2 rounded-xl p-3 cursor-pointer transition-all duration-200 justify-center items-center h-20 ${feedbackData.result === 'rejected' ? 'border-red-500 bg-red-500/10' : 'border-slate-700 hover:border-red-500/50 bg-slate-800/50'}`}>
                                   <input type="radio" name="result" value="rejected" checked={feedbackData.result === 'rejected'} onChange={() => setFeedbackData({...feedbackData, result: 'rejected'})} className="sr-only"/>
                                   <span className="font-bold text-center text-sm md:text-base text-red-500">Reject Profile</span>
                                </label>
                             </div>
                           </div>

                           <div className="pt-8 flex justify-end">
                             <button type="submit" disabled={feedbackData.result === 'pending' || !evaluatingCandidate} className="w-full md:w-auto px-10 py-3 text-sm font-bold bg-secondary hover:bg-secondary/90 text-white rounded-lg shadow-lg shadow-secondary/20 focus:ring-4 focus:ring-secondary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2">
                               <CheckCircle2 size={18}/> Commit Final Feedback
                             </button>
                           </div>
                       </form>
                     </div>
                   </div>
                 )}
              </div>
            </div>
            );
          })()}

          {/* UPCOMING TAB */}
          {activeTab === 'upcoming' && (() => {
             const today = new Date().toISOString().split('T')[0];
             const upcomingDrives = drives.filter(d => (d.date || '').split('T')[0] > today);
             
             return (
              <div className="animate-fade-in space-y-8">
                <div className="flex flex-col border-b border-slate-700 pb-4">
                   <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-yellow-500">Upcoming Drives</h1>
                   <p className="text-textMuted text-sm">Drives scheduled for the future. You cannot evaluate candidates yet.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   {upcomingDrives.length === 0 ? <p className="text-textMuted">No upcoming drives assigned.</p> : upcomingDrives.map(d => (
                      <div key={d.id} className="card bg-slate-800/50 border-t-4 border-t-orange-500 hover:scale-[1.02] transition-transform">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-white text-lg truncate max-w-[200px]" title={d.college_name || d.job_role || 'Walk-in'}>{d.college_name || d.job_role || 'Walk-in'}</h3>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border bg-orange-500/10 text-orange-400 border-orange-500/30">Upcoming</span>
                        </div>
                        <p className="text-primary font-medium text-sm mb-4 truncate">{d.job_role}</p>
                        
                        <div className="space-y-2 mb-5 text-sm text-textMuted">
                          <p className="flex items-center gap-2"><Calendar size={14} className="text-slate-500"/> {(d.date || '').split('T')[0]}</p>
                          <p className="flex items-center gap-2 truncate" title={d.location}><MapPin size={14} className="text-slate-500"/> {d.location}</p>
                        </div>
                        
                        <div className="mt-auto pt-3 border-t border-slate-700/50 flex items-center justify-between">
                           <span className="text-xs font-medium px-2 py-1 bg-slate-800 text-slate-300 rounded border border-slate-600 shadow-inner">
                             {d.applications?.length || 0} Registered
                           </span>
                           <span className="text-xs font-semibold px-2 py-1 text-orange-400/80">
                             Wait for Date
                           </span>
                        </div>
                      </div>
                   ))}
                </div>
              </div>
             );
          })()}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
             <div className="animate-fade-in space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white">Assessment History</h1>
                    <p className="text-textMuted text-sm">A centralized log of all your past interviews and notes.</p>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm text-slate-300 font-medium">
                     Total Assessments: <span className="text-primary font-bold ml-1">{filteredHistory.length}</span>
                  </div>
                </div>

                {/* Filter Panel */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full relative">
                    <label className="text-xs font-semibold text-textMuted uppercase mb-1 flex items-center gap-1"><Filter size={12}/> Analysis Year</label>
                    <select className="input-field bg-slate-800 border-slate-700 text-sm" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                      <option value="All">All Years</option>
                      {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="text-xs font-semibold text-textMuted uppercase mb-1 block">Analysis Month</label>
                    <select className="input-field bg-slate-800 border-slate-700 text-sm" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                      <option value="All">All Months</option>
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex-[2] w-full">
                    <label className="text-xs font-semibold text-textMuted uppercase mb-1 block">Placement/Company</label>
                    <select className="input-field bg-slate-800 border-slate-700 text-sm" value={filterCollege} onChange={e => setFilterCollege(e.target.value)}>
                      <option value="All">All Drives & Walk-ins</option>
                      {uniqueColleges.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* History Table */}
                <div className="card p-0 overflow-hidden bg-slate-900 border-slate-700 shadow-xl">
                   {historyLoading ? (
                      <div className="p-20 text-center"><div className="animate-spin h-6 w-6 mx-auto border-4 border-primary border-t-transparent rounded-full"></div></div>
                   ) : filteredHistory.length === 0 ? (
                      <div className="p-16 text-center">
                         <History className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                         <p className="text-slate-400 font-medium text-lg">No historical data aligns with your criteria.</p>
                         <p className="text-slate-500 text-sm mt-1">Adjust filters or conduct more interviews.</p>
                      </div>
                   ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-800/80 text-textMuted uppercase border-b border-slate-700 text-[11px] tracking-wider">
                            <tr>
                              <th className="px-5 py-4 font-bold">Execution Date</th>
                              <th className="px-5 py-4 font-bold">Candidate Details</th>
                              <th className="px-5 py-4 font-bold">Placement / Organization</th>
                               <th className="px-5 py-4 font-bold">Assessment Details & Feedback</th>
                              <th className="px-5 py-4 font-bold text-center">Assessor Verdict</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/50">
                             {filteredHistory.map(fb => {
                               const dateObj = new Date(fb.createdAt);
                               const formattedDate = dateObj.toLocaleDateString('en-GB') + ' ' + dateObj.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
                               const collegeName = fb.round?.placement?.college_name || fb.round?.placement?.job_role || 'Unknown';
                               
                               return (
                               <tr key={fb.id} className="hover:bg-slate-800/40 transition-colors group align-top">
                                 <td className="px-5 py-4">
                                   <span className="text-slate-300 font-medium whitespace-nowrap">{formattedDate}</span>
                                 </td>
                                 <td className="px-5 py-4">
                                   <div className="font-bold text-white">{fb.candidate?.name || 'Deleted Candidate'}</div>
                                   <div className="text-[10px] uppercase text-textMuted mt-0.5 tracking-wider font-semibold">Stage Evaluated: Round {fb.round?.round_number}</div>
                                 </td>
                                 <td className="px-5 py-4">
                                   <div className="text-slate-300 font-semibold truncate max-w-[200px]">{collegeName}</div>
                                   <div className="text-xs text-textMuted mt-0.5">{fb.round?.placement?.type === 'college' ? 'Drive' : 'Walk-in Open'}</div>
                                 </td>
                                 <td className="px-5 py-4 w-[40%]">
                                   <p className="text-slate-200 font-medium mb-3 border-b border-slate-700 pb-2">Task: {fb.question_asked}</p>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {fb.public_feedback && (
                                        <div className="text-[11px] bg-green-500/5 border border-green-500/10 p-2.5 rounded">
                                          <span className="text-green-500/70 font-bold uppercase tracking-wider block mb-1 text-[9px]">Public Feedback</span>
                                          <span className="text-slate-400 leading-relaxed">{fb.public_feedback}</span>
                                        </div>
                                      )}
                                      {fb.private_feedback && (
                                        <div className="text-[11px] bg-orange-500/5 border border-orange-500/10 p-2.5 rounded">
                                          <span className="text-orange-500/70 font-bold uppercase tracking-wider block mb-1 text-[9px]">Private Notes</span>
                                          <span className="text-slate-400 leading-relaxed">{fb.private_feedback}</span>
                                        </div>
                                      )}
                                   </div>
                                 </td>
                                 <td className="px-5 py-4 text-center">
                                   <span className={`inline-block px-3 py-1 text-[11px] uppercase font-bold tracking-wider rounded border
                                      ${fb.result === 'selected' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                        fb.result === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}
                                   `}>
                                     {fb.result === 'selected' ? 'Selected / Passed' : fb.result}
                                   </span>
                                 </td>
                               </tr>
                             )})}
                          </tbody>
                        </table>
                      </div>
                   )}
                </div>
             </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default InterviewerDashboard;
