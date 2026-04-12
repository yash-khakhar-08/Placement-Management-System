import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, UserCircle, MapPin, Calendar, ExternalLink, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { toast } from 'react-toastify';

const CandidateTracker = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [placement, setPlacement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedAppId, setExpandedAppId] = useState(null);

  useEffect(() => {
    fetchPlacementData();
  }, [id]);

  const fetchPlacementData = async () => {
    try {
       const { data } = await api.get(`/placements/${id}`);
       setPlacement(data);
    } catch (error) {
       toast.error('Failed to load placement data');
       navigate('/admin');
    } finally {
       setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><div className="animate-spin h-8 w-8 mx-auto border-4 border-primary border-t-transparent rounded-full"></div></div>;
  if (!placement) return <div>Placement not found</div>;

  const applications = placement.applications || [];
  
  // Distribute candidates effectively
  const getApplicationsByStatus = (roundNum, statusList) => {
    return applications.filter(app => {
      if (statusList.includes('rejected') && app.status === 'rejected') return true;
      if (statusList.includes('selected') && app.status === 'selected') return true;
      if (statusList.includes('in_progress') && app.current_round === roundNum && app.status !== 'rejected' && app.status !== 'selected') return true;
      return false;
    });
  };

  // We actually shouldn't map by "Round X" array anymore since multiple interviewers exist, but Kanban columns map fine logically for admins.
  const rounds = placement.rounds || [];
  const columns = rounds.map(r => ({
    title: `Round ${r.round_number}`,
    criteria: r.criteria,
    apps: getApplicationsByStatus(r.round_number, ['applied', 'in_progress', 'hold', 'in_interview'])
  }));

  const rejectedApps = applications.filter(app => app.status === 'rejected');
  const selectedApps = applications.filter(app => app.status === 'selected');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
         <div className="flex items-center gap-4">
           <button onClick={() => navigate('/admin')} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
             <ArrowLeft size={20} className="text-textMuted" />
           </button>
           <div>
             <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
               {placement.type === 'college' ? placement.college_name : placement.job_role} Candidate Tracker
             </h2>
             <p className="text-textMuted text-sm mt-1 flex items-center gap-4">
               <span className="flex items-center gap-1"><MapPin size={14} /> {placement.location}</span>
               <span className="flex items-center gap-1"><Calendar size={14} /> {placement.date}</span>
             </p>
           </div>
         </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x pr-8 min-h-[75vh]">
        {/* Kanban Board Columns generated per Round */}
        {columns.map((col, idx) => (
          <div key={idx} className="flex-shrink-0 w-[22rem] bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden snap-start flex flex-col max-h-[75vh]">
            <div className="bg-slate-800 p-4 border-b border-slate-700">
               <h3 className="font-bold text-lg">{col.title}</h3>
               {col.criteria && <p className="text-xs text-textMuted mt-1 line-clamp-2">{col.criteria}</p>}
               <span className="inline-block mt-2 text-xs font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/20">
                 {col.apps.length} Active Candidates
               </span>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
               {col.apps.length === 0 ? (
                 <p className="text-center text-sm text-slate-500 py-4">No candidates active in this round</p>
               ) : (
                 col.apps.map(app => (
                   <CandidateCard 
                      key={app.id} 
                      app={app} 
                      isExpanded={expandedAppId === app.id} 
                      onToggle={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)} 
                      placementRounds={rounds}
                   />
                 ))
               )}
            </div>
          </div>
        ))}

        {/* Selected Column */}
        <div className="flex-shrink-0 w-[22rem] bg-green-900/10 border border-green-500/20 rounded-xl overflow-hidden snap-start flex flex-col max-h-[75vh]">
            <div className="bg-green-500/10 p-4 border-b border-green-500/20">
               <h3 className="font-bold text-lg text-green-400">Selected for Role</h3>
               <span className="inline-block mt-2 text-xs font-semibold bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/20">
                 {selectedApps.length} Candidates
               </span>
            </div>
            <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                {selectedApps.map(app => (
                    <CandidateCard 
                        key={app.id} 
                        app={app} 
                        isExpanded={expandedAppId === app.id} 
                        onToggle={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)} 
                        placementRounds={rounds}
                     />
                ))}
            </div>
        </div>

        {/* Rejected Column */}
        <div className="flex-shrink-0 w-[22rem] bg-red-900/10 border border-red-500/20 rounded-xl overflow-hidden snap-start flex flex-col max-h-[75vh]">
            <div className="bg-red-500/10 p-4 border-b border-red-500/20">
               <h3 className="font-bold text-lg text-red-500">Rejected</h3>
               <span className="inline-block mt-2 text-xs font-semibold bg-red-500/20 text-red-500 px-2 py-0.5 rounded border border-red-500/20">
                 {rejectedApps.length} Candidates
               </span>
            </div>
            <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                {rejectedApps.map(app => (
                    <CandidateCard 
                        key={app.id} 
                        app={app} 
                        isExpanded={expandedAppId === app.id} 
                        onToggle={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)} 
                        placementRounds={rounds}
                     />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

// Extracted CandidateCard Component to handle complex expanded state
const CandidateCard = ({ app, isExpanded, onToggle, placementRounds = [] }) => {
  const allFeedbacks = app.candidate?.feedbacks || [];
  
  // Filter feedbacks to only those belonging to the current placement's rounds
  const placementRoundIds = placementRounds.map(r => r.id);
  const feedbacks = allFeedbacks.filter(fb => placementRoundIds.includes(fb.round_id));

  return (
    <div className={`bg-slate-900 border ${app.status === 'in_interview' ? 'border-primary/50 ring-1 ring-primary/50' : 'border-slate-700'} p-3 rounded-lg shadow hover:border-slate-500 transition-all`}>
      <div className="flex gap-3 justify-between items-start cursor-pointer" onClick={onToggle}>
        <div className="flex gap-3 items-start flex-1 min-w-0">
          <UserCircle size={32} className={`${app.status === 'selected' ? 'text-green-500/70' : app.status === 'rejected' ? 'text-red-500/50' : 'text-slate-400'} shrink-0`} />
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold text-white truncate ${app.status === 'rejected' ? 'line-through opacity-70' : ''}`}>{app.candidate.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
               <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  app.status === 'in_interview' ? 'bg-primary/20 text-primary' :
                  app.status === 'hold' ? 'bg-orange-500/20 text-orange-400' : 
                  app.status === 'selected' ? 'bg-green-500/20 text-green-400' : 
                  app.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 
                  'bg-blue-500/20 text-blue-400'
               }`}>
                 {app.status.replace('_', ' ')}
               </span>
               {app.status === 'in_interview' && <Lock size={10} className="text-primary"/>}
            </div>
          </div>
        </div>
        <button className="text-slate-500 hover:text-white p-1">
          {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-slate-800 animate-slide-up">
           
           <div className="flex justify-between items-center mb-3">
             <span className="text-xs text-slate-400 flex flex-col">
               <span>Phone: {app.candidate.phone}</span>
               <span>Email: {app.candidate.user?.email || 'N/A'}</span>
             </span>
             {app.custom_resume_url && (
               <a href={`http://localhost:5000/${app.custom_resume_url}`} target="_blank" rel="noreferrer" className="text-xs text-primary bg-primary/10 px-2 py-1 rounded hover:underline flex items-center gap-1">
                 Resume <ExternalLink size={12} />
               </a>
             )}
           </div>

           {/* Feedback History Block */}
           <div className="space-y-3 mt-4">
             <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluation History</h5>
             {feedbacks.length === 0 ? (
               <p className="text-xs text-slate-600 italic">No feedback submitted yet.</p>
             ) : (
               feedbacks.map(fb => {
                 const matchRound = placementRounds.find(r => r.id === fb.round_id);
                 return (
                   <div key={fb.id} className="bg-slate-800/50 p-3 rounded border border-slate-700">
                     <div className="flex flex-wrap justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] text-white font-medium bg-slate-700 px-1.5 py-0.5 rounded border border-slate-600">
                             Round {matchRound ? matchRound.round_number : fb.round_id}
                           </span>
                           {fb.interviewer && (
                             <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                               By: {fb.interviewer.name}
                             </span>
                           )}
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${fb.result === 'selected' ? 'text-green-400' : fb.result==='rejected'?'text-red-400':'text-orange-400'}`}>{fb.result}</span>
                     </div>
                     <p className="text-xs text-slate-300 mt-2"><span className="text-primary/70 font-semibold mr-1">Task:</span> {fb.question_asked}</p>
                     <p className="text-[11px] text-green-300/80 mt-1.5"><span className="text-green-500/80 font-bold mr-1">Public:</span> {fb.public_feedback}</p>
                     <p className="text-[11px] text-slate-400 mt-0.5"><span className="text-orange-400/80 font-bold mr-1">Private:</span> {fb.private_feedback}</p>
                   </div>
                 )
               })
             )}
           </div>
        </div>
      )}
    </div>
  );
};

export default CandidateTracker;
