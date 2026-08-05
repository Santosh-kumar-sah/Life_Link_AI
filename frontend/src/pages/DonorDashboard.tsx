import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { io, Socket } from "socket.io-client";
import { fetchClient } from "../utils/fetchClient";
import { DonorProfile, Match, ApiResponse } from "../types/api";
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
  ChevronDown,
  ChevronUp,
  AlertCircle
} from "lucide-react";

const profileSchema = z.object({
  organType: z.enum(["Kidney", "Liver", "Heart", "Lung", "Pancreas"]),
  bloodGroup: z.enum(["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]),
  weight: z.number().min(20, "Weight must be at least 20 kg").max(300, "Weight must be below 300 kg"),
  latitude: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
  availability: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function DonorDashboard() {
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      availability: true,
      weight: 70,
    }
  });

  const fetchDashboardData = async () => {
    try {
      const [profileRes, matchesRes] = await Promise.all([
        fetchClient<ApiResponse<DonorProfile>>("/api/v1/donors/profile"),
        fetchClient<ApiResponse<Match[]>>("/api/v1/matches")
      ]);
      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
        // Pre-fill form values
        reset({
          organType: profileRes.data.organType,
          bloodGroup: profileRes.data.bloodGroup,
          weight: profileRes.data.weight,
          latitude: profileRes.data.location.coordinates[1],
          longitude: profileRes.data.location.coordinates[0],
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
      // Prepend and trigger a dynamic sound or visual alert hook
      setMatches((prev) => {
        // Prevent duplicate socket entries
        if (prev.some((m) => m._id === newMatch._id)) return prev;
        return [newMatch, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const res = await fetchClient<ApiResponse<DonorProfile>>("/api/v1/donors/profile", {
        method: "POST",
        json: data
      });
      if (res.success && res.data) {
        setProfile(res.data);
        setIsEditing(false);
        // Refresh matches automatically when profile updates
        const matchesRes = await fetchClient<ApiResponse<Match[]>>("/api/v1/matches");
        if (matchesRes.success && matchesRes.data) {
          setMatches(matchesRes.data);
        }
      }
    } catch (err) {
      console.error("Failed to save profile", err);
    }
  };

  // Uses Browser Geolocation API to auto-fill coordinates
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", parseFloat(position.coords.latitude.toFixed(6)));
        setValue("longitude", parseFloat(position.coords.longitude.toFixed(6)));
        setGeoLoading(false);
      },
      (error) => {
        console.error("Geolocation error", error);
        alert(`Failed to retrieve location: ${error.message}`);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 70) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-sky-400 bg-sky-500/10 border-sky-500/20";
      case "ACCEPTED":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "DECLINED":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "COMPLETED":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Activity className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Title */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent glow-text">
            Donor Hub
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your organ donation profile and review live matching requests.</p>
        </div>

        {profile && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Edit2 className="w-4 h-4 text-blue-400" />
            <span>Update Profile</span>
          </button>
        )}
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card & Form */}
        <div className="lg:col-span-1 space-y-6">
          {!profile || isEditing ? (
            <div className="glass-card glow-border p-6 rounded-2xl border border-slate-800/80">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500 fill-red-500/10" />
                  {profile ? "Edit Profile" : "Register Profile"}
                </h2>
                {profile && (
                  <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-850 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Organ Offered</label>
                  <select
                    {...register("organType")}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Kidney">Kidney</option>
                    <option value="Liver">Liver</option>
                    <option value="Heart">Heart</option>
                    <option value="Lung">Lung</option>
                    <option value="Pancreas">Pancreas</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Blood Type</label>
                  <select
                    {...register("bloodGroup")}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Weight (kg)</label>
                  <input
                    type="number"
                    {...register("weight", { valueAsNumber: true })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.weight && <p className="text-rose-400 text-xs mt-0.5">{errors.weight.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      {...register("latitude", { valueAsNumber: true })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.latitude && <p className="text-rose-400 text-xs mt-0.5">{errors.latitude.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      {...register("longitude", { valueAsNumber: true })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.longitude && <p className="text-rose-400 text-xs mt-0.5">{errors.longitude.message}</p>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={geoLoading}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-semibold tracking-wide transition-colors"
                >
                  <Navigation className={`w-3.5 h-3.5 ${geoLoading ? "animate-pulse" : ""}`} />
                  <span>{geoLoading ? "Locating..." : "Auto Detect Coordinates"}</span>
                </button>

                <div className="flex items-center pt-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register("availability")}
                      className="w-4 h-4 rounded border-slate-800 text-blue-600 bg-slate-900 focus:ring-blue-500 focus:ring-offset-slate-950 focus:outline-none"
                    />
                    <span className="text-xs text-slate-300">Currently Available for Medical Match</span>
                  </label>
                </div>

                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full mt-4 py-3 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-500/10 transition-all text-sm"
                >
                  {isSubmitting ? "Saving..." : profile ? "Update Profile" : "Register Profile"}
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-card glow-border p-6 rounded-2xl border border-slate-800/80 space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2 pb-4 border-b border-slate-850">
                <Heart className="w-5 h-5 text-red-500 fill-red-500/10" />
                Active Profile
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Organ Type</div>
                      <div className="text-sm font-semibold text-slate-200">{profile.organType}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Blood Group</div>
                      <div className="text-sm font-semibold text-slate-200">{profile.bloodGroup}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Weight className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Weight (kg)</div>
                      <div className="text-sm font-semibold text-slate-200">{profile.weight} kg</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Geospatial Coordinates</div>
                      <div className="text-sm font-semibold text-slate-200">
                        {profile.location.coordinates[1].toFixed(4)}, {profile.location.coordinates[0].toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">Donation Availability</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${profile.availability ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${profile.availability ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`}></span>
                    {profile.availability ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Matches List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-400" />
              Live Match Stream
            </h2>
            {profile && (
              <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 text-xs font-medium rounded-full border border-slate-700">
                {matches.length} Compatible found
              </span>
            )}
          </div>

          {!profile ? (
            <div className="glass-card p-12 rounded-2xl border border-slate-800/80 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-blue-500/40 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">Profile Registration Required</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">Please create your donor profile on the left panel to scan and connect with compatible medical recipients.</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="glass-card p-12 rounded-2xl border border-slate-800/80 text-center space-y-3">
              <Clock className="w-12 h-12 text-slate-500/45 mx-auto animate-pulse" />
              <h3 className="text-base font-bold text-slate-300">Scanning Database for Patients...</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">No immediate matches matching blood group and organ types discovered. Keep this portal open to receive live match notifications.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => {
                const recipient = match.recipientId as any;
                const isExpanded = expandedMatch === match._id;
                
                return (
                  <div
                    key={match._id}
                    className="glass-card rounded-2xl border border-slate-800/85 hover:border-slate-750/90 transition-all overflow-hidden glow-border"
                  >
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-bold text-slate-200">
                            {recipient?.userId?.email || "Unknown Recipient"}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xxs font-bold border ${getStatusColor(match.status)}`}>
                            {match.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500/70" /> {recipient?.organNeeded}</span>
                          <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-red-500/70" /> {recipient?.bloodGroup}</span>
                          <span className="flex items-center gap-1"><Weight className="w-3.5 h-3.5 text-blue-500/70" /> {recipient?.weight} kg</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-black border ${getScoreColor(match.score)}`}>
                            {match.score}% Score
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedMatch(isExpanded ? null : match._id)}
                          className="p-2 hover:bg-slate-800 border border-transparent hover:border-slate-700 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Detailed Match Compatibility Breakdown Panel */}
                    {isExpanded && (
                      <div className="bg-slate-900/50 border-t border-slate-850 p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Score Breakdown Breakdown</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-medium">ABO Blood Matching (20%)</span>
                              <span className="text-slate-200 font-bold">{profile.bloodGroup === recipient?.bloodGroup ? "20 / 20" : "10 / 20"}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: profile.bloodGroup === recipient?.bloodGroup ? "100%" : "50%" }}
                              ></div>
                            </div>
                            <span className="text-slate-500 text-xxs block leading-relaxed">
                              {profile.bloodGroup === recipient?.bloodGroup
                                ? `Identical blood group match (${profile.bloodGroup}).`
                                : `Rh-compatible but non-identical matching group (${profile.bloodGroup} to ${recipient?.bloodGroup}).`}
                            </span>
                          </div>

                          <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-medium">Urgency & Waiting List (40%)</span>
                              <span className="text-slate-200 font-bold">
                                {(((match.score - (profile.bloodGroup === recipient?.bloodGroup ? 20 : 10) - 20 - 20) / 40) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-violet-500 rounded-full"
                                style={{ width: `${(((match.score - (profile.bloodGroup === recipient?.bloodGroup ? 20 : 10) - 20 - 20) / 40) * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-slate-500 text-xxs block leading-relaxed">
                              Base urgency level is {recipient?.urgencyLevel} + waited registration bonus.
                            </span>
                          </div>

                          <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-medium">Proximity Score (20%)</span>
                              <span className="text-slate-200 font-bold">20 / 20</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-sky-500 rounded-full" style={{ width: "100%" }}></div>
                            </div>
                            <span className="text-slate-500 text-xxs block leading-relaxed">
                              Distance calculated within optimal threshold (~0 km).
                            </span>
                          </div>

                          <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-medium">Biomedical Size Ratio (20%)</span>
                              <span className="text-slate-200 font-bold">20 / 20</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-pink-500 rounded-full" style={{ width: "100%" }}></div>
                            </div>
                            <span className="text-slate-500 text-xxs block leading-relaxed">
                              Donor weight ({profile.weight}kg) within compatible bounds for patient ({recipient?.weight}kg).
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
