import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { fetchClient } from '../utils/fetchClient';
import { Match, ApiResponse } from '../types/api';
import { Shield, Users, CheckCircle, Activity, Clock } from 'lucide-react';

interface PaginatedMatches {
  matches: Match[];
  total: number;
  page: number;
  pages: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<PaginatedMatches>({ matches: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchMatches = async (page: number) => {
    try {
      const res = await fetchClient<ApiResponse<PaginatedMatches>>(`/api/v1/matches/admin?page=${page}&limit=10`);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin matches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(data.page);

    const socket: Socket = io({ withCredentials: true });
    socket.on('match:admin_new', (newMatch: Match) => {
      setData(prev => ({
        ...prev,
        total: prev.total + 1,
        matches: [newMatch, ...prev.matches].slice(0, 10)
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleStatusUpdate = async (matchId: string, status: string) => {
    setUpdating(matchId);
    try {
      const res = await fetchClient<ApiResponse<Match>>(`/api/v1/matches/admin/${matchId}`, {
        method: 'PATCH',
        json: { status }
      });
      
      if (res.success && res.data) {
        const updatedMatch = res.data;
        setData(prev => ({
          ...prev,
          matches: prev.matches.map(m => m._id === matchId ? updatedMatch : m)
        }));
      }
    } catch (err) {
      console.error('Failed to update match status', err);
    } finally {
      setUpdating(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (score >= 70) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'ACCEPTED': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'DECLINED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'COMPLETED': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const pendingCount = data.matches.filter(m => m.status === 'PENDING').length;
  const completedCount = data.matches.filter(m => m.status === 'COMPLETED').length;

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Activity className="w-8 h-8 animate-spin text-cyan-400" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold glow-text mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            Admin Dashboard
          </h1>
          <p className="text-gray-400">System overview and match management.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass-card px-6 py-3 rounded-xl flex flex-col items-center justify-center border border-slate-700/50">
            <span className="text-2xl font-bold text-white">{data.total}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1"><Users className="w-3 h-3"/> Total Matches</span>
          </div>
          <div className="glass-card px-6 py-3 rounded-xl flex flex-col items-center justify-center border border-slate-700/50">
            <span className="text-2xl font-bold text-blue-400">{pendingCount}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>
          </div>
          <div className="glass-card px-6 py-3 rounded-xl flex flex-col items-center justify-center border border-slate-700/50">
            <span className="text-2xl font-bold text-purple-400">{completedCount}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Completed</span>
          </div>
        </div>
      </header>

      <section className="glass-card rounded-2xl overflow-hidden border border-slate-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-slate-800/50 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-medium">Match Details</th>
                <th className="px-6 py-4 font-medium">Donor</th>
                <th className="px-6 py-4 font-medium">Recipient</th>
                <th className="px-6 py-4 font-medium">Score</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {data.matches.map(match => {
                const donor = match.donorId as any;
                const recipient = match.recipientId as any;
                return (
                  <tr key={match._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{donor?.organType || recipient?.organNeeded}</p>
                      <p className="text-xs text-gray-500">{new Date(match.matchedAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{donor?.userId?.email || 'N/A'}</p>
                      <p className="text-xs text-gray-500">Blood: {donor?.bloodGroup}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{recipient?.userId?.email || 'N/A'}</p>
                      <p className="text-xs text-gray-500">Urgency: <span className="text-red-400">{recipient?.urgencyLevel}</span></p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${getScoreColor(match.score)}`}>
                        {match.score}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(match.status)}`}>
                        {match.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {match.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusUpdate(match._id, 'COMPLETED')}
                          disabled={updating === match._id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {updating === match._id ? <Activity className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data.matches.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No matches found in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {data.pages > 1 && (
          <div className="p-4 border-t border-slate-700/50 flex items-center justify-between bg-slate-800/30">
            <span className="text-sm text-gray-400">
              Page {data.page} of {data.pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchMatches(data.page - 1)}
                disabled={data.page === 1}
                className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => fetchMatches(data.page + 1)}
                disabled={data.page === data.pages}
                className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
