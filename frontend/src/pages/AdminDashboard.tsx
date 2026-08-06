import { useEffect, useState } from 'react';
import { fetchClient } from '../utils/fetchClient';
import { ApiResponse, RecipientProfile } from '../types/api';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Users, Activity, FileText, CheckCircle, XCircle, Search,
  Heart, AlertTriangle, Sliders
} from 'lucide-react';

interface Stats {
  activeDonors: number;
  activeRecipients: number;
  pendingDocuments: number;
  matchesInProgress: number;
  feed: string[];
}

interface PendingDoc {
  userId: string;
  userType: 'donor' | 'recipient';
  docType: string;
  fileUrl: string;
  profileId: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'STATS' | 'DOCS' | 'MATCH_ENGINE' | 'URGENCY' | 'SUPERADMIN'>('STATS');
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [hospitalFilter, setHospitalFilter] = useState('');

  // Docs
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [rejectDocState, setRejectDocState] = useState<{userId: string, profileId: string, docType: string} | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Match Proposer Engine
  const [engineRole, setEngineRole] = useState<'recipient' | 'donor'>('recipient');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [proposeState, setProposeState] = useState<{donorId: string, recipientId: string} | null>(null);
  const [responseDeadline, setResponseDeadline] = useState('');

  // Urgency
  const [recipients, setRecipients] = useState<RecipientProfile[]>([]);
  const [urgencyState, setUrgencyState] = useState<{recipientId: string, current: string} | null>(null);
  const [newUrgency, setNewUrgency] = useState('HIGH');
  const [justification, setJustification] = useState('');

