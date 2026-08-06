import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { io, Socket } from "socket.io-client";
import { fetchClient } from "../utils/fetchClient";
import { DonorProfile, Match, ApiResponse, OrganType } from "../types/api";
import {
  Activity,
  Heart,
  Droplets,
  Weight,
  Clock,
  MapPin,
  Edit2,
  X,
  Navigation,
  AlertCircle,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  History
} from "lucide-react";

const profileSchema = z.object({
  bloodGroup: z.enum(["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]),
  weight: z.number().min(20).max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  availability: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ORGAN_OPTIONS: OrganType[] = ["Kidney", "Liver", "Heart", "Lung", "Pancreas"];

export default function DonorDashboard() {
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"LIVE" | "HISTORY">("LIVE");

  // Document upload state
  const [docFileUrl, setDocFileUrl] = useState("https://example.com/mock-id.pdf");
  const [docType, setDocType] = useState("ID");
  const [isUploading, setIsUploading] = useState(false);

  // Decline modal state
  const [declineMatchId, setDeclineMatchId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { availability: true, weight: 70 }
  });

  const fetchDashboardData = async () => {
    try {
      const [profileRes, matchesRes] = await Promise.all([
        fetchClient<ApiResponse<DonorProfile>>("/api/v1/donors/profile"),
        fetchClient<ApiResponse<Match[]>>("/api/v1/matches")
      ]);
      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
        reset({
          bloodGroup: profileRes.data.bloodGroup,
          weight: profileRes.data.weight,
          latitude: profileRes.data.location?.coordinates?.[1] || 0,
          longitude: profileRes.data.location?.coordinates?.[0] || 0,
          availability: profileRes.data.availability,
        });
      }
      if (matchesRes.success && matchesRes.data) {
        setMatches(matchesRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const socket: Socket = io({ withCredentials: true });
    socket.on("match:new", (newMatch: Match) => {
      setMatches((prev) => {
        if (prev.some((m) => m._id === newMatch._id)) return prev;
        return [newMatch, ...prev];
      });
    });
    return () => { socket.disconnect(); };
  }, []);

  const onSubmitProfile = async (data: ProfileFormValues) => {
    try {
      const payload = { ...data, organs: profile?.organs || [] };
      const res = await fetchClient<ApiResponse<DonorProfile>>("/api/v1/donors/profile", {
        method: "POST",
        json: payload
      });
      if (res.success && res.data) {
        setProfile(res.data);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to save profile", err);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation is not supported");
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", parseFloat(pos.coords.latitude.toFixed(6)));
        setValue("longitude", parseFloat(pos.coords.longitude.toFixed(6)));
        setGeoLoading(false);
      },
      () => {
        alert("Failed to retrieve location");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const toggleConsent = async () => {
    if (!profile) return;
    const newConsent = !profile.explicitConsent;
    try {
      const res = await fetchClient<ApiResponse<DonorProfile>>("/api/v1/donors/consent", {
        method: "POST",
        json: { consent: newConsent }
      });
      if (res.success && res.data) setProfile(res.data);
    } catch (err) { console.error(err); }
  };

  const toggleOrgan = async (organ: OrganType) => {
    if (!profile) return;
    const currentOrgans = profile.organs || [];
    const newOrgans = currentOrgans.includes(organ)
      ? currentOrgans.filter(o => o !== organ)
      : [...currentOrgans, organ];
    
    try {
      const res = await fetchClient<ApiResponse<DonorProfile>>("/api/v1/donors/organs", {
        method: "PATCH",
        json: { organs: newOrgans }
      });
      if (res.success && res.data) setProfile(res.data);
    } catch (err) { console.error(err); }
  };

  const uploadDocument = async () => {
    if (!profile) return;
    setIsUploading(true);
    try {
      const res = await fetchClient<ApiResponse<DonorProfile>>("/api/v1/donors/documents", {
        method: "POST",
        json: { fileUrl: docFileUrl, docType }
      });
      if (res.success && res.data) setProfile(res.data);
    } catch (err) { console.error(err); }
    setIsUploading(false);
  };

  const respondToMatch = async (matchId: string, action: "ACCEPT" | "DECLINE", reason?: string) => {
    try {
      const res = await fetchClient<ApiResponse<Match>>(`/api/v1/matches/${matchId}/respond`, {
        method: "POST",
        json: { action, reason }
      });
      if (res.success && res.data) {
        setMatches(matches.map(m => m._id === matchId ? res.data! : m));
      }
    } catch (err) { console.error(err); }
    if (action === "DECLINE") setDeclineMatchId(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 70) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Activity className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  const liveMatches = matches.filter(m => m.donorStatus === "PENDING" || m.status === "PENDING" || m.donorStatus === "ACCEPTED");
  const pastMatches = matches.filter(m => m.donorStatus === "DECLINED" || m.status === "COMPLETED" || m.status === "DECLINED");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent glow-text">
            Donor Hub
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your organ donation profile and review live matching requests.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Panel: Profile, Consent, Organs, Documents */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Consent Card */}
          {profile && (
            <div className={`glass-card p-5 rounded-2xl border ${profile.explicitConsent ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800/80'} transition-colors`}>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-200">Explicit Consent</h3>
                  <p className="text-xs text-slate-400">
                    {profile.explicitConsent ? "Active. You are opted-in." : "Inactive. Opt-in required to match."}
                  </p>
                </div>
                <button
                  onClick={toggleConsent}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${profile.explicitConsent ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.explicitConsent ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          )}

          {/* Organs Selection Card */}
          {profile && (
            <div className="glass-card glow-border p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-red-500 fill-red-500/10" />
                Organ Selection
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {ORGAN_OPTIONS.map(organ => (
                  <label key={organ} className="flex items-center gap-3 p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={profile.organs?.includes(organ)}
                      onChange={() => toggleOrgan(organ)}
                      className="w-4 h-4 rounded border-slate-700 text-blue-600 bg-slate-950 focus:ring-blue-500 focus:ring-offset-slate-900"
                    />
                    <span className="text-sm text-slate-300">{organ}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Profile Form / Display */}
          {!profile || isEditing ? (
            <div className="glass-card glow-border p-6 rounded-2xl border border-slate-800/80">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">Profile Details</h2>
                {profile && (
                  <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white p-1">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Blood Type</label>
                  <select {...register("bloodGroup")} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200">
                    {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Weight (kg)</label>
                  <input type="number" {...register("weight", { valueAsNumber: true })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200" />
                  {errors.weight && <p className="text-rose-400 text-xs mt-0.5">{errors.weight.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Latitude</label>
                    <input type="number" step="any" {...register("latitude", { valueAsNumber: true })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200" />
                    {errors.latitude && <p className="text-rose-400 text-xs mt-0.5">{errors.latitude.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Longitude</label>
                    <input type="number" step="any" {...register("longitude", { valueAsNumber: true })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200" />
                    {errors.longitude && <p className="text-rose-400 text-xs mt-0.5">{errors.longitude.message}</p>}
                  </div>
                </div>
                <button type="button" onClick={handleGetLocation} className="w-full inline-flex items-center justify-center gap-2 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-xs font-semibold">
                  <Navigation className="w-3.5 h-3.5 animate-pulse" /> {geoLoading ? "Detecting Location..." : "Auto Detect Coordinates"}
                </button>
                <label className="flex items-center gap-3 cursor-pointer pt-2">
                  <input type="checkbox" {...register("availability")} className="w-4 h-4 rounded border-slate-800 bg-slate-900" />
                  <span className="text-xs text-slate-300">Available for Match</span>
                </label>
                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-blue-500/20">
                  Save Profile
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-card glow-border p-6 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold">Active Profile</h2>
                <button onClick={() => setIsEditing(true)} className="text-blue-400 hover:text-blue-300"><Edit2 className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-3">
                <Droplets className="w-5 h-5 text-red-400" />
                <div className="text-sm"><span className="text-slate-400 text-xs block">Blood Group</span>{profile.bloodGroup}</div>
              </div>
              <div className="flex items-center gap-3">
                <Weight className="w-5 h-5 text-emerald-400" />
                <div className="text-sm"><span className="text-slate-400 text-xs block">Weight</span>{profile.weight} kg</div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-purple-400" />
                <div className="text-sm"><span className="text-slate-400 text-xs block">Location</span>{profile.location?.coordinates?.[1]}, {profile.location?.coordinates?.[0]}</div>
              </div>
            </div>
          )}

          {/* Documents Card */}
          {profile && (
            <div className="glass-card p-6 rounded-2xl border border-slate-800/80 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-sky-400" /> Documents</h2>
              <div className="space-y-3">
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200">
                  <option value="ID">Identity Proof</option>
                  <option value="medical_records">Medical Records</option>
                </select>
                <div className="flex gap-2">
                  <input type="text" value={docFileUrl} onChange={(e) => setDocFileUrl(e.target.value)} placeholder="Mock File URL" className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200" />
                  <button onClick={uploadDocument} disabled={isUploading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-semibold flex items-center">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {profile.verificationDocuments && profile.verificationDocuments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase">Uploaded Files</h3>
                  {profile.verificationDocuments.map((doc, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                      <div className="text-sm text-slate-200 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" /> {doc.docType}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full border ${
                        doc.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        doc.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {doc.status}
                      </div>
                      {doc.rejectionReason && <div className="text-xs text-red-400 mt-1">{doc.rejectionReason}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Panel: Match Stream & History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4 border-b border-slate-800">
            <button
              className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'LIVE' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              onClick={() => setActiveTab('LIVE')}
            >
              <Activity className="w-4 h-4" /> Live Requests
            </button>
            <button
              className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'HISTORY' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              onClick={() => setActiveTab('HISTORY')}
            >
              <History className="w-4 h-4" /> Match History
            </button>
          </div>

          {!profile ? (
            <div className="glass-card p-12 rounded-2xl border border-slate-800/80 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-blue-500/40 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">Profile Required</h3>
              <p className="text-slate-500 text-xs">Create your donor profile to view matches.</p>
            </div>
          ) : activeTab === 'LIVE' ? (
            <div className="space-y-4">
              {liveMatches.length === 0 ? (
                <div className="glass-card p-12 rounded-2xl border border-slate-800/80 text-center">
                  <Clock className="w-12 h-12 text-slate-500/45 mx-auto animate-pulse mb-3" />
                  <p className="text-slate-400 text-sm">Scanning for compatible patients...</p>
                </div>
              ) : (
                liveMatches.map((match) => (
                  <div key={match._id} className="glass-card p-5 rounded-2xl border border-slate-800/85 hover:border-slate-750/90 transition-all glow-border">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                          Masked Recipient
                          <span className={`px-2 py-0.5 rounded text-xxs font-bold bg-slate-800 text-slate-300`}>
                            {match.donorStatus || match.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500/70" /> {(match.recipientId as any)?.organNeeded || "Organ"}</span>
                          <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-amber-500/70" /> Urgency: {(match.recipientId as any)?.urgencyLevel}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-500/70" /> Hospital: {(match.recipientId as any)?.hospital || "General Hospital"}</span>
                        </div>
                        {match.responseDeadline && (
                          <div className="text-xs text-rose-400 mt-2 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Deadline: {new Date(match.responseDeadline).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-black border ${getScoreColor(match.score)}`}>
                        {match.score}% Score
                      </div>
                    </div>
                    {match.donorStatus !== "ACCEPTED" && match.status !== "ACCEPTED" && (
                      <div className="mt-5 flex gap-3 pt-4 border-t border-slate-800">
                        <button onClick={() => respondToMatch(match._id, "ACCEPT")} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                          <CheckCircle2 className="w-4 h-4" /> Accept Match
                        </button>
                        <button onClick={() => setDeclineMatchId(match._id)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                          <XCircle className="w-4 h-4" /> Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {pastMatches.length === 0 ? (
                <div className="text-center p-8 text-slate-500 text-sm">No past matches found.</div>
              ) : (
                pastMatches.map((match) => (
                  <div key={match._id} className="glass-card p-4 rounded-xl border border-slate-800 opacity-75">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-slate-300">
                        Match ID: {match._id.slice(-6)} • {(match.recipientId as any)?.organNeeded}
                      </div>
                      <div className="text-xs px-2 py-1 bg-slate-900 rounded border border-slate-700 text-slate-400">
                        {match.donorStatus || match.status}
                      </div>
                    </div>
                    {match.declineReason && (
                      <div className="text-xs text-rose-400 mt-2">Reason: {match.declineReason}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Decline Modal */}
      {declineMatchId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#0b0f19] border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-200">Decline Match</h3>
            <p className="text-sm text-slate-400">Please provide a reason for declining this match. This helps coordinators understand availability.</p>
            <textarea
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
              rows={3}
              placeholder="e.g., Not feeling well, travel plans..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setDeclineMatchId(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
              <button onClick={() => respondToMatch(declineMatchId, "DECLINE", declineReason)} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold">Confirm Decline</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
