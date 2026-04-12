import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Users, Briefcase, Calendar, MapPin, Key, Edit3, LayoutDashboard, Building, Users as UsersIcon, BarChart3, TrendingUp, X, Filter, Target } from 'lucide-react';
import { toast } from 'react-toastify';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#3b82f6']; // Green, Red, Yellow, Blue -> Selected, Rejected, Hold, Pending

const AdminDashboard = () => {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'college' | 'walkin'
  
  // Filters State
  const [filterYear, setFilterYear] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All'); // 0-11 as string, or 'All'
  const [filterCollege, setFilterCollege] = useState('All');
  const [selectedDeepDiveDriveId, setSelectedDeepDiveDriveId] = useState('All');

  // Placement Form State
  const [showPlacementForm, setShowPlacementForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  const initialFormState = { 
    type: 'college', college_name: '', date: '', job_role: '', description: '', location: '', number_of_rounds: 1, year: new Date().getFullYear(),
    interviewer_emails: '',
    roundsInfo: [{ round_number: 1, criteria: '' }] 
  };
  const [placementData, setPlacementData] = useState(initialFormState);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const placeRes = await api.get('/placements');
      setPlacements(placeRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlacement = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/placements/${editingId}`, placementData);
        toast.success('Drive updated successfully');
      } else {
        await api.post('/placements', placementData);
        toast.success(`${placementData.type === 'college' ? 'College Drive' : 'Walk-in'} created successfully`);
      }
      setShowPlacementForm(false);
      setEditMode(false);
      setPlacementData(initialFormState);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save drive');
    }
  };

  const openNewForm = (type) => {
    setPlacementData({ ...initialFormState, type });
    setEditMode(false);
    setShowPlacementForm(true);
  };

  const openEditForm = (drive) => {
    setPlacementData({
      type: drive.type,
      college_name: drive.college_name || '',
      date: drive.date,
      job_role: drive.job_role,
      description: drive.description || '',
      location: drive.location,
      number_of_rounds: drive.number_of_rounds,
      year: drive.year || new Date().getFullYear(),
      interviewer_emails: drive.interviewers?.map(i => i.email).join(', ') || '',
      roundsInfo: drive.rounds?.length 
        ? drive.rounds.map(r => ({ round_number: r.round_number, criteria: r.criteria || '' }))
        : [{ round_number: 1, criteria: '' }]
    });
    setEditingId(drive.id);
    setEditMode(true);
    setShowPlacementForm(true);
  };

  const collegeDrives = placements.filter(p => p.type === 'college');
  const walkinDrives = placements.filter(p => p.type === 'walkin');

  // Generate Dropdown Options
  const availableYears = useMemo(() => {
    const years = new Set();
    placements.forEach(p => {
      const y = p.year || new Date(p.date).getFullYear();
      if(y) years.add(y.toString());
    });
    return Array.from(years).sort().reverse();
  }, [placements]);

  const availableColleges = useMemo(() => {
    const colleges = new Set();
    placements.forEach(p => {
       if (p.type === 'college' && p.college_name) colleges.add(p.college_name);
    });
    return Array.from(colleges).sort();
  }, [placements]);

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Apply filters for charts
  const filteredAnalytics = useMemo(() => {
    // Determine the grouping key and map
    const dataMap = {};
    const isYearSpecific = filterYear !== 'All';

    // To ensure charts show zeros for empty months if a specific year is picked
    if (isYearSpecific) {
      MONTHS.forEach((m, idx) => {
        dataMap[idx.toString()] = { name: m, college_drives: 0, walkin_drives: 0, total_candidates: 0, total_selected: 0, _sortKey: idx };
      });
    }

    placements.forEach(p => {
      const dateObj = new Date(p.date);
      const pYear = p.year?.toString() || dateObj.getFullYear().toString();
      const pMonth = dateObj.getMonth().toString(); // 0-11
      const pCollege = p.college_name || '';

      // Skip logic based on filters
      if (filterYear !== 'All' && pYear !== filterYear) return;
      if (filterMonth !== 'All' && pMonth !== filterMonth) return;
      if (filterCollege !== 'All' && p.type === 'college' && pCollege !== filterCollege) return;
      
      // If walkins are not part of specific college filter, skip them if college is selected
      if (filterCollege !== 'All' && p.type === 'walkin') return;

      const groupKey = isYearSpecific ? pMonth : pYear;

      if (!dataMap[groupKey]) {
        dataMap[groupKey] = { name: groupKey, college_drives: 0, walkin_drives: 0, total_candidates: 0, total_selected: 0, _sortKey: parseInt(groupKey) };
      }
      
      if (p.type === 'college') dataMap[groupKey].college_drives += 1;
      else dataMap[groupKey].walkin_drives += 1;

      const appsCount = p.applications?.length || 0;
      dataMap[groupKey].total_candidates += appsCount;

      const selectedCount = p.applications?.filter(a => a.status === 'selected').length || 0;
      dataMap[groupKey].total_selected += selectedCount;
    });

    return Object.values(dataMap).sort((a, b) => a._sortKey - b._sortKey);
  }, [placements, filterYear, filterMonth, filterCollege]);

  // Aggregate KPI stats from filtered array
  const KPIStats = useMemo(() => {
    return filteredAnalytics.reduce((acc, curr) => {
      acc.drives += (curr.college_drives + curr.walkin_drives);
      acc.colleges += curr.college_drives;
      acc.walkins += curr.walkin_drives;
      acc.candidates += curr.total_candidates;
      return acc;
    }, { drives: 0, colleges: 0, walkins: 0, candidates: 0 });
  }, [filteredAnalytics]);

  // Deep Dive Data computation
  const deepDiveDrive = useMemo(() => {
    if (selectedDeepDiveDriveId === 'All') return null;
    return placements.find(p => p.id === parseInt(selectedDeepDiveDriveId));
  }, [placements, selectedDeepDiveDriveId]);

  const deepDiveStats = useMemo(() => {
    if (!deepDiveDrive) return [];
    let selected = 0, rejected = 0, hold = 0, pending = 0;
    deepDiveDrive.applications?.forEach(app => {
      if (app.status === 'selected') selected++;
      else if (app.status === 'rejected') rejected++;
      else if (app.status === 'hold') hold++;
      else pending++;
    });
    
    // Only return chunks that > 0 to have a clean pie chart
    const data = [];
    if (selected > 0) data.push({ name: 'Selected', value: selected });
    if (rejected > 0) data.push({ name: 'Rejected', value: rejected });
    if (hold > 0) data.push({ name: 'Hold', value: hold });
    if (pending > 0) data.push({ name: 'Pending', value: pending });
    
    return data;
  }, [deepDiveDrive]);


  if (loading) return <div className="p-20 text-center flex h-[50vh] items-center justify-center"><div className="animate-spin h-8 w-8 mx-auto border-4 border-primary border-t-transparent rounded-full"></div></div>;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-xl shrink-0 glass-panel">
          <p className="text-white font-bold mb-2">{`${filterYear === 'All' ? 'Year' : 'Month'}: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
      
      {/* FILTER PANEL */}
      <div className="card glass-panel flex flex-col md:flex-row gap-4 items-center justify-between border border-slate-700/50 p-4">
        <div className="flex items-center gap-2 text-textMuted font-semibold">
           <Filter size={18} /> Filters
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <select className="input-field bg-slate-900 border-slate-700 max-w-[150px] text-sm py-2" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="All">All Years</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input-field bg-slate-900 border-slate-700 max-w-[150px] text-sm py-2" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="All">All Months</option>
            {MONTHS.map((m, i) => <option key={i} value={i.toString()}>{m}</option>)}
          </select>
          <select className="input-field bg-slate-900 border-slate-700 max-w-[200px] text-sm py-2" value={filterCollege} onChange={e => setFilterCollege(e.target.value)}>
            <option value="All">All Universities</option>
            {availableColleges.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {(filterYear !== 'All' || filterMonth !== 'All' || filterCollege !== 'All') && (
            <button 
              className="text-xs text-primary underline hover:text-white"
              onClick={() => { setFilterYear('All'); setFilterMonth('All'); setFilterCollege('All'); }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-slate-800 to-slate-900 border-t-4 border-t-primary flex flex-col gap-2 hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start">
             <div className="p-2 bg-primary/20 rounded-md text-primary"><Calendar size={20} /></div>
             <TrendingUp size={16} className="text-green-400" />
          </div>
          <div>
            <p className="text-3xl font-bold text-white mt-2">{KPIStats.drives}</p>
            <p className="text-textMuted text-sm font-medium mt-1">Total Drives (Filtered)</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-slate-800 to-slate-900 border-t-4 border-t-secondary flex flex-col gap-2 hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start">
             <div className="p-2 bg-secondary/20 rounded-md text-secondary"><Building size={20} /></div>
          </div>
          <div>
            <p className="text-3xl font-bold text-white mt-2">{KPIStats.colleges}</p>
            <p className="text-textMuted text-sm font-medium mt-1">College Drives</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-slate-800 to-slate-900 border-t-4 border-t-purple-500 flex flex-col gap-2 hover:-translate-y-1 transition-transform">
           <div className="flex justify-between items-start">
             <div className="p-2 bg-purple-500/20 rounded-md text-purple-500"><Briefcase size={20} /></div>
          </div>
          <div>
             <p className="text-3xl font-bold text-white mt-2">{KPIStats.walkins}</p>
             <p className="text-textMuted text-sm font-medium mt-1">Walk-in Jobs</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-slate-800 to-slate-900 border-t-4 border-t-green-500 flex flex-col gap-2 hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start">
             <div className="p-2 bg-green-500/20 rounded-md text-green-500"><UsersIcon size={20} /></div>
          </div>
          <div>
            <p className="text-3xl font-bold text-white mt-2">{KPIStats.candidates}</p>
            <p className="text-textMuted text-sm font-medium mt-1">Total Candidates</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card border border-slate-700/50">
           <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <BarChart3 size={20} className="text-primary"/> Drive Execution Overview
           </h3>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={filteredAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                 <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                 <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                 <Tooltip content={<CustomTooltip />} cursor={{fill: '#334155', opacity: 0.4}}/>
                 <Legend wrapperStyle={{ paddingTop: '20px' }} />
                 <Bar dataKey="college_drives" name="College Drives" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                 <Bar dataKey="walkin_drives" name="Walk-in Jobs" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="card border border-slate-700/50">
           <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <TrendingUp size={20} className="text-secondary"/> Candidates Applied vs Selected
           </h3>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={filteredAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSelected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                 <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                 <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                 <Tooltip content={<CustomTooltip />} />
                 <Legend wrapperStyle={{ paddingTop: '20px' }} />
                 <Area type="monotone" dataKey="total_candidates" name="Total Applied" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                 <Area type="monotone" dataKey="total_selected" name="Selected" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSelected)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* DEEP DIVE SECTION */}
      <div className="card border-2 border-primary/20 bg-slate-900">
         <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Target size={20} className="text-primary"/> Drive Performance Deep Dive
            </h3>
            <select className="input-field bg-slate-800 border-slate-700 min-w-[250px] text-sm py-2" value={selectedDeepDiveDriveId} onChange={e => setSelectedDeepDiveDriveId(e.target.value)}>
              <option value="All">-- Select a Drive to Inspect --</option>
              {placements.map(p => (
                <option key={p.id} value={p.id}>
                  {p.type === 'college' ? `[College] ${p.college_name}` : `[Walk-in] ${p.job_role}`} ({p.date})
                </option>
              ))}
            </select>
         </div>

         {selectedDeepDiveDriveId !== 'All' && deepDiveDrive ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in border-t border-slate-800 pt-6">
              
              <div className="flex flex-col justify-center gap-4">
                 <h4 className="font-semibold text-textMuted mb-2">Drive Overview Context</h4>
                 <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <p className="text-xl text-primary font-bold">{deepDiveDrive.type === 'college' ? deepDiveDrive.college_name : deepDiveDrive.job_role}</p>
                    <p className="text-sm text-textMuted">{deepDiveDrive.location} • {deepDiveDrive.date}</p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                       <div className="bg-slate-900 p-3 rounded text-center border border-slate-700">
                          <p className="text-2xl font-bold text-white">{deepDiveDrive.applications?.length || 0}</p>
                          <p className="text-xs text-textMuted">Total Applications</p>
                       </div>
                       <div className="bg-slate-900 p-3 rounded text-center border border-slate-700">
                          <p className="text-2xl font-bold text-white">{deepDiveDrive.rounds?.length || 0}</p>
                          <p className="text-xs text-textMuted">Total Rounds Required</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="h-[250px] w-full flex flex-col items-center">
                 <h4 className="font-semibold text-textMuted mb-2 self-start w-full text-center">Candidate Outcomes</h4>
                 {deepDiveStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={deepDiveStats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {deepDiveStats.map((entry, index) => {
                             let color = COLORS[3]; // Pending blue
                             if (entry.name === 'Selected') color = COLORS[0];
                             if (entry.name === 'Rejected') color = COLORS[1];
                             if (entry.name === 'Hold') color = COLORS[2];
                             return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Pie>
                        <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff'}} itemStyle={{color: '#fff'}} />
                        <Legend wrapperStyle={{paddingTop: '10px'}}/>
                      </PieChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="h-full w-full flex items-center justify-center border border-dashed border-slate-700 rounded-xl bg-slate-800/20">
                      <p className="text-textMuted text-sm">No applications registered for this drive yet.</p>
                    </div>
                 )}
              </div>
           </div>
         ) : null}
      </div>

    </div>
  );

  const renderDrives = (type) => {
    const isCollege = type === 'college';
    const drives = isCollege ? collegeDrives : walkinDrives;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 shadow-sm backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {isCollege ? 'College Drives' : 'Walk-in Jobs'} Management
            </h2>
            <p className="text-sm text-textMuted mt-1">
              {isCollege ? 'Manage campus recruitment events.' : 'Manage open walk-in job opportunities.'}
            </p>
          </div>
          <button onClick={() => openNewForm(type)} className={`btn-primary shadow-lg flex items-center gap-2 ${!isCollege ? 'bg-secondary hover:bg-secondary border-secondary/50' : ''}`}>
            <Plus size={18} /> New {isCollege ? 'Drive' : 'Walk-in'}
          </button>
        </div>

        {drives.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/20 border border-slate-700/30 rounded-xl border-dashed">
            <Briefcase className="mx-auto text-slate-500 mb-3" size={40} />
            <p className="text-textMuted text-lg">No {isCollege ? 'college drives' : 'walk-in jobs'} found.</p>
            <button onClick={() => openNewForm(type)} className="text-primary hover:text-white mt-2 underline text-sm transition-colors">Create one now</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {drives.map(p => (
              <div key={p.id} className="card hover:border-slate-600 transition-colors group relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${isCollege ? 'from-primary to-blue-600' : 'from-secondary to-purple-600'}`}></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h3 className={`text-lg font-bold ${isCollege ? 'text-primary' : 'text-secondary'}`}>
                      {isCollege ? p.college_name : p.job_role}
                    </h3>
                    {isCollege && <p className="text-sm font-medium text-white">{p.job_role}</p>}
                    <span className="inline-block mt-2 px-2 py-0.5 bg-slate-800 text-xs text-textMuted rounded border border-slate-700">Year: {p.year || new Date(p.date).getFullYear()}</span>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs text-textMuted">
                    <span className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1"><UsersIcon size={12}/> {p.rounds?.length || 0} / {p.number_of_rounds} Rounds Defined</span>
                    <span className={`px-3 py-1 bg-${isCollege?'primary':'secondary'}/10 text-${isCollege?'primary':'secondary'} font-medium rounded-full border border-${isCollege?'primary':'secondary'}/20 flex items-center gap-1`}>
                      <Briefcase size={12}/> {p.applications?.length || 0} Applied
                    </span>
                  </div>
                </div>
                
                {isCollege && p.passkey && (
                  <div className="mb-4 bg-primary/5 border border-primary/20 rounded-md p-3 flex justify-between items-center relative z-10">
                    <span className="flex items-center gap-2 text-primary font-medium text-sm">
                       <Key size={16}/> Drive Passkey
                    </span>
                    <span className="font-mono text-lg font-bold tracking-widest text-white px-2 py-1 bg-black/40 rounded">{p.passkey}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-textMuted mb-6 relative z-10">
                  <span className="flex items-center gap-2"><Calendar size={16} className={isCollege ? 'text-primary/70' : 'text-secondary/70'}/> {p.date}</span>
                  <span className="flex items-center gap-2"><MapPin size={16} className={isCollege ? 'text-primary/70' : 'text-secondary/70'}/> {p.location}</span>
                </div>
                
                <div className="flex gap-3 relative z-10 mt-auto">
                  <button className="flex-1 btn-secondary text-sm py-2 hover:bg-slate-700 hover:text-white transition-all shadow-sm" onClick={() => navigate(`/admin/placements/${p.id}/tracker`)}>Track Candidates</button>
                  <button className={`p-2 border border-slate-700 rounded-lg hover:bg-${isCollege ? 'primary' : 'secondary'} hover:border-${isCollege ? 'primary' : 'secondary'} hover:text-white transition-colors text-textMuted shadow-sm group-hover:border-slate-500`} title="Edit Drive" onClick={() => openEditForm(p)}>
                    <Edit3 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex w-full bg-background mt-[-16px]">
      <aside className="w-64 flex-shrink-0 bg-slate-900/50 border-r border-slate-800 min-h-[calc(100vh-64px)] hidden md:flex flex-col sticky top-16 h-[calc(100vh-64px)]">
        <div className="p-6">
          <h2 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4">Admin Hub</h2>
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'overview' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(14,165,233,0.15)]' : 'text-textMuted hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard size={18} />
              Analytics Overview
            </button>
            <button 
              onClick={() => setActiveTab('college')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'college' ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(14,165,233,0.15)]' : 'text-textMuted hover:bg-slate-800 hover:text-white'}`}
            >
              <Building size={18} />
              College Drives
            </button>
            <button 
              onClick={() => setActiveTab('walkin')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'walkin' ? 'bg-secondary/20 text-secondary border border-secondary/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'text-textMuted hover:bg-slate-800 hover:text-white'}`}
            >
              <Briefcase size={18} />
              Walk-in Jobs
            </button>
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-slate-800/50">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold text-xs shadow-lg">A</div>
             <div>
               <p className="text-sm font-medium text-white">Administrator</p>
               <p className="text-xs text-textMuted">System Manager</p>
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-6 lg:p-8 bg-slate-950/50">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {showPlacementForm && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className={`bg-slate-900 border border-${placementData.type === 'college' ? 'primary' : 'secondary'}/50 rounded-2xl shadow-2xl w-full max-w-3xl my-8 animate-scale-in relative overflow-hidden`}>
                <div className={`h-1.5 w-full bg-gradient-to-r ${placementData.type === 'college' ? 'from-primary to-blue-500' : 'from-secondary to-purple-500'}`}></div>
                
                <div className="p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      {editMode ? <Edit3 className={placementData.type === 'college' ? 'text-primary' : 'text-secondary'}/> : <Plus className={placementData.type === 'college' ? 'text-primary' : 'text-secondary'}/>}
                      {editMode ? 'Edit' : 'Create'} {placementData.type === 'college' ? 'College Drive' : 'Walk-in Job'}
                    </h3>
                    <button onClick={() => setShowPlacementForm(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreatePlacement} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {placementData.type === 'college' && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-300 ml-1">College Name</label>
                        <input required className="input-field bg-slate-800/50 border-slate-700 focus:border-primary/50" placeholder="e.g. MIT Institute" value={placementData.college_name} onChange={e => setPlacementData({...placementData, college_name: e.target.value})}/>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-300 ml-1">Job Role</label>
                      <input required className="input-field bg-slate-800/50 border-slate-700" placeholder="e.g. Software Engineer" value={placementData.job_role} onChange={e => setPlacementData({...placementData, job_role: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-300 ml-1">Date</label>
                      <input required type="date" className="input-field bg-slate-800/50 border-slate-700" value={placementData.date} onChange={e => setPlacementData({...placementData, date: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-300 ml-1">Location</label>
                      <input required className="input-field bg-slate-800/50 border-slate-700" placeholder="e.g. Campus / Remote" value={placementData.location} onChange={e => setPlacementData({...placementData, location: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-300 ml-1">Number of Rounds</label>
                      <input required type="number" min="1" max="10" className="input-field bg-slate-800/50 border-slate-700" value={placementData.number_of_rounds} onChange={e => {
                        const num = parseInt(e.target.value) || 1;
                        const newRounds = Array.from({ length: num }, (_, i) => {
                          const existing = placementData.roundsInfo[i];
                          return existing || { round_number: i + 1, criteria: '' };
                        });
                        setPlacementData({...placementData, number_of_rounds: num, roundsInfo: newRounds});
                      }} />
                    </div>
                    <div className="md:col-span-2 space-y-1 mt-2">
                      <label className="text-sm font-medium text-slate-300 ml-1">Job Description & Company Information</label>
                      <textarea required rows="3" className="input-field bg-slate-800/50 border-slate-700" placeholder="Describe the company, the job role, and candidate expectations..." value={placementData.description} onChange={e => setPlacementData({...placementData, description: e.target.value})}></textarea>
                    </div>

                    <div className="md:col-span-2 space-y-1 mt-2">
                      <label className={`text-sm font-medium ml-1 ${placementData.type === 'college' ? 'text-primary' : 'text-secondary'}`}>Interviewer Setup (Emails)</label>
                      <input required type="text" placeholder="interviewer1@abc.com, reviewer@test.com" className={`input-field bg-slate-800/50 border-${placementData.type === 'college' ? 'primary' : 'secondary'}/30 focus:border-${placementData.type === 'college' ? 'primary' : 'secondary'}`} value={placementData.interviewer_emails} onChange={e => setPlacementData({...placementData, interviewer_emails: e.target.value})} />
                      <p className="text-xs text-textMuted mt-1.5 ml-1">Add emails separated by commas. These interviewers can evaluate any candidate.</p>
                    </div>

                    <div className="md:col-span-2 space-y-4 py-4 mt-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">Round Configurations</h3>
                      <div className="grid gap-3">
                        {placementData.roundsInfo.map((r, i) => (
                          <div key={i} className="flex flex-col gap-2 bg-slate-800/30 p-3 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                            <label className="text-xs font-semibold text-textMuted flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full bg-${placementData.type==='college'?'primary':'secondary'}/20 text-${placementData.type==='college'?'primary':'secondary'} flex items-center justify-center text-[10px]`}>{r.round_number}</span> 
                              Expected Knowledge / Criteria
                            </label>
                            <input required placeholder="e.g. Technical Interview - React JS & Data Structures" className="input-field bg-slate-900/50 text-sm border-slate-700 py-2" value={r.criteria} onChange={e => {
                              const updated = [...placementData.roundsInfo];
                              updated[i].criteria = e.target.value;
                              setPlacementData({...placementData, roundsInfo: updated});
                            }} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-800">
                      <button type="button" onClick={() => setShowPlacementForm(false)} className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors">Cancel</button>
                      <button type="submit" className={`btn-primary px-8 shadow-lg ${placementData.type === 'walkin' ? 'bg-secondary hover:bg-secondary/90 shadow-secondary/20' : 'shadow-primary/20'}`}>
                        {editMode ? 'Save Changes' : 'Create Drive'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="pb-10">
             {activeTab === 'overview' && renderOverview()}
             {activeTab === 'college' && renderDrives('college')}
             {activeTab === 'walkin' && renderDrives('walkin')}
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
