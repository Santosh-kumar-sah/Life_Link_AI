import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Heart, LogOut, Shield, User as UserIcon } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-500/10 border-purple-500/30 text-purple-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border";
      case "donor":
        return "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border";
      case "recipient":
        return "bg-rose-500/10 border-rose-500/30 text-rose-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border";
      default:
        return "bg-slate-500/10 border-slate-500/30 text-slate-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border";
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand/Logo */}
        <Link to="/" className="flex items-center gap-2 hover:scale-[1.02] transition-transform">
          <Heart className="w-5 h-5 text-red-500 fill-red-500/10 animate-pulse" />
          <span className="text-lg font-black bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent tracking-tight">
            LifeLink
          </span>
        </Link>

        {/* Heartbeat / Live connection */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          heartbeat link active
        </div>

        {/* User context & logouts */}
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-r border-slate-800 pr-4">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                {user.role === "admin" ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-sm font-semibold text-slate-200">{user.email}</div>
                <div className="mt-0.5 flex gap-1">
                  <span className={getRoleBadge(user.role)}>
                    {user.role === "admin" ? "Hospital Admin" : user.role === "donor" ? "Donor" : "Recipient"}
                  </span>
                </div>
              </div>
            </div>

            <NotificationCenter />

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-850 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/20 text-slate-300 hover:text-red-400 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
