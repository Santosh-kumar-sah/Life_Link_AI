import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { io, Socket } from "socket.io-client";
import { fetchClient } from "../utils/fetchClient";
import { RecipientProfile, Match, Message } from "../types/api";
import {
  Activity, Heart, Droplets, Weight, Clock, AlertTriangle, Navigation, Edit2, X, ChevronUp, ChevronDown, AlertCircle, MapPin, FileText, Upload, CheckCircle2, XCircle, History, MessageSquare, Send
} from "lucide-react";

const profileSchema = z.object({
  organNeeded: z.enum(["Kidney", "Liver", "Heart", "Lung", "Pancreas"]),
  bloodGroup: z.enum(["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]),
  weight: z.number().min(20).max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function RecipientDashboard() {
  const [profile, setProfile] = useState<RecipientProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"LIVE" | "HISTORY">("LIVE");

  const [docFileUrl, setDocFileUrl] = useState("https://example.com/mock-referral.pdf");
  const [docType, setDocType] = useState("ID");
  const [isUploading, setIsUploading] = useState(false);

  const [declineMatchId, setDeclineMatchId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { weight: 65 }
  });

  const fetchDashboardData = async () => {
    try {
      const [profileRes, matchesRes] = await Promise.all([
        fetchClient<RecipientProfile>("/api/v1/recipients/profile"),
        fetchClient<Match[]>("/api/v1/matches")
      ]);
      if (profileRes) {
        setProfile(profileRes);
        reset({
          organNeeded: profileRes.organNeeded,
          bloodGroup: profileRes.bloodGroup,
          weight: profileRes.weight,
          latitude: profileRes.location?.coordinates?.[1] || 0,
          longitude: profileRes.location?.coordinates?.[0] || 0,
        });
        setMessages([
          { _id: "m1", recipientId: profileRes._id, text: "When will my matching score be updated?", response: "Scores update dynamically upon new donor registrations.", status: "RESOLVED", createdAt: new Date(Date.now() - 86400000).toISOString() }
        ]);
      }
      if (matchesRes) {
        setMatches(matchesRes);
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
      const res = await fetchClient<RecipientProfile>("/api/v1/recipients/profile", {
        method: "POST",
        json: { ...data, urgencyLevel: profile?.urgencyLevel || "LOW" }
      });
      if (res) {
        setProfile(res);
        setIsEditing(false);
      }
    } catch (err) { console.error("Failed to save profile", err); }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation is not supported by your browser");
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

  const uploadDocument = async () => {
    if (!profile) return;
    setIsUploading(true);
    try {
      const res = await fetchClient<RecipientProfile>("/api/v1/recipients/documents", {
        method: "POST",
        json: { fileUrl: docFileUrl, docType }
      });
      if (res) setProfile(res);
    } catch (err) { console.error(err); }
    setIsUploading(false);
  };

  const sendMessage = async () => {
    if (!profile || !newMessage.trim()) return;
    setIsSendingMsg(true);
    try {
      const res = await fetchClient<Message>("/api/v1/recipients/messages", {
        method: "POST",
        json: { text: newMessage }
      });
      if (res) {
        setMessages([res, ...messages]);
        setNewMessage("");
      } else {
        const mockMsg: Message = { _id: Date.now().toString(), recipientId: profile._id, text: newMessage, status: "PENDING", createdAt: new Date().toISOString() };
        setMessages([mockMsg, ...messages]);
        setNewMessage("");
      }
    } catch (err) {
      const mockMsg: Message = { _id: Date.now().toString(), recipientId: profile._id, text: newMessage, status: "PENDING", createdAt: new Date().toISOString() };
      setMessages([mockMsg, ...messages]);
      setNewMessage("");
    }
    setIsSendingMsg(false);
  };

  const respondToMatch = async (matchId: string, action: "ACCEPT" | "DECLINE", reason?: string) => {
    try {
      const res = await fetchClient<Match>(`/api/v1/matches/${matchId}/respond`, {
        method: "POST",
        json: { action, reason }
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

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Activity className="w-8 h-8 animate-spin text-[#1F6F5C]" /></div>;

  const liveMatches = matches.filter(m => m.recipientStatus === "PENDING" || m.status === "PENDING" || m.recipientStatus === "ACCEPTED");
  const pastMatches = matches.filter(m => m.recipientStatus === "DECLINED" || m.status === "COMPLETED" || m.status === "DECLINED");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#1F6F5C] to-[#3C8B6E] bg-clip-text text-transparent font-serif-fraunces">
            Recipient Hub
          </h1>
          <p className="text-[#4A5C55] text-sm mt-1">Manage your organ needs and coordinate with medical staff.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 space-y-6">
          
          {profile && (
            <div className="paper-card p-5 rounded-2xl border border-[#DAD3C2]">
              <h3 className="text-sm font-bold text-[#12231F] mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[#C4453D]" /> Waitlist Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-[#F3EFE6] p-3 rounded-lg border border-[#DAD3C2]">
                  <span className="text-xs text-[#4A5C55]">Urgency Level</span>
                  <span className={`text-xs px-2 py-1 rounded border font-bold ${
                    profile.urgencyLevel === 'CRITICAL' ? 'bg-[#C4453D]/10 text-[#C4453D] border-[#C4453D]/20' :
                    profile.urgencyLevel === 'HIGH' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                    'bg-[#1F6F5C]/10 text-[#1F6F5C] border-[#1F6F5C]/20'
                  }`}>
                    {profile.urgencyLevel}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-[#F3EFE6] p-3 rounded-lg border border-[#DAD3C2]">
                  <span className="text-xs text-[#4A5C55]">Registration Date</span>
                  <span className="text-xs text-[#12231F] font-medium font-mono">
                    {profile.registrationDate ? new Date(profile.registrationDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!profile || isEditing ? (
            <div className="paper-card p-6 rounded-2xl border border-[#DAD3C2]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2 text-[#12231F]"><Heart className="w-5 h-5 text-[#C4453D] fill-[#C4453D]/10" /> Request Profile</h2>
                {profile && <button onClick={() => setIsEditing(false)} className="text-[#4A5C55] hover:text-[#12231F] p-1"><X className="w-4 h-4" /></button>}
              </div>
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#4A5C55] font-medium">Organ Needed</label>
                  <select {...register("organNeeded")} className="w-full bg-white border border-[#DAD3C2] rounded-xl px-4 py-2.5 text-sm text-[#12231F] focus:outline-none focus:border-[#1F6F5C]">
                    <option value="Kidney">Kidney</option>
                    <option value="Liver">Liver</option>
                    <option value="Heart">Heart</option>
                    <option value="Lung">Lung</option>
                    <option value="Pancreas">Pancreas</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#4A5C55] font-medium">Blood Group</label>
                  <select {...register("bloodGroup")} className="w-full bg-white border border-[#DAD3C2] rounded-xl px-4 py-2.5 text-sm text-[#12231F] focus:outline-none focus:border-[#1F6F5C]">
                    {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#4A5C55] font-medium">Weight (kg)</label>
                  <input type="number" {...register("weight", { valueAsNumber: true })} className="w-full bg-white border border-[#DAD3C2] rounded-xl px-4 py-2.5 text-sm text-[#12231F] focus:outline-none focus:border-[#1F6F5C]" />
                  {errors.weight && <p className="text-[#C4453D] text-xs">{errors.weight.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-[#4A5C55] font-medium">Latitude</label>
                    <input type="number" step="any" {...register("latitude", { valueAsNumber: true })} className="w-full bg-white border border-[#DAD3C2] rounded-xl px-4 py-2.5 text-sm text-[#12231F] focus:outline-none focus:border-[#1F6F5C]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#4A5C55] font-medium">Longitude</label>
                    <input type="number" step="any" {...register("longitude", { valueAsNumber: true })} className="w-full bg-white border border-[#DAD3C2] rounded-xl px-4 py-2.5 text-sm text-[#12231F] focus:outline-none focus:border-[#1F6F5C]" />
                  </div>
                </div>
                <button type="button" onClick={handleGetLocation} className="w-full inline-flex items-center justify-center gap-2 py-2 bg-[#E8E2D4] hover:bg-[#DAD3C2] text-[#1F6F5C] rounded-xl text-xs font-semibold">
                  <Navigation className="w-3.5 h-3.5 animate-pulse" /> {geoLoading ? "Detecting..." : "Auto Detect Coordinates"}
                </button>
                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#1F6F5C] hover:bg-[#154C3F] text-white rounded-xl font-bold text-sm transition-colors">Save Request</button>
              </form>
            </div>
          ) : (
            <div className="paper-card p-6 rounded-2xl border border-[#DAD3C2] space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-[#12231F]">Active Request</h2>
                <button onClick={() => setIsEditing(true)} className="text-[#1F6F5C] hover:text-[#154C3F]"><Edit2 className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-[#C4453D]" />
                <div className="text-sm"><span className="text-[#4A5C55] text-xs block">Organ</span><span className="text-[#12231F]">{profile.organNeeded}</span></div>
              </div>
              <div className="flex items-center gap-3">
                <Droplets className="w-5 h-5 text-[#C4453D]" />
                <div className="text-sm"><span className="text-[#4A5C55] text-xs block">Blood Group</span><span className="font-mono text-[#12231F]">{profile.bloodGroup}</span></div>
              </div>
              <div className="flex items-center gap-3">
                <Weight className="w-5 h-5 text-[#3C8B6E]" />
                <div className="text-sm"><span className="text-[#4A5C55] text-xs block">Weight</span><span className="text-[#12231F]">{profile.weight} kg</span></div>
              </div>
            </div>
          )}

          {profile && (
            <div className="paper-card p-6 rounded-2xl border border-[#DAD3C2] space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-[#12231F]"><FileText className="w-5 h-5 text-[#1F6F5C]" /> Documents</h2>
              <div className="space-y-3">
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full bg-white border border-[#DAD3C2] rounded-xl px-3 py-2 text-sm text-[#12231F] focus:outline-none focus:border-[#1F6F5C]">
                  <option value="ID">Identity Proof</option>
                  <option value="physician_referral">Physician Referral</option>
                  <option value="medical_records">Medical Records</option>
                </select>
                <div className="flex gap-2">
                  <input type="text" value={docFileUrl} onChange={(e) => setDocFileUrl(e.target.value)} placeholder="Mock File URL" className="flex-1 bg-white border border-[#DAD3C2] rounded-xl px-3 py-2 text-sm text-[#12231F] focus:outline-none focus:border-[#1F6F5C]" />
                  <button onClick={uploadDocument} disabled={isUploading} className="px-4 py-2 bg-[#1F6F5C] hover:bg-[#154C3F] rounded-xl text-white flex items-center">
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

          {profile && (
            <div className="paper-card p-6 rounded-2xl border border-[#DAD3C2] flex flex-col h-80">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-[#12231F]"><MessageSquare className="w-5 h-5 text-[#1F6F5C]" /> Coordinator Support</h2>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="text-[#4A5C55] text-xs text-center mt-10">No messages yet.</div>
                ) : (
                  messages.map(msg => (
                    <div key={msg._id} className="bg-white p-3 rounded-xl border border-[#DAD3C2] space-y-2 shadow-sm">
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-[#12231F]">{msg.text}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${msg.status === 'RESOLVED' ? 'bg-[#3C8B6E]/10 text-[#3C8B6E] border-[#3C8B6E]/20' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                          {msg.status}
                        </span>
                      </div>
                      {msg.response && (
                        <div className="bg-[#F3EFE6] p-2 rounded-lg mt-2 border border-[#E8E2D4]">
                          <p className="text-xs text-[#4A5C55]"><span className="text-[#1F6F5C] font-semibold">Coordinator:</span> {msg.response}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2 mt-auto">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-white border border-[#DAD3C2] rounded-xl px-3 py-2 text-sm text-[#12231F] focus:outline-none focus:border-[#1F6F5C]"
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage} disabled={isSendingMsg || !newMessage.trim()} className="px-3 py-2 bg-[#1F6F5C] hover:bg-[#154C3F] rounded-xl text-white flex items-center">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4 border-b border-[#DAD3C2]">
            <button
              className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'LIVE' ? 'border-[#1F6F5C] text-[#1F6F5C]' : 'border-transparent text-[#4A5C55] hover:text-[#12231F]'}`}
              onClick={() => setActiveTab('LIVE')}
            >
              <Activity className="w-4 h-4" /> Live Matches
            </button>
            <button
              className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'HISTORY' ? 'border-[#1F6F5C] text-[#1F6F5C]' : 'border-transparent text-[#4A5C55] hover:text-[#12231F]'}`}
              onClick={() => setActiveTab('HISTORY')}
            >
              <History className="w-4 h-4" /> History
            </button>
          </div>

          {!profile ? (
            <div className="paper-card p-12 rounded-2xl border border-[#DAD3C2] text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-[#1F6F5C]/40 mx-auto" />
              <h3 className="text-base font-bold text-[#12231F]">Registration Required</h3>
              <p className="text-[#4A5C55] text-xs">Create your profile to view matches.</p>
            </div>
          ) : activeTab === 'LIVE' ? (
            <div className="space-y-4">
              {liveMatches.length === 0 ? (
                <div className="paper-card p-12 rounded-2xl border border-[#DAD3C2] text-center">
                  <Clock className="w-12 h-12 text-[#4A5C55]/45 mx-auto animate-pulse mb-3" />
                  <p className="text-[#4A5C55] text-sm">Searching for compatible donors...</p>
                </div>
              ) : (
                liveMatches.map((match) => {
                  const isExpanded = expandedMatch === match._id;
                  const donor = match.donorId as any;
                  return (
                    <div key={match._id} className="paper-card p-5 rounded-2xl border border-[#DAD3C2] transition-all overflow-hidden">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-bold text-[#12231F] flex items-center gap-2">
                            Masked Donor Profile
                            <span className={`px-2 py-0.5 rounded text-xxs font-bold bg-[#E8E2D4] text-[#4A5C55]`}>
                              {match.recipientStatus || match.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-[#4A5C55]">
                            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-[#C4453D]" /> {donor?.organType || profile.organNeeded}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#1F6F5C]" /> Hospital: {donor?.hospital || "General Hospital"}</span>
                          </div>
                          {match.responseDeadline && (
                            <div className="text-xs text-[#C4453D] mt-2 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Deadline: {new Date(match.responseDeadline).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-mono font-black border ${getScoreColor(match.score)}`}>
                            {match.score}% Match
                          </div>
                          <button onClick={() => setExpandedMatch(isExpanded ? null : match._id)} className="p-2 hover:bg-[#E8E2D4] rounded-xl text-[#4A5C55] transition-all">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-[#DAD3C2] animate-in slide-in-from-top-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#F3EFE6] p-3 rounded-xl border border-[#DAD3C2]">
                              <div className="text-xs text-[#4A5C55] mb-1">Organ Size Match</div>
                              <div className="text-sm font-bold text-[#12231F]">Optimal</div>
                            </div>
                            <div className="bg-[#F3EFE6] p-3 rounded-xl border border-[#DAD3C2]">
                              <div className="text-xs text-[#4A5C55] mb-1">Distance</div>
                              <div className="text-sm font-bold text-[#12231F]">Local Area</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {match.recipientStatus !== "ACCEPTED" && match.status !== "ACCEPTED" && (
                        <div className="mt-5 flex gap-3 pt-4 border-t border-[#DAD3C2]">
                          <button onClick={() => respondToMatch(match._id, "ACCEPT")} className="flex-1 py-2 bg-[#3C8B6E] hover:bg-[#2b644f] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                            <CheckCircle2 className="w-4 h-4" /> Accept Offer
                          </button>
                          <button onClick={() => setDeclineMatchId(match._id)} className="flex-1 py-2 bg-[#F3EFE6] hover:bg-[#E8E2D4] text-[#C4453D] border border-[#DAD3C2] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                            <XCircle className="w-4 h-4" /> Decline
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {pastMatches.length === 0 ? (
                <div className="text-center p-8 text-[#4A5C55] text-sm">No match history found.</div>
              ) : (
                pastMatches.map((match) => (
                  <div key={match._id} className="paper-card p-4 rounded-xl border border-[#DAD3C2]">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-[#12231F] flex items-center gap-2">
                        <Heart className="w-4 h-4 text-[#C4453D]/50" />
                        Match ID: <span className="font-mono">{match._id.slice(-6)}</span>
                      </div>
                      <div className="text-xs px-2 py-1 bg-[#F3EFE6] rounded border border-[#DAD3C2] text-[#4A5C55]">
                        {match.recipientStatus || match.status}
                      </div>
                    </div>
                    {match.declineReason && (
                      <div className="text-xs text-[#C4453D] mt-2">Declined: {match.declineReason}</div>
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
            <p className="text-sm text-[#4A5C55]">Please provide a reason for declining this match (e.g., medical reasons, unavailable).</p>
            <textarea
              className="w-full bg-white border border-[#DAD3C2] rounded-xl p-3 text-sm text-[#12231F] focus:outline-none focus:border-[#C4453D]"
              rows={3}
              placeholder="Your reason..."
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
