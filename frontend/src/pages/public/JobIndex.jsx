import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Briefcase, MapPin, Calendar, X, Upload, Key, Users, Star, Award, Heart, ChevronRight, Quote, Globe, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const JobIndex = () => {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myAppliedPlacements, setMyAppliedPlacements] = useState(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();

  // Apply Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [passkey, setPasskey] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const placeRes = await api.get('/placements'); 
        setPlacements(placeRes.data);
        
        if (user && user.role === 'candidate') {
           const myApps = await api.get('/candidates/applications');
           if (myApps.data?.applications) {
              const appliedIds = myApps.data.applications.map(app => app.placement_id);
              setMyAppliedPlacements(new Set(appliedIds));
           }
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleApplyClick = (drive) => {
    if (!user) {
      toast.info('Please log in or register to apply.');
      navigate('/login');
      return;
    }
    if (user.role !== 'candidate') {
      return toast.error('Only candidates can apply.');
    }
    setSelectedDrive(drive);
    setPasskey('');
    setResumeFile(null);
    setShowModal(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (selectedDrive.type === 'college' && !passkey.trim()) {
      return toast.error('Passkey is required for college drives.');
    }

    const formData = new FormData();
    formData.append('placement_id', selectedDrive.id);
    if (selectedDrive.type === 'college') {
      formData.append('passkey', passkey.trim());
    }
    if (resumeFile) {
      formData.append('resume', resumeFile);
    }

    setApplying(true);
    try {
      await api.post('/candidates/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Applied successfully! Track your status in the dashboard.');
      setMyAppliedPlacements(prev => new Set([...prev, selectedDrive.id]));
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const walkinDrives = placements.filter(p => p.type === 'walkin');
  const collegeDrives = placements.filter(p => p.type === 'college');

  return (
    <div className="w-full bg-background min-h-screen">
      {!user && (
        <>
          {/* Hero Section */}
          <div className="relative overflow-hidden pt-24 pb-32 lg:pt-32 lg:pb-40 border-b border-slate-700/50">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full point-events-none translate-x-1/3 -translate-y-1/3"></div>
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 blur-[120px] rounded-full point-events-none -translate-x-1/4 translate-y-1/4"></div>
            </div>
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Now hiring for 2026 roles
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8">
                Shape Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Future</span>
              </h1>
              <p className="mt-4 text-xl md:text-2xl text-textMuted max-w-3xl mx-auto leading-relaxed">
                Join a fast-growing, innovative team dedicated to building products that empower millions. Discover opportunities that challenge and inspire.
              </p>
              <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
                <button onClick={() => document.getElementById('about-us').scrollIntoView({ behavior: 'smooth' })} className="btn-secondary px-8 py-4 text-lg bg-surface/50 backdrop-blur-md">
                  Learn More
                </button>
              </div>
            </div>
          </div>

          {/* Who We Are */}
          <section id="about-us" className="py-24 bg-surface max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative rounded-3xl mt-[-40px] z-20 shadow-2xl border border-slate-700/50">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-3">About Us</h2>
              <h3 className="text-3xl md:text-5xl font-bold mb-6 text-white text-balance">Innovating for a better tomorrow</h3>
              <p className="text-textMuted text-lg max-w-3xl mx-auto leading-relaxed">We are a dynamic organization blending cutting-edge technology with human-centric design. Our mission is to accelerate digital transformation globally by building tools that people love.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="card border-0 bg-slate-800/40 hover:-translate-y-2 transition-transform duration-300 ring-1 ring-white/5 hover:ring-primary/30">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-blue-600/10 flex items-center justify-center text-primary mb-6 shadow-inner"><Globe size={28} /></div>
                <h3 className="text-2xl font-semibold mb-3 text-white">Global Impact</h3>
                <p className="text-slate-400 leading-relaxed">Our products are used by millions across the globe, driving meaningful change in various industries and communities everyday.</p>
              </div>
              <div className="card border-0 bg-slate-800/40 hover:-translate-y-2 transition-transform duration-300 ring-1 ring-white/5 hover:ring-secondary/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-purple-500"></div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/30 to-purple-600/10 flex items-center justify-center text-secondary mb-6 shadow-inner"><Zap size={28} /></div>
                <h3 className="text-2xl font-semibold mb-3 text-white">Innovation First</h3>
                <p className="text-slate-400 leading-relaxed">We encourage creative problem solving and consistently invest heavily in R&D to stay ahead of the technological curve.</p>
              </div>
              <div className="card border-0 bg-slate-800/40 hover:-translate-y-2 transition-transform duration-300 ring-1 ring-white/5 hover:ring-emerald-500/30">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-600/10 flex items-center justify-center text-emerald-400 mb-6 shadow-inner"><Users size={28} /></div>
                <h3 className="text-2xl font-semibold mb-3 text-white">Collaborative Culture</h3>
                <p className="text-slate-400 leading-relaxed">We believe in the immense power of teams. Our open, flat, and inclusive culture ensures every single voice is heard.</p>
              </div>
            </div>
          </section>

          {/* Life at Company */}
          <section className="py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-16">
                <div className="md:w-1/2">
                  <h2 className="text-sm font-bold text-secondary tracking-widest uppercase mb-3">Our Culture</h2>
                  <h3 className="text-4xl md:text-5xl font-bold mb-6 text-white text-balance">Life at the Company</h3>
                  <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                    Work-life balance isn't just a buzzword here. We offer flexible schedules, continuous learning stipends, and regular team offsites to ensure our employees thrive both professionally and personally.
                  </p>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary mt-1"><Heart size={20}/></div> 
                      <div>
                        <h4 className="text-xl font-semibold text-white mb-1">Comprehensive Health & Wellness</h4>
                        <p className="text-slate-400 text-sm">Full medical, dental, and global well-being plans for you and your dependents.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-secondary/10 text-secondary mt-1"><Star size={20}/></div> 
                      <div>
                        <h4 className="text-xl font-semibold text-white mb-1">Equity Options for Everyone</h4>
                        <p className="text-slate-400 text-sm">We succeed together. Every employee is an owner in the company's future.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 mt-1"><Award size={20}/></div> 
                      <div>
                        <h4 className="text-xl font-semibold text-white mb-1">Continuous Development</h4>
                        <p className="text-slate-400 text-sm">Annual learning stipends, robust mentorship, and clear career growth tracks.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/2 w-full grid grid-cols-2 gap-4 lg:gap-6 relative">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 blur-[80px] rounded-full z-0"></div>
                   {/* Decorative Gradient Blocks representing images */}
                   <div className="h-56 rounded-2xl bg-gradient-to-br from-primary/50 to-blue-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/10 transform hover:scale-105 transition-all duration-500 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                   </div>
                   <div className="h-56 rounded-2xl bg-gradient-to-bl from-secondary/50 to-purple-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/10 transform translate-y-12 hover:scale-105 transition-all duration-500 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                   </div>
                   <div className="h-56 rounded-2xl bg-gradient-to-tr from-emerald-500/40 to-teal-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/10 transform hover:scale-105 transition-all duration-500 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                   </div>
                   <div className="h-56 rounded-2xl bg-gradient-to-tl from-pink-500/40 to-rose-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/10 transform translate-y-12 hover:scale-105 transition-all duration-500 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                   </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-24 bg-surface border-y border-slate-700/50 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-16">
                <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-3">Testimonials</h2>
                <h3 className="text-3xl md:text-5xl font-bold text-white mb-4">Happy Clients & Employees</h3>
                <p className="text-textMuted text-lg max-w-2xl mx-auto">Don't just take our word for it. Hear from the people who build and use our products everyday.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                   { name: "John Doe", role: "Software Engineer", quote: "Joining this company was the best career decision I've made. The culture is unmatched and the technical challenges are exhilarating.", color: "from-blue-500 to-primary" },
                   { name: "Sarah Williams", role: "Product Manager", quote: "I love how everyone here is driven by a shared vision. We don't just build features; we build solutions that matter. The growth potential is phenomenal.", color: "from-purple-500 to-secondary" },
                   { name: "TechCorp Inc.", role: "Enterprise Client", quote: "Their team consistently delivers high-quality software on time. They are true partners in our technological evolution. Highly recommended.", color: "from-emerald-500 to-teal-600" }
                 ].map((t, i) => (
                   <div key={i} className="card relative z-10 glass-panel border border-slate-700/50 hover:border-slate-500/50 transition-colors">
                      <Quote size={48} className="absolute top-6 right-6 text-white/5 z-0" />
                      <div className="relative z-10 flex flex-col h-full">
                        <p className="text-slate-300 italic mb-8 flex-grow text-lg">"{t.quote}"</p>
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${t.color} flex items-center justify-center font-bold text-white shadow-lg text-lg`}>
                              {t.name.charAt(0)}
                           </div>
                           <div>
                             <h4 className="font-semibold text-white text-lg">{t.name}</h4>
                             <p className="text-sm text-textMuted">{t.role}</p>
                           </div>
                        </div>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </section>
        </>
      )}

      {user && (
        <section id="open-roles" className="py-12 relative animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="mb-12 text-left border-b border-slate-700/50 pb-6">
              <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-2">Careers Dashboard</h2>
              <h3 className="text-3xl md:text-4xl font-bold text-white">
                Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Opportunities</span>
              </h3>
              <p className="text-textMuted text-lg mt-2">
                Explore open walk-in jobs and upcoming college placement drives.
              </p>
            </div>

            {loading ? (
               <div className="flex justify-center py-20">
                 <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
               </div>
            ) : (
               <div className="space-y-12">
                 <div className="bg-slate-800/20 border border-slate-700/50 rounded-3xl p-6 lg:p-8">
                   <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-700/50">
                     <div className="p-3 bg-secondary/20 rounded-xl text-secondary shadow-inner"><Briefcase size={28} /></div>
                     <h3 className="text-2xl font-semibold text-white">Walk-in Jobs</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {walkinDrives.length === 0 ? <p className="text-textMuted bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 text-center col-span-full">No jobs available right now.</p> : walkinDrives.map(job => (
                       <div key={job.id} className="card bg-surface/80 group hover:scale-[1.02] hover:border-secondary/50 transition-all duration-300">
                         <h3 className="text-xl font-semibold mb-2 group-hover:text-secondary transition-colors text-white">{job.job_role}</h3>
                         <div className="space-y-2 mb-4 text-sm text-slate-400 text-left">
                           <p className="flex items-center gap-2"><MapPin size={16} className="text-secondary/70"/> {job.location}</p>
                           <p className="flex items-center gap-2"><Calendar size={16} className="text-secondary/70"/> {job.date}</p>
                         </div>
                         <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700/50">
                           <span className="text-xs font-medium px-3 py-1.5 bg-slate-800 rounded-lg text-slate-300 border border-slate-700">
                             {job.number_of_rounds} Rounds
                           </span>
                           {myAppliedPlacements.has(job.id) ? (
                             <button disabled className="btn-secondary text-sm py-2 px-5 opacity-50 cursor-not-allowed">Applied</button>
                           ) : (
                             <button onClick={() => handleApplyClick(job)} className="btn-secondary text-sm py-2 px-5 hover:bg-secondary hover:text-white hover:border-secondary">Apply Now</button>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 <div className="bg-slate-800/20 border border-slate-700/50 rounded-3xl p-6 lg:p-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>
                   <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-700/50 relative z-10">
                     <div className="p-3 bg-primary/20 rounded-xl text-primary shadow-inner"><Calendar size={28} /></div>
                     <h3 className="text-2xl font-semibold text-white">Placement Drives</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                     {collegeDrives.length === 0 ? <p className="text-textMuted bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 text-center col-span-full">No drives upcoming.</p> : collegeDrives.map(place => (
                       <div key={place.id} className="card bg-surface/80 border-t-4 border-t-primary group hover:scale-[1.02] transition-all duration-300">
                         <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors text-white">{place.college_name}</h3>
                         <p className="text-primary font-medium mb-4">{place.job_role}</p>
                         
                         <div className="space-y-2 mb-4 text-sm text-slate-400">
                           <p className="flex items-center gap-2"><Calendar size={16} className="text-primary/70" /> {place.date}</p>
                           <p className="flex items-center gap-2"><MapPin size={16} className="text-primary/70" /> {place.location}</p>
                           <p className="flex items-center gap-2 text-amber-400/80"><Key size={16} /> Requires Passkey</p>
                         </div>
                         
                         <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700/50">
                           <span className="text-xs font-medium px-3 py-1.5 bg-primary/10 rounded-lg text-primary border border-primary/20">
                             {place.number_of_rounds} Rounds
                           </span>
                           {myAppliedPlacements.has(place.id) ? (
                             <button disabled className="btn-primary text-sm py-2 px-5 opacity-50 cursor-not-allowed">Applied</button>
                           ) : (
                             <button onClick={() => handleApplyClick(place)} className="btn-primary text-sm py-2 px-5 shadow-[0_0_15px_rgba(59,130,246,0.3)]">Apply Now</button>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
            )}
          </div>
        </section>
      )}

      {/* Apply Modal */}
      {showModal && selectedDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className={`card w-full max-w-md animate-slide-up relative shadow-2xl border-${selectedDrive.type === 'college' ? 'primary' : 'secondary'}/30 bg-surface`}>
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-textMuted hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold mb-1 text-white">Apply for {selectedDrive.job_role}</h2>
            
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700/50">
              <span className="text-sm text-slate-400 font-medium">
                {selectedDrive.type === 'college' ? `At ${selectedDrive.college_name}` : 'Walk-in opportunity'}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${selectedDrive.type === 'college' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-secondary/10 text-secondary border border-secondary/20'}`}>
                {selectedDrive.number_of_rounds} Rounds Expected
              </span>
            </div>

            {selectedDrive.description && (
              <div className="mb-6 p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 max-h-32 overflow-y-auto custom-scrollbar">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-bold flex items-center gap-2"><Briefcase size={12}/> Role Description</p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedDrive.description}</p>
              </div>
            )}
            
            <form onSubmit={handleApplySubmit} className="space-y-5">
              {selectedDrive.type === 'college' && (
                <div>
                  <label className="label flex items-center gap-2 text-white"><Key size={16} className="text-amber-400"/> Drive Passkey</label>
                  <input required type="text" className="input-field bg-slate-800/50 border-slate-700 focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Enter the 6-character passkey from your college" value={passkey} onChange={e => setPasskey(e.target.value.toUpperCase())} maxLength={6} />
                </div>
              )}
              
              <div>
                <label className="label flex gap-2 items-center text-white"><Upload size={16} className="text-primary"/> Custom Resume (Optional)</label>
                <div className="border border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors bg-slate-800/30 relative mt-1">
                  <input type="file" accept=".pdf,.doc,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setResumeFile(e.target.files[0])} />
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={24} className="text-slate-500" />
                    <p className="text-sm text-slate-300 font-medium">{resumeFile ? resumeFile.name : 'Upload specific resume'}</p>
                    <p className="text-xs text-slate-500">{resumeFile ? 'Click to change file' : 'Leave blank to use default profile resume'}</p>
                  </div>
                </div>
              </div>
              
              <button disabled={applying} type="submit" className={`btn-primary w-full mt-6 py-3 text-lg font-semibold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] ${selectedDrive.type === 'walkin' ? 'bg-secondary hover:bg-secondary shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]' : ''}`}>
                {applying ? 'Submitting Application...' : 'Submit Profile Data'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobIndex;
