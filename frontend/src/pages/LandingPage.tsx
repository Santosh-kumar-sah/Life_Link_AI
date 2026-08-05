import { Link } from "react-router-dom";
import { Heart, Activity, MapPin, Award, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-slate-800/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500/10 animate-pulse" />
            <span className="text-xl font-extrabold bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent tracking-tight">
              LifeLink
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-violet-600 rounded-lg shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 text-center flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in mx-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
          Real-time Match Registry Active
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
          Connecting Donors and Patients in{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-500 bg-clip-text text-transparent glow-text">
            Real Time
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          LifeLink simplifies the complex organ matching pipeline with an automated, Rh-aware compatibility engine, geospatial mapping, and instant alerts.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-500 to-violet-600 rounded-xl shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all group"
          >
            Register Profile <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 rounded-xl hover:scale-[1.02] transition-all"
          >
            Access Portal
          </Link>
        </div>

        {/* Dynamic platform stats panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto w-full">
          <div className="glass-card p-6 rounded-2xl border border-slate-800/50 hover:border-slate-700/60 transition-all glow-border">
            <div className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1">
              98.2%
            </div>
            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Compatibility Precision
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-slate-800/50 hover:border-slate-700/60 transition-all glow-border">
            <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent mb-1">
              &lt; 1s
            </div>
            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Notification Delay
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-slate-800/50 hover:border-slate-700/60 transition-all glow-border">
            <div className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-1">
              1,240+
            </div>
            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Matches Monitored
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-slate-800/50 hover:border-slate-700/60 transition-all glow-border">
            <div className="text-3xl font-black bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent mb-1">
              24 / 7
            </div>
            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Hospital Watch Active
            </div>
          </div>
        </div>
      </section>

      {/* Matching Core Technology Section */}
      <section className="bg-slate-900/40 border-y border-slate-800/40 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">
              Real-World Matching Engine Architecture
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Our automated matching algorithms process biomedical details in seconds based on four major criteria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-8 rounded-2xl border border-slate-800/40 hover:border-blue-500/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-3">Rh-Aware Blood Matrix</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Full 8-group blood compatibility logic mapping Rh factors (+/-) to filter donors instantaneously.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-slate-800/40 hover:border-violet-500/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-3">Urgency Rating Bonus</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Matches are weighted by critical need levels and waiting time scores (+1 point per 30 days registered).
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-slate-800/40 hover:border-cyan-500/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-3">Geospatial Proximity</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                MongoDB 2dsphere indexes calculate geographic distances to scale matching and optimize transport.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-slate-800/40 hover:border-pink-500/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-3">Biomedical Size Ratio</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Enforces donor-to-recipient weight ratio validation range to maintain compatibility metrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/50 bg-[#070a12]/80 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span className="font-extrabold text-slate-300">LifeLink v1</span>
          </div>
          <div className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} LifeLink Platform. Designed for healthcare matching.
          </div>
        </div>
      </footer>
    </div>
  );
}
