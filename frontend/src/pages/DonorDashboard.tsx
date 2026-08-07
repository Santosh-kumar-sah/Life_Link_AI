import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { io, Socket } from "socket.io-client";
import { fetchClient } from "../utils/fetchClient";
import { DonorProfile, Match, OrganType } from "../types/api";
import {
  Activity, Heart, Droplets, Weight, Clock, MapPin, Edit2, X, Navigation,
  AlertCircle, FileText, Upload, CheckCircle2, XCircle, History
} from "lucide-react";

const profileSchema = z.object({
  bloodGroup: z.enum(["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]),
  weight: z.number().min(20).max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  availability: z.boolean(),
  organType: z.enum(["Kidney", "Liver", "Heart", "Lung", "Pancreas"]),
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
  const [docFileUrl, setDocFileUrl] = useState("https://example.com/mock-id.pdf");
  const [docType, setDocType] = useState("ID");
  const [isUploading, setIsUploading] = useState(false);
  const [declineMatchId, setDeclineMatchId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { availability: true, weight: 70, organType: "Kidney" }
  });

  const fetchDashboardData = async () => {
    try {
      const [profileRes, matchesRes] = await Promise.all([
        fetchClient<DonorProfile>("/api/v1/donors/profile"),
        fetchClient<Match[]>("/api/v1/matches")
      ]);
      if (profileRes) {
        setProfile(profileRes);
        reset({
          bloodGroup: profileRes.bloodGroup,
          weight: profileRes.weight,
          latitude: profileRes.location?.coordinates?.[1] || 0,
          longitude: profileRes.location?.coordinates?.[0] || 0,
          availability: profileRes.availability,
        });
      }
      if (matchesRes) setMatches(matchesRes);
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
      const payload = { ...data, organs: profile?.organs && profile.organs.length > 0 ? profile.organs : [data.organType] };
      const res = await fetchClient<DonorProfile>("/api/v1/donors/profile", {
        method: "POST", json: payload
      });
      if (res) {
        setProfile(res);
        setIsEditing(false);
      }
    } catch (err) { console.error("Failed to save profile", err); }
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
      const res = await fetchClient<DonorProfile>("/api/v1/donors/consent", {
        method: "POST", json: { consent: newConsent }
      });
      if (res) setProfile(res);
    } catch (err) { console.error(err); }
  };

  const toggleOrgan = async (organ: OrganType) => {
    if (!profile) return;
    const currentOrgans = profile.organs || [];
    const newOrgans = currentOrgans.includes(organ)
      ? currentOrgans.filter(o => o !== organ)
      : [...currentOrgans, organ];
    try {
      const res = await fetchClient<DonorProfile>("/api/v1/donors/organs", {
        method: "PATCH", json: { organs: newOrgans }
      });
      if (res) setProfile(res);
    } catch (err) { console.error(err); }
  };

  const uploadDocument = async () => {
    if (!profile) return;
    setIsUploading(true);
    try {
      const res = await fetchClient<DonorProfile>("/api/v1/donors/documents", {
        method: "POST", json: { fileUrl: docFileUrl, docType }
      });
      if (res) setProfile(res);
    } catch (err) { console.error(err); }
    setIsUploading(false);
  };

  const respondToMatch = async (matchId: string, action: "ACCEPT" | "DECLINE", reason?: string) => {
    try {
      const res = await fetchClient<Match>(`/api/v1/matches/${matchId}/respond`, {
        method: "POST", json: { action, reason }
      });
      if (res) {
        setMatches(matches.map(m => m._id === matchId ? res : m));
      }
    } catch (err) { console.error(err); }
    if (action === "DECLINE") setDeclineMatchId(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-[#3C8B6E] bg-[#3C8B6E]/10 border-[#3C8B6E]/20";
    if (score >= 70) return "text-[#1F6F5C] bg-[#1F6F5C]/10 border-[#1F6F5C]/20";
    return "text-[#C4453D] bg-[#C4453D]/10 border-[#C4453D]/20";
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Activity className="w-8 h-8 animate-spin text-[#1F6F5C]" /></div>;
  }

  const liveMatches = matches.filter(m => m.donorStatus === "PENDING" || m.status === "PENDING" || m.donorStatus === "ACCEPTED");
  const pastMatches = matches.filter(m => m.donorStatus === "DECLINED" || m.status === "COMPLETED" || m.status === "DECLINED");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#1F6F5C] to-[#3C8B6E] bg-clip-text text-transparent font-serif-fraunces">
            Donor Hub
          </h1>
          <p className="text-[#4A5C55] text-sm mt-1">Manage your organ donation profile and review live matching requests.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 space-y-6">
          
          {profile && (
            <div className={`paper-card p-5 rounded-2xl border ${profile.explicitConsent ? 'border-[#3C8B6E]/50 bg-[#3C8B6E]/5' : 'border-[#DAD3C2]'} transition-colors`}>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#12231F]">Explicit Consent</h3>
                  <p className="text-xs text-[#4A5C55]">
                    {profile.explicitConsent ? "Active. You are opted-in." : "Inactive. Opt-in required to match."}
                  </p>
                </div>
                <button
                  onClick={toggleConsent}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${profile.explicitConsent ? 'bg-[#3C8B6E]' : 'bg-[#E8E2D4]'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.explicitConsent ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          )}

          {profile && (
            <div className="paper-card p-6 rounded-2xl border border-[#DAD3C2]">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-[#12231F]">
                <Heart className="w-5 h-5 text-[#C4453D] fill-[#C4453D]/10" />
                Organ Selection
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {ORGAN_OPTIONS.map(organ => (
                  <label key={organ} className="flex items-center gap-3 p-2 rounded-xl bg-white border border-[#DAD3C2] cursor-pointer hover:border-[#1F6F5C] transition-colors">
                    <input
                      type="checkbox"
                      checked={profile.organs?.includes(organ)}
                      onChange={() => toggleOrgan(organ)}
                      className="w-4 h-4 rounded border-[#DAD3C2] text-[#1F6F5C] bg-white focus:ring-[#1F6F5C] focus:ring-offset-white"
                    />
                    <span className="text-sm text-[#12231F]">{organ}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {!profile || isEditing ? (
            <div className="paper-card p-6 rounded-2xl border border-[#DAD3C2]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-[#12231F]">Profile Details</h2>
                {profile && (
                  <button onClick={() => setIsEditing(false)} className="text-[#4A5C55] hover:text-[#12231F] p-1">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#4A5C55] font-medium">Blood Type</label>
                  <select {...register("bloodGroup")} className="w-full bg-white border border-[#DAD3C2] rounded-xl px-4 py-2.5 text-sm text-[#12231F] focus:border-[#1F6F5C] focus:outline-none">
                    {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#4A5C55] font-medium">Primary Organ to Donate</label>
                  <select {...register("organType")} className="w-full bg-white border border-[#DAD3C2] rounded-xl px-4 py-2.5 text-sm text-[#12231F] focus:border-[#1F6F5C] focus:outline-none">
                    {ORGAN_OPTIONS.map((org) => <option key={org} value={org}>{org}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#4A5C55] font-medium">Weight (kg)</label>
                  <input type="number" {...register("weight", { valueAsNumber: true })} className="w-full bg-white border border-[#DAD3C2] rounded-xl px-4 py-2.5 text-sm text-[#12231F] focus:border-[#1F6F5C] focus:outline-none" />
                  {errors.weight && <p className="text-[#C4453D] text-xs mt-0.5">{errors.weight.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-[#4A5C55] font-medium">Latitude</label>
                    <input type="number" step="any" {...register("latitude", { valueAsNumber: true })} className="w-full bg-white border border-[#DAD3C2] rounded-xl px-4 py-2.5 text-sm text-[#12231F] focus:border-[#1F6F5C] focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#4A5C55] font-medium">Longitude</label>
                    <input type="number" step="any" {...register("longitude", { valueAsNumber: true })} className="w-full bg-white border border-[#DAD3C2] rounded-xl px-4 py-2.5 text-sm text-[#12231F] focus:border-[#1F6F5C] focus:outline-none" />
                  </div>
                </div>
                <button type="button" onClick={handleGetLocation} className="w-full inline-flex items-center justify-center gap-2 py-2 bg-[#E8E2D4] hover:bg-[#DAD3C2] text-[#1F6F5C] rounded-xl text-xs font-semibold transition-colors">
                  <Navigation className="w-3.5 h-3.5" /> {geoLoading ? "Detecting Location..." : "Auto Detect Coordinates"}
                </button>
                <label className="flex items-center gap-3 cursor-pointer pt-2">
                  <input type="checkbox" {...register("availability")} className="w-4 h-4 rounded border-[#DAD3C2] bg-white text-[#1F6F5C] focus:ring-[#1F6F5C]" />
                  <span className="text-xs text-[#12231F]">Available for Match</span>
                </label>
                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#1F6F5C] hover:bg-[#154C3F] text-white rounded-xl font-bold text-sm shadow-lg transition-colors">
                  Save Profile
                </button>
              </form>
            </div>
          ) : (
            <div className="paper-card p-6 rounded-2xl border border-[#DAD3C2] space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-[#12231F]">Active Profile</h2>
                <button onClick={() => setIsEditing(true)} className="text-[#1F6F5C] hover:text-[#154C3F]"><Edit2 className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-3">
                <Droplets className="w-5 h-5 text-[#C4453D]" />
                <div className="text-sm"><span className="text-[#4A5C55] text-xs block">Blood Group</span><span className="font-mono text-[#12231F]">{profile.bloodGroup}</span></div>
              </div>
              <div className="flex items-center gap-3">
                <Weight className="w-5 h-5 text-[#3C8B6E]" />
                <div className="text-sm"><span className="text-[#4A5C55] text-xs block">Weight</span><span className="text-[#12231F]">{profile.weight} kg</span></div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#1F6F5C]" />
                <div className="text-sm"><span className="text-[#4A5C55] text-xs block">Location</span><span className="text-[#12231F]">{profile.location?.coordinates?.[1]}, {profile.location?.coordinates?.[0]}</span></div>
              </div>
            </div>
          )}

          {profile && (
            <div className="paper-card p-6 rounded-2xl border border-[#DAD3C2] space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-[#12231F]"><FileText className="w-5 h-5 text-[#1F6F5C]" /> Documents</h2>
              <div className="space-y-3">
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full bg-white border border-[#DAD3C2] rounded-xl px-3 py-2 text-sm text-[#12231F] focus:outline-none focus:border-[#1F6F5C]">
                  <option value="ID">Identity Proof</option>
                  <option value="medical_records">Medical Records</option>
                </select>
                <div className="flex gap-2">
                  <input type="text" value={docFileUrl} onChange={(e) => setDocFileUrl(e.target.value)} placeholder="Mock File URL" className="flex-1 bg-white border border-[#DAD3C2] rounded-xl px-3 py-2 text-sm text-[#12231F] focus:outline-none focus:border-[#1F6F5C]" />
                  <button onClick={uploadDocument} disabled={isUploading} className="px-4 py-2 bg-[#1F6F5C] hover:bg-[#154C3F] rounded-xl text-white text-sm font-semibold flex items-center transition-colors">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {profile.verificationDocuments && profile.verificationDocuments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-xs font-semibold text-[#4A5C55] uppercase">Uploaded Files</h3>
                  {profile.verificationDocuments.map((doc, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-[#F3EFE6] p-3 rounded-lg border border-[#DAD3C2]">
                      <div className="text-sm text-[#12231F] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#4A5C55]" /> {doc.docType}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full border ${
                        doc.status === 'VERIFIED' ? 'bg-[#3C8B6E]/10 text-[#3C8B6E] border-[#3C8B6E]/20' :
                        doc.status === 'REJECTED' ? 'bg-[#C4453D]/10 text-[#C4453D] border-[#C4453D]/20' :
                        'bg-[#E8E2D4] text-[#4A5C55] border-[#DAD3C2]'
                      }`}>
                        {doc.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4 border-b border-[#DAD3C2]">
            <button
              className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'LIVE' ? 'border-[#1F6F5C] text-[#1F6F5C]' : 'border-transparent text-[#4A5C55] hover:text-[#12231F]'}`}
              onClick={() => setActiveTab('LIVE')}
            >
              <Activity className="w-4 h-4" /> Live Requests
            </button>
            <button
              className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'HISTORY' ? 'border-[#1F6F5C] text-[#1F6F5C]' : 'border-transparent text-[#4A5C55] hover:text-[#12231F]'}`}
              onClick={() => setActiveTab('HISTORY')}
            >
              <History className="w-4 h-4" /> Match History
            </button>
          </div>

          {!profile ? (
            <div className="paper-card p-12 rounded-2xl border border-[#DAD3C2] text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-[#1F6F5C]/40 mx-auto" />
              <h3 className="text-base font-bold text-[#12231F]">Profile Required</h3>
              <p className="text-[#4A5C55] text-xs">Create your donor profile to view matches.</p>
            </div>
          ) : activeTab === 'LIVE' ? (
            <div className="space-y-4">
              {liveMatches.length === 0 ? (
                <div className="paper-card p-12 rounded-2xl border border-[#DAD3C2] text-center">
                  <Clock className="w-12 h-12 text-[#4A5C55]/45 mx-auto animate-pulse mb-3" />
                  <p className="text-[#4A5C55] text-sm">Scanning for compatible patients...</p>
                </div>
              ) : (
                liveMatches.map((match) => (
                  <div key={match._id} className="paper-card p-5 rounded-2xl border border-[#DAD3C2] transition-all">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="text-sm font-bold text-[#12231F] flex items-center gap-2">
                          Masked Recipient
                          <span className={`px-2 py-0.5 rounded text-xxs font-bold bg-[#E8E2D4] text-[#4A5C55]`}>
                            {match.donorStatus || match.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-[#4A5C55]">
                          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-[#C4453D]" /> {(match.recipientId as any)?.organNeeded || "Organ"}</span>
                          <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-[#C4453D]" /> Urgency: {(match.recipientId as any)?.urgencyLevel}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#1F6F5C]" /> Hospital: {(match.recipientId as any)?.hospital || "General Hospital"}</span>
                        </div>
                        {match.responseDeadline && (
                          <div className="text-xs text-[#C4453D] mt-2 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Deadline: {new Date(match.responseDeadline).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-mono font-black border ${getScoreColor(match.score)}`}>
                        {match.score}% Score
                      </div>
                    </div>
                    {match.donorStatus !== "ACCEPTED" && match.status !== "ACCEPTED" && (
                      <div className="mt-5 flex gap-3 pt-4 border-t border-[#DAD3C2]">
                        <button onClick={() => respondToMatch(match._id, "ACCEPT")} className="flex-1 py-2 bg-[#3C8B6E] hover:bg-[#1F6F5C] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                          <CheckCircle2 className="w-4 h-4" /> Accept Match
                        </button>
                        <button onClick={() => setDeclineMatchId(match._id)} className="flex-1 py-2 bg-[#F3EFE6] hover:bg-[#E8E2D4] text-[#C4453D] border border-[#DAD3C2] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
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
                <div className="text-center p-8 text-[#4A5C55] text-sm">No past matches found.</div>
              ) : (
                pastMatches.map((match) => (
                  <div key={match._id} className="paper-card p-4 rounded-xl border border-[#DAD3C2]">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-[#12231F]">
                        Match ID: <span className="font-mono">{match._id.slice(-6)}</span> • {(match.recipientId as any)?.organNeeded}
                      </div>
                      <div className="text-xs px-2 py-1 bg-[#F3EFE6] rounded border border-[#DAD3C2] text-[#4A5C55]">
                        {match.donorStatus || match.status}
                      </div>
                    </div>
                    {match.declineReason && (
                      <div className="text-xs text-[#C4453D] mt-2">Reason: {match.declineReason}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {declineMatchId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#12231F]/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#FBFAF7] border border-[#DAD3C2] p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[#12231F] font-serif-fraunces">Decline Match</h3>
            <p className="text-sm text-[#4A5C55]">Please provide a reason for declining this match. This helps coordinators understand availability.</p>
            <textarea
              className="w-full bg-white border border-[#DAD3C2] rounded-xl p-3 text-sm text-[#12231F] focus:outline-none focus:border-[#C4453D]"
              rows={3}
              placeholder="e.g., Not feeling well, travel plans..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setDeclineMatchId(null)} className="px-4 py-2 text-sm text-[#4A5C55] hover:text-[#12231F]">Cancel</button>
              <button onClick={() => respondToMatch(declineMatchId, "DECLINE", declineReason)} className="px-4 py-2 bg-[#C4453D] hover:bg-[#9c3731] text-white rounded-xl text-sm font-semibold transition-colors">Confirm Decline</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
