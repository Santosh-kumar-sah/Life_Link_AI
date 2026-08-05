import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { io, Socket } from 'socket.io-client';
import { fetchClient } from '../utils/fetchClient';
import { DonorProfile, Match, ApiResponse } from '../types/api';
import { Activity, Heart, Droplets, Weight, CheckCircle, Clock } from 'lucide-react';

const profileSchema = z.object({
  organType: z.enum(['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas']),
  bloodGroup: z.enum(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']),
  weight: z.number().min(20).max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  availability: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function DonorDashboard() {
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      availability: true,
      weight: 70,
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileRes, matchesRes] = await Promise.all([
          fetchClient<ApiResponse<DonorProfile>>('/api/v1/donors/profile'),
          fetchClient<ApiResponse<Match[]>>('/api/v1/matches')
        ]);
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        }
        if (matchesRes.success && matchesRes.data) {
          setMatches(matchesRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();

    const socket: Socket = io({ withCredentials: true });
    socket.on('match:new', (newMatch: Match) => {
      setMatches(prev => [newMatch, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const res = await fetchClient<ApiResponse<DonorProfile>>('/api/v1/donors/profile', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.success && res.data) {
        setProfile(res.data);
      }
    } catch (err) {
      console.error('Failed to create profile', err);
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

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Activity className="w-8 h-8 animate-spin text-blue-400" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold glow-text mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-500">
          Donor Dashboard
        </h1>
        <p className="text-gray-400">Manage your profile and view potential matches.</p>
      </header>

      {!profile ? (
        <section className="glass-card glow-border p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Heart className="w-5 h-5 text-blue-400" />
            Create Donor Profile
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Organ to Donate</label>
              <select {...register('organType')} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                <option value="Kidney">Kidney</option>
                <option value="Liver">Liver</option>
                <option value="Heart">Heart</option>
                <option value="Lung">Lung</option>
                <option value="Pancreas">Pancreas</option>
              </select>
              {errors.organType && <p className="text-red-400 text-xs">{errors.organType.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Blood Group</label>
              <select {...register('bloodGroup')} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
              {errors.bloodGroup && <p className="text-red-400 text-xs">{errors.bloodGroup.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Weight (kg)</label>
              <input type="number" {...register('weight', { valueAsNumber: true })} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
              {errors.weight && <p className="text-red-400 text-xs">{errors.weight.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Latitude</label>
              <input type="number" step="any" {...register('latitude', { valueAsNumber: true })} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
              {errors.latitude && <p className="text-red-400 text-xs">{errors.latitude.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Longitude</label>
              <input type="number" step="any" {...register('longitude', { valueAsNumber: true })} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
              {errors.longitude && <p className="text-red-400 text-xs">{errors.longitude.message}</p>}
            </div>

            <div className="space-y-2 flex items-center h-full pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" {...register('availability')} className="w-5 h-5 rounded border-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 bg-slate-800" />
                <span className="text-sm text-gray-300">Currently Available for Donation</span>
              </label>
            </div>

            <div className="md:col-span-2 pt-4">
              <button disabled={isSubmitting} type="submit" className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 text-white rounded-lg font-medium transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                {isSubmitting ? 'Saving...' : 'Create Profile'}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="glass-card glow-border p-6 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Organ</p>
              <p className="text-lg font-semibold">{profile.organType}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl text-red-400">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Blood Group</p>
              <p className="text-lg font-semibold">{profile.bloodGroup}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
              <Weight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Weight</p>
              <p className="text-lg font-semibold">{profile.weight} kg</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Status</p>
              <p className="text-lg font-semibold">{profile.availability ? 'Available' : 'Unavailable'}</p>
            </div>
          </div>
        </section>
      )}

      {profile && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-violet-400" />
            Your Matches
          </h2>
          {matches.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No matches found yet. We'll notify you when a match is found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map(match => {
                const recipient = match.recipientId as any; // Type workaround for populated data
                return (
                  <div key={match._id} className="glass-card animated-hover p-5 rounded-2xl border border-slate-700/50 flex flex-col gap-4 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Recipient</p>
                        <p className="font-medium text-white">{recipient?.userId?.email || 'Unknown User'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(match.score)}`}>
                        {match.score}% Match
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                      <div>
                        <p className="text-gray-500">Organ Needed</p>
                        <p className="font-medium">{recipient?.organNeeded}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Urgency</p>
                        <p className="font-medium text-red-400">{recipient?.urgencyLevel}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-4 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-xs text-gray-500">Matched on {new Date(match.matchedAt).toLocaleDateString()}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(match.status)}`}>
                        {match.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