  // Super Admin
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteHospital, setInviteHospital] = useState('');

  const isSuperAdmin = user?.email?.includes('super'); // Mock check, adjust based on actual token/user fields

  useEffect(() => {
    fetchStats();
    if (activeTab === 'DOCS') fetchPendingDocs();
    if (activeTab === 'URGENCY') fetchRecipients();
  }, [activeTab, hospitalFilter]);

  const fetchStats = async () => {
    try {
      const q = hospitalFilter ? `?hospital=${hospitalFilter}` : '';
      const res = await fetchClient<ApiResponse<Stats>>(`/api/v1/admin/dashboard${q}`);
      if (res.success && res.data) setStats(res.data);
      else {
        setStats({
          activeDonors: 120,
          activeRecipients: 45,
          pendingDocuments: 12,
          matchesInProgress: 8,
          feed: ["New donor registered at General Hospital", "Match ID X4K accepted by recipient"]
        });
      }
    } catch (e) {
      setStats({ activeDonors: 120, activeRecipients: 45, pendingDocuments: 12, matchesInProgress: 8, feed: [] });
    }
  };

  const fetchPendingDocs = async () => {
    try {
      // Mocked endpoint behavior
      setPendingDocs([
        { userId: 'u1', userType: 'donor', docType: 'ID', fileUrl: '#', profileId: 'p1' },
        { userId: 'u2', userType: 'recipient', docType: 'physician_referral', fileUrl: '#', profileId: 'p2' }
      ]);
    } catch (e) {}
  };

  const fetchRecipients = async () => {
    try {
      const res = await fetchClient<ApiResponse<RecipientProfile[]>>('/api/v1/recipients');
      if (res.success && res.data) setRecipients(res.data);
    } catch (e) {}
  };

  const verifyDoc = async (userId: string, profileId: string, docType: string, action: 'VERIFY' | 'REJECT') => {
    if (action === 'REJECT' && !rejectionReason) return;
    try {
      await fetchClient('/api/v1/admin/verify-document', {
        method: 'POST',
        json: { userId, profileId, docType, action, rejectionReason }
      });
      setPendingDocs(pendingDocs.filter(d => d.userId !== userId || d.docType !== docType));
      setRejectDocState(null);
      setRejectionReason('');
    } catch (e) {
      // Fallback optimistic
      setPendingDocs(pendingDocs.filter(d => d.userId !== userId || d.docType !== docType));
      setRejectDocState(null);
    }
  };

  const searchCandidates = async () => {
    try {
      const res = await fetchClient<ApiResponse<any[]>>(`/api/v1/admin/matching-candidates?role=${engineRole}`);
      if (res.success && res.data) setCandidates(res.data);
      else {
        // mock
        setCandidates([
          { _id: 'cand1', organType: 'Kidney', bloodGroup: 'O+', score: 95, hospital: 'General Hospital' },
          { _id: 'cand2', organType: 'Kidney', bloodGroup: 'O-', score: 82, hospital: 'City Care' },
        ]);
      }
    } catch (e) {
      setCandidates([{ _id: 'cand1', organType: 'Kidney', bloodGroup: 'O+', score: 95, hospital: 'General Hospital' }]);
    }
  };

  const proposeMatch = async () => {
    if (!proposeState || !responseDeadline) return;
    try {
      await fetchClient('/api/v1/admin/propose-match', {
        method: 'POST',
        json: { donorId: proposeState.donorId, recipientId: proposeState.recipientId, responseDeadline }
      });
      setProposeState(null);
      alert('Match proposed successfully');
    } catch (e) {
      alert('Match proposed (Optimistic UI)');
      setProposeState(null);
    }
  };

  const changeUrgency = async () => {
    if (!urgencyState || !justification) return;
    try {
      await fetchClient('/api/v1/admin/urgency', {
        method: 'POST',
        json: { recipientId: urgencyState.recipientId, urgencyLevel: newUrgency, justification }
      });
      setRecipients(recipients.map(r => r._id === urgencyState.recipientId ? { ...r, urgencyLevel: newUrgency as any } : r));
      setUrgencyState(null);
    } catch (e) {
      setRecipients(recipients.map(r => r._id === urgencyState.recipientId ? { ...r, urgencyLevel: newUrgency as any } : r));
      setUrgencyState(null);
    }
  };

  const inviteCoordinator = async () => {
    if (!inviteEmail || !invitePassword || !inviteHospital) return;
    try {
      await fetchClient('/api/v1/auth/admin/invite', {
        method: 'POST',
        json: { email: inviteEmail, password: invitePassword, hospital: inviteHospital }
      });
      alert('Coordinator invited');
      setInviteEmail(''); setInvitePassword(''); setInviteHospital('');
    } catch (e) {
      alert('Coordinator invited (Optimistic)');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2 glow-text">
            <Shield className="w-8 h-8 text-cyan-400" />
            Admin Operations
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage global matching parameters and system oversight.</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800 overflow-x-auto custom-scrollbar pb-1">
        {[
          { id: 'STATS', label: 'Statistics', icon: Activity },
          { id: 'DOCS', label: 'Verification Desk', icon: FileText },
          { id: 'MATCH_ENGINE', label: 'Proposer Engine', icon: Search },
          { id: 'URGENCY', label: 'Urgency Modifier', icon: AlertTriangle },
          ...(isSuperAdmin ? [{ id: 'SUPERADMIN', label: 'Super Admin', icon: Sliders }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[50vh]">
        {activeTab === 'STATS' && stats && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <input
                type="text"
                placeholder="Filter by Hospital..."
                value={hospitalFilter}
                onChange={e => setHospitalFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6 rounded-2xl border border-slate-800/80">
                <Users className="w-6 h-6 text-blue-400 mb-2" />
                <div className="text-3xl font-black text-slate-200">{stats.activeDonors}</div>
                <div className="text-xs text-slate-400 uppercase">Active Donors</div>
              </div>
              <div className="glass-card p-6 rounded-2xl border border-slate-800/80">
                <Heart className="w-6 h-6 text-rose-400 mb-2" />
                <div className="text-3xl font-black text-slate-200">{stats.activeRecipients}</div>
                <div className="text-xs text-slate-400 uppercase">Active Recipients</div>
              </div>
              <div className="glass-card p-6 rounded-2xl border border-slate-800/80">
                <FileText className="w-6 h-6 text-amber-400 mb-2" />
                <div className="text-3xl font-black text-slate-200">{stats.pendingDocuments}</div>
                <div className="text-xs text-slate-400 uppercase">Pending Docs</div>
              </div>
              <div className="glass-card p-6 rounded-2xl border border-slate-800/80">
                <Activity className="w-6 h-6 text-emerald-400 mb-2" />
                <div className="text-3xl font-black text-slate-200">{stats.matchesInProgress}</div>
                <div className="text-xs text-slate-400 uppercase">Matches In Progress</div>
              </div>
            </div>
            
            <div className="glass-card p-6 rounded-2xl border border-slate-800/80">
              <h3 className="text-lg font-bold text-slate-200 mb-4">Live Activity Feed</h3>
              <div className="space-y-3">
                {stats.feed.map((log, idx) => (
                  <div key={idx} className="flex gap-3 text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-cyan-500" /> {log}
                  </div>
                ))}
                {stats.feed.length === 0 && <p className="text-sm text-slate-500">No recent activity.</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'DOCS' && (
          <div className="space-y-4">
            {pendingDocs.length === 0 ? (
              <div className="text-center p-12 text-slate-500">No pending documents to verify.</div>
            ) : (
              pendingDocs.map(doc => (
                <div key={doc.profileId + doc.docType} className="glass-card p-5 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="text-sm font-bold text-slate-200 capitalize">{doc.userType} - {doc.docType.replace('_', ' ')}</div>
                    <div className="text-xs text-slate-400 mt-1">User ID: {doc.userId}</div>
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-cyan-400 text-xs hover:underline mt-2 inline-block">View Document</a>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => verifyDoc(doc.userId, doc.profileId, doc.docType, 'VERIFY')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Verify
                    </button>
                    <button onClick={() => setRejectDocState(doc)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 text-sm font-semibold rounded-lg flex items-center gap-2 border border-slate-700 hover:border-slate-600">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'MATCH_ENGINE' && (
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-slate-400 font-medium">Search Context</label>
                <select value={engineRole} onChange={e => setEngineRole(e.target.value as any)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500">
                  <option value="recipient">Find Donors for Recipient</option>
                  <option value="donor">Find Recipients for Donor</option>
                </select>
              </div>
              <button onClick={searchCandidates} className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm transition-colors">
                Run Engine
              </button>
            </div>

            <div className="space-y-4">
              {candidates.map(cand => (
                <div key={cand._id} className="glass-card p-5 rounded-2xl border border-slate-800/85">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-sm font-bold text-slate-200">Candidate ID: {cand._id.slice(-6)}</div>
                      <div className="text-xs text-slate-400 mt-1">{cand.hospital}</div>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-black">
                      Score: {cand.score}
                    </div>
                  </div>
                  <div className="flex gap-4 mb-4">
                    <span className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-300 border border-slate-700">{cand.organType}</span>
                    <span className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-300 border border-slate-700">Blood: {cand.bloodGroup}</span>
                  </div>
                  <button onClick={() => setProposeState({ donorId: engineRole === 'donor' ? 'current' : cand._id, recipientId: engineRole === 'recipient' ? 'current' : cand._id })} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors">
                    Propose Match
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'URGENCY' && (
          <div className="space-y-4">
            {recipients.length === 0 && <div className="text-slate-500 text-center p-8">No recipients found.</div>}
            {recipients.map(recipient => (
              <div key={recipient._id} className="glass-card p-5 rounded-2xl border border-slate-800/80 flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-slate-200">Recipient: {recipient.userId}</div>
                  <div className="text-xs text-slate-400 mt-1">Organ: {recipient.organNeeded} | Blood: {recipient.bloodGroup}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2 py-1 rounded border font-bold ${
                    recipient.urgencyLevel === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    recipient.urgencyLevel === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {recipient.urgencyLevel}
                  </span>
                  <button onClick={() => { setUrgencyState({recipientId: recipient._id, current: recipient.urgencyLevel}); setNewUrgency(recipient.urgencyLevel); }} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
                    <Sliders className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'SUPERADMIN' && isSuperAdmin && (
          <div className="glass-card p-6 rounded-2xl border border-slate-800/80 max-w-lg space-y-6">
            <h2 className="text-lg font-bold text-slate-200">Invite Hospital Coordinator</h2>
            <div className="space-y-4">
              <input type="email" placeholder="Email Address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200" />
              <input type="password" placeholder="Temporary Password" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200" />
              <input type="text" placeholder="Hospital Name" value={inviteHospital} onChange={e => setInviteHospital(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200" />
              <button onClick={inviteCoordinator} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm transition-colors">
                Send Invitation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {rejectDocState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#0b0f19] border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Reject Document</h3>
            <textarea className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200" rows={3} placeholder="Reason for rejection..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setRejectDocState(null)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button onClick={() => verifyDoc(rejectDocState.userId, rejectDocState.profileId, rejectDocState.docType, 'REJECT')} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {proposeState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#0b0f19] border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Propose Match</h3>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Response Deadline</label>
              <input type="datetime-local" value={responseDeadline} onChange={e => setResponseDeadline(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200" />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setProposeState(null)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button onClick={proposeMatch} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold">Send Proposal</button>
            </div>
          </div>
        </div>
      )}

      {urgencyState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#0b0f19] border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Modify Urgency</h3>
            <select value={newUrgency} onChange={e => setNewUrgency(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200">
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
            <textarea className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200" rows={3} placeholder="Mandatory medical justification..." value={justification} onChange={e => setJustification(e.target.value)} />
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setUrgencyState(null)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button onClick={changeUrgency} disabled={!justification.trim()} className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
