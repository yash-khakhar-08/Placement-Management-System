import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Upload, FileText, CheckCircle2, Clock, XCircle, AlertCircle, MessageSquare, UserCircle, Briefcase, Building, ChevronRight, X, Phone, User as UserIcon, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const CandidateDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({ total: 0, progressive: 0 });
  const [loading, setLoading] = useState(true);
  const { user, updateUser } = useAuth();
  
  // Tabs: 'applications', 'profile'
  const [activeTab, setActiveTab] = useState('applications');

  // Profile Form State
  const [file, setFile] = useState(null);
  const [phone, setPhone] = useState(user?.candidateProfile?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Application Modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalTab, setModalTab] = useState('company'); // 'company', 'submission', 'feedback'

  useEffect(() => {
    fetchApplications();
    if(user?.candidateProfile?.phone) {
        setPhone(user.candidateProfile.phone);
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/candidates/applications');
      setApplications(res.data.applications || []);
      setFeedbacks(res.data.feedbacks || []);
      
      const total = res.data.applications?.length || 0;
      const progressive = res.data.applications?.filter(app => ['in_progress', 'hold', 'in_interview'].includes(app.status)).length || 0;
      setStats({ total, progressive });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file to upload');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const loadingToast = toast.loading('Uploading default resume...');
      const res = await api.post('/candidates/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.update(loadingToast, { render: 'Default resume uploaded successfully', type: 'success', isLoading: false, autoClose: 3000 });
      setFile(null);

      // Automatically sync context and UI
      const updatedUser = {...user};
      if (updatedUser.candidateProfile) {
         updatedUser.candidateProfile.resume_url = res.data.resume_url;
      } else {
         updatedUser.candidateProfile = { resume_url: res.data.resume_url };
      }
      updateUser(updatedUser);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    }
  };

  const handleUpdateProfile = async (e) => {
     e.preventDefault();
     try {
       setIsUpdatingProfile(true);
       await api.put('/candidates/profile', { phone });
       toast.success('Profile updated successfully');

       // Automatically sync context and UI
       const updatedUser = {...user};
       if (updatedUser.candidateProfile) {
          updatedUser.candidateProfile.phone = phone;
       } else {
          updatedUser.candidateProfile = { phone };
       }
       updateUser(updatedUser);
     } catch (error) {
       toast.error(error.response?.data?.message || 'Update failed');
     } finally {
       setIsUpdatingProfile(false);
     }
  };

  const openAppModal = (app) => {
    setSelectedApp(app);
    setModalTab('company');
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'selected': return <CheckCircle2 className="text-green-500" />;
      case 'rejected': return <XCircle className="text-red-500" />;
      case 'hold': return <AlertCircle className="text-yellow-500" />;
      default: return <Clock className="text-blue-500" />;
    }
  };

  if (loading) return <div className="p-20 text-center"><div className="animate-spin h-8 w-8 mx-auto border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="min-h-[calc(100vh-64px)] flex w-full bg-background mt-[-16px]">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 bg-slate-900/50 border-r border-slate-800 min-h-screen hidden md:flex flex-col sticky top-16 h-[calc(100vh-64px)]">
        <div className="p-6 pb-2">
           <div className="flex items-center gap-3 mb-6 bg-slate-800 p-3 rounded-xl border border-slate-700">
             <UserCircle size={32} className="text-primary"/>
             <div>
               <p className="font-bold text-white text-sm">{user?.name}</p>
               <p className="text-xs text-textMuted uppercase">Candidate</p>
             </div>
           </div>
           
           <h2 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4">Dashboard</h2>
           <nav className="space-y-2">
             <button 
               onClick={() => setActiveTab('applications')}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'applications' ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm' : 'text-textMuted hover:bg-slate-800 hover:text-white'}`}
             >
               <Briefcase size={18} />
               My Applications
             </button>
             <button 
               onClick={() => setActiveTab('profile')}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'profile' ? 'bg-secondary/20 text-secondary border border-secondary/30 shadow-sm' : 'text-textMuted hover:bg-slate-800 hover:text-white'}`}
             >
               <UserIcon size={18} />
               Profile Settings
             </button>
           </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 lg:p-8 bg-slate-950/50">
        <div className="max-w-5xl mx-auto space-y-6">
           
           {/* MY APPLICATIONS VIEW */}
           {activeTab === 'applications' && (
             <div className="animate-fade-in space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-800">
                  <div>
                    <h1 className="text-2xl font-bold text-white">Your Applications</h1>
                    <p className="text-textMuted text-sm mt-1">Track progress and access detailed interview feedback.</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 flex flex-col items-center justify-center shadow-lg">
                      <span className="text-2xl font-bold text-primary">{stats.total}</span>
                      <span className="text-[10px] text-textMuted uppercase tracking-wide mt-1">Applied</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 flex flex-col items-center justify-center shadow-lg">
                      <span className="text-2xl font-bold text-green-400">{stats.progressive}</span>
                      <span className="text-[10px] text-textMuted uppercase tracking-wide mt-1">In Progress</span>
                    </div>
                  </div>
                </div>

                {applications.length === 0 ? (
                  <div className="text-center py-20 bg-slate-800/20 border border-slate-700/50 border-dashed rounded-xl">
                    <FileText size={48} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-lg font-medium text-slate-300">No applications yet</p>
                    <p className="text-sm text-textMuted mt-1">Explore available walk-in jobs or college drives to apply.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                     {applications.map(app => (
                        <div key={app.id} 
                             onClick={() => openAppModal(app)}
                             className="card cursor-pointer hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(14,165,233,0.1)] group bg-slate-900/60 p-5 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                               <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                  <Building size={24} className={app.placement?.type === 'college' ? 'text-primary' : 'text-secondary'}/>
                               </div>
                               <div>
                                  <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{app.placement?.job_role}</h3>
                                  <p className="text-sm text-textMuted flex items-center gap-2 mt-1">
                                    {app.placement?.type === 'college' ? app.placement.college_name : app.placement?.location} 
                                    <span className="text-slate-600">•</span> 
                                    Applied on {new Date(app.createdAt).toLocaleDateString()}
                                  </p>
                               </div>
                            </div>

                            <div className="flex items-center gap-6">
                               <div className="hidden md:flex flex-col items-end">
                                  <p className="text-xs text-textMuted uppercase tracking-wider font-semibold mb-1">Status</p>
                                  <div className="flex items-center gap-1.5 font-medium">
                                     {getStatusIcon(app.status)}
                                     <span className={`text-sm
                                       ${app.status === 'selected' ? 'text-green-400' : ''}
                                       ${app.status === 'rejected' ? 'text-red-400' : ''}
                                       ${app.status === 'hold' ? 'text-yellow-400' : ''}
                                       ${app.status === 'applied' || app.status === 'in_progress' ? 'text-blue-400' : ''}
                                     `}>{app.status === 'in_progress' ? 'In Progress' : app.status.replace('_', ' ')}</span>
                                  </div>
                               </div>
                               <div className="bg-slate-800 p-2 rounded-full border border-slate-700 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all text-textMuted">
                                  <ChevronRight size={20} />
                               </div>
                            </div>
                        </div>
                     ))}
                  </div>
                )}
             </div>
           )}

           {/* PROFILE SETTINGS VIEW */}
           {activeTab === 'profile' && (
             <div className="animate-fade-in space-y-6">
                <div className="pb-4 border-b border-slate-800">
                   <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
                   <p className="text-textMuted text-sm mt-1">Manage your professional identity.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Personal Info Form */}
                   <div className="card bg-slate-900 border-slate-700 shadow-xl">
                      <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><UserIcon size={20} className="text-primary"/> Personal Information</h3>
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                         <div>
                            <label className="text-sm font-medium text-slate-400 ml-1">Full Name</label>
                            <input disabled value={user?.name || ''} className="input-field bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed" />
                            <p className="text-[10px] text-slate-600 mt-1 ml-1">Name cannot be changed after registration.</p>
                         </div>
                         <div>
                            <label className="text-sm font-medium text-slate-400 ml-1 flex items-center gap-1.5"><Mail size={14}/> Email Address</label>
                            <input disabled value={user?.email || ''} className="input-field bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed" />
                         </div>
                         <div>
                            <label className="text-sm font-medium text-slate-400 ml-1 flex items-center gap-1.5"><Phone size={14}/> Phone Number</label>
                            <input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +1 234 567 890" className="input-field bg-slate-800 border-slate-600 focus:border-primary text-white" />
                         </div>
                         <button type="submit" disabled={isUpdatingProfile} className="btn-primary w-full mt-2 shadow-lg shadow-primary/20">{isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}</button>
                      </form>
                   </div>

                   {/* Resume Upload Form */}
                   <div className="card bg-slate-900 border-slate-700 shadow-xl">
                      <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><FileText size={20} className="text-secondary"/> Default Resume</h3>
                      <form onSubmit={handleUpload} className="space-y-4">
                         <div className="p-4 border border-slate-700 bg-slate-800/50 rounded-lg flex items-center justify-between mb-4">
                            <span className="text-sm text-slate-300">Status</span>
                            {user?.candidateProfile?.resume_url ? 
                              <span className="text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/20 px-2 py-1 rounded">Uploaded</span> : 
                              <span className="text-xs font-semibold bg-red-500/20 text-red-500 border border-red-500/20 px-2 py-1 rounded">Missing</span>
                            }
                         </div>

                         <div className="border-2 border-dashed border-slate-600 hover:border-secondary/50 transition-colors p-6 rounded-xl flex flex-col items-center justify-center gap-3 bg-slate-800/30 group relative">
                           <Upload className="w-8 h-8 text-slate-400 group-hover:text-secondary transition-colors" />
                           <div className="text-center">
                             <p className="text-sm font-medium text-slate-300">
                               <span className="text-secondary cursor-pointer hover:underline">Click to browse</span> or drag & drop
                             </p>
                             <p className="text-xs text-slate-500 mt-1">PDF or DOCX (Max 5MB)</p>
                           </div>
                           <input 
                             type="file" 
                             accept=".pdf,.doc,.docx"
                             onChange={(e) => setFile(e.target.files[0])}
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                           />
                         </div>
                         
                         {file && (
                           <div className="flex items-center gap-2 p-3 bg-slate-800 text-sm border border-slate-600 rounded">
                             <FileText size={16} className="text-secondary" />
                             <span className="truncate flex-1 text-white">{file.name}</span>
                           </div>
                         )}

                         <button 
                           type="submit" 
                           className="btn-primary w-full disabled:bg-slate-800 bg-secondary hover:bg-secondary/80 focus:ring-secondary/50 shadow-lg shadow-secondary/20 disabled:text-slate-500"
                           disabled={!file}
                         >
                           Upload New Resume
                         </button>
                      </form>
                   </div>
                </div>
             </div>
           )}

        </div>
      </main>

      {/* APPLICATION DEEP DIVE MODAL */}
      {selectedApp && (
         <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
               
               {/* Modal Header */}
               <div className="bg-slate-800/50 border-b border-slate-700 p-6 flex items-start justify-between">
                  <div className="flex gap-4 items-center">
                     <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <Building size={32} className="text-primary"/>
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold text-white">{selectedApp.placement?.job_role}</h2>
                        <p className="text-textMuted font-medium text-sm mt-1">{selectedApp.placement?.type === 'college' ? selectedApp.placement.college_name : selectedApp.placement?.location}</p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedApp(null)} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                     <X size={24} />
                  </button>
               </div>

               {/* Modal Content layout */}
               <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                  
                  {/* Internal Sidebar */}
                  <div className="w-full md:w-56 bg-slate-800/30 border-r border-slate-700 flex flex-row md:flex-col p-4 gap-2 overflow-x-auto md:overflow-y-auto">
                     <button 
                       onClick={() => setModalTab('company')} 
                       className={`flex-1 md:flex-none text-left px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap ${modalTab==='company'?'bg-primary/20 text-primary border border-primary/30':'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                     >
                       <Building size={16} className="inline mr-2"/> Company Info
                     </button>
                     <button 
                       onClick={() => setModalTab('feedback')} 
                       className={`flex-1 md:flex-none text-left px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap ${modalTab==='feedback'?'bg-primary/20 text-primary border border-primary/30':'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                     >
                       <MessageSquare size={16} className="inline mr-2"/> Interview Feedback
                     </button>
                     <button 
                       onClick={() => setModalTab('submission')} 
                       className={`flex-1 md:flex-none text-left px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap ${modalTab==='submission'?'bg-primary/20 text-primary border border-primary/30':'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                     >
                       <FileText size={16} className="inline mr-2"/> My Submission
                     </button>
                  </div>

                  {/* Internal Pane */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-900 custom-scrollbar">
                     {modalTab === 'company' && (
                        <div className="animate-fade-in space-y-6">
                           <h3 className="text-xl font-bold border-b border-slate-700 pb-2 mb-4">Job Description & Context</h3>
                           <div className="prose prose-invert max-w-none">
                             {selectedApp.placement?.description ? (
                               <p className="whitespace-pre-line text-slate-300 leading-relaxed bg-slate-800/30 p-5 rounded-lg border border-slate-700">
                                 {selectedApp.placement.description}
                               </p>
                             ) : (
                               <div className="text-center py-10 bg-slate-800/20 border border-slate-700 border-dashed rounded-lg text-slate-500">
                                  No detailed company information provided for this role.
                               </div>
                             )}
                           </div>

                           <div className="grid grid-cols-2 gap-4 mt-8">
                              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <p className="text-xs text-textMuted uppercase">Location</p>
                                <p className="font-semibold text-white mt-1">{selectedApp.placement?.location}</p>
                              </div>
                              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <p className="text-xs text-textMuted uppercase">Required Rounds</p>
                                <p className="font-semibold text-white mt-1">{selectedApp.placement?.number_of_rounds} Rounds</p>
                              </div>
                           </div>
                        </div>
                     )}

                     {modalTab === 'feedback' && (() => {
                        const appFeedbacks = feedbacks.filter(fb => {
                            return fb.round?.placement_id === selectedApp.placement_id; 
                        });
                        
                        return (
                          <div className="animate-fade-in space-y-4">
                             <h3 className="text-xl font-bold border-b border-slate-700 pb-2 mb-4">Official Assessor Feedback</h3>
                             {appFeedbacks.length === 0 ? (
                                <div className="text-center py-10 bg-slate-800/20 border border-slate-700 border-dashed rounded-lg text-slate-500">
                                   No official feedback has been recorded for your interviews yet.
                                </div>
                             ) : (
                                <div className="space-y-4">
                                  {appFeedbacks.map(fb => (
                                     <div key={fb.id} className="bg-slate-800/50 p-5 rounded border border-slate-700 relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-1 h-full bg-${fb.result === 'selected' ? 'green-500' : fb.result === 'rejected' ? 'red-500' : 'yellow-500'}`}></div>
                                        <div className="flex justify-between items-start mb-3">
                                           <span className="font-bold text-white bg-slate-700/50 px-3 py-1 rounded text-sm">Round {fb.round?.round_number} Analysis</span>
                                           <span className={`text-[10px] px-2 py-1 rounded uppercase tracking-wider font-bold ${fb.result === 'selected' ? 'bg-green-500/20 text-green-400' : fb.result === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{fb.result}</span>
                                        </div>
                                        <blockquote className="border-l-2 border-slate-600 pl-4 py-1 italic text-slate-300 mt-2 bg-slate-800/30">
                                            &quot;{fb.public_feedback}&quot;
                                        </blockquote>
                                        <div className="mt-4 flex justify-between items-center text-xs text-slate-500">
                                            <span>Issued: {new Date(fb.createdAt).toLocaleDateString()}</span>
                                            <span>Status: Published</span>
                                        </div>
                                     </div>
                                  ))}
                                </div>
                             )}
                          </div>
                        )
                     })()}

                     {modalTab === 'submission' && (
                        <div className="animate-fade-in space-y-6">
                           <h3 className="text-xl font-bold border-b border-slate-700 pb-2 mb-4">Application Details</h3>
                           <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                              <h4 className="font-semibold text-white mb-4">Resume Submitted</h4>
                              {selectedApp.custom_resume_url ? (
                                <div className="flex items-center justify-between bg-slate-900 border border-slate-700 p-4 rounded-xl">
                                   <div className="flex items-center gap-3">
                                      <FileText size={24} className="text-secondary"/>
                                      <div>
                                        <p className="font-medium text-white text-sm">Resume Document</p>
                                        <p className="text-xs text-textMuted mt-0.5">Used specific curriculum vitae.</p>
                                      </div>
                                   </div>
                                   <a href={`http://localhost:5000/${selectedApp.custom_resume_url}`} target="_blank" rel="noreferrer" className="text-xs bg-secondary/10 text-secondary hover:bg-secondary hover:text-white px-3 py-1.5 rounded transition-colors font-semibold">
                                      View Document
                                   </a>
                                </div>
                              ) : (
                                <p className="text-slate-500 text-sm italic">No custom resume attached to this application.</p>
                              )}
                           </div>

                           <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                             <h4 className="font-semibold text-white mb-2">Tracking Status</h4>
                             <div className="flex items-center gap-3">
                               {getStatusIcon(selectedApp.status)}
                               <span className="font-medium text-slate-300 capitalize">{selectedApp.status.replace('_', ' ')}</span>
                             </div>
                           </div>
                        </div>
                     )}

                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default CandidateDashboard;
