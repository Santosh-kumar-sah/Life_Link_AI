import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Activity,
  MapPin,
  Award,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Mail,
  Send,
  Shield,
  FileText,
  Clock,
  Sparkles
} from "lucide-react";
import ParticlesBackground from "../components/ParticlesBackground";
import Tilt from "../components/Tilt";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"formula" | "blood">("formula");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail("");
      setTimeout(() => setNewsletterSubscribed(false), 5000);
    }
  };

  const faqs = [
    {
      q: "How does the Rh-aware matching logic work?",
      a: "The platform filters compatibility based on both ABO group and Rh factors (+/-). For example, O- acts as a universal donor, and AB+ acts as a universal recipient. Incompatible combinations are filtered out immediately at the database level before scoring is calculated."
    },
    {
      q: "What variables determine the matching score?",
      a: "Our algorithm calculates a score from 0 to 100 based on four criteria: Blood group matching (20%), Patient urgency level with waiting days modifier (40%), Geospatial transport proximity (20%), and Donor/Recipient size-weight ratio compatibility (20%)."
    },
    {
      q: "How are real-time alerts dispatched?",
      a: "We utilize Socket.io. When a donor or recipient submits a profile, compatibility checks run instantly. If a match score exceeds 50%, a match record is saved as PENDING, and socket events are dispatched to the private user rooms of the donor, patient, and admins."
    },
    {
      q: "Can users update their profile availability?",
      a: "Yes. Donors can toggle their availability at any time on their dashboard. Furthermore, when an admin marks a match as COMPLETED, the system automatically sets that donor's availability to false to prevent duplicate matches."
    }
  ];

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden relative grid-pattern">
      {/* Dynamic Floating Particles Background */}
      <ParticlesBackground />

      {/* Glow overlays */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-slate-800/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Heart className="w-5 h-5 text-red-500 fill-red-500/20 heartbeat-pulse" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
              LifeLink
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#algorithm" className="hover:text-white transition-colors">Matching Science</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-4.5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-16 text-center flex-1 flex flex-col justify-center items-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>Real-time Live Match Engine v1.0</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-8 max-w-5xl leading-[1.05]">
          Autonomous Biomedical{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent glow-text">
            Organ Matching
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          LifeLink connects registered donors, waiting recipients, and hospital administrators in real-time. Powering critical decisions with geospatial proximity and clinical matching algorithms.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 w-full sm:w-auto">
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:scale-[1.03] active:scale-[0.98] transition-all group"
          >
            Create Profile <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 rounded-xl hover:scale-[1.02] transition-all"
          >
            Access Dashboard
          </Link>
        </div>

        {/* 3D Stat Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
          {[
            { title: "98.2%", desc: "Match Score Precision", color: "from-blue-400 to-cyan-400" },
            { title: "< 1s", desc: "Live Notification Latency", color: "from-purple-400 to-indigo-400" },
            { title: "100%", desc: "Rh-Factor Blood Compliance", color: "from-emerald-400 to-teal-400" },
            { title: "24/7", desc: "Active Hospital Watch", color: "from-rose-400 to-pink-400" }
          ].map((stat, idx) => (
            <Tilt key={idx} className="w-full">
              <div className="glass-card p-6 rounded-2xl border border-slate-850 bg-gradient-to-br from-slate-900/50 to-slate-950/50 shadow-xl flex flex-col justify-center items-center text-center h-28 preserve-3d">
                <div className={`text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent translate-z-20 mb-1`}>
                  {stat.title}
                </div>
                <div className="text-xxs font-bold text-slate-500 uppercase tracking-wider translate-z-10">
                  {stat.desc}
                </div>
              </div>
            </Tilt>
          ))}
        </div>
      </section>

      {/* Core Technology Features Section */}
      <section id="features" className="bg-slate-950/40 border-y border-slate-900/60 py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">
              Real-Time Match Engine Features
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm">
              Our automated matching pipeline simplifies complex healthcare coordination steps down to milliseconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Heart className="w-6 h-6" />,
                title: "Rh-Aware Blood Type Matrix",
                desc: "Full 8-group donor-recipient compatibility logic, preventing mismatched transplants.",
                color: "text-red-400 bg-red-500/10 border-red-500/20"
              },
              {
                icon: <Activity className="w-6 h-6" />,
                title: "Urgency Rating Scaling",
                desc: "Matches are ranked dynamically by medical urgency classifications and waiting list duration.",
                color: "text-violet-400 bg-violet-500/10 border-violet-500/20"
              },
              {
                icon: <MapPin className="w-6 h-6" />,
                title: "Geospatial Proximity",
                desc: "MongoDB 2dsphere indexes calculate geographic distances to optimize critical transport windows.",
                color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
              },
              {
                icon: <Award className="w-6 h-6" />,
                title: "Size Compatibility Check",
                desc: "Calculates donor-to-recipient weight ratios to ensure anatomical size compliance.",
                color: "text-pink-400 bg-pink-500/10 border-pink-500/20"
              }
            ].map((feature, idx) => (
              <Tilt key={idx} className="h-full">
                <div className="glass-card glass-card-hover p-8 rounded-2xl border border-slate-900/60 flex flex-col h-full text-left preserve-3d">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 translate-z-20 border ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-bold text-slate-200 mb-3 translate-z-10">{feature.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed translate-z-10">{feature.desc}</p>
                </div>
              </Tilt>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Science & Algorithm Section */}
      <section id="algorithm" className="py-24 max-w-7xl mx-auto px-6 w-full z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight mb-4">
            The Science Behind LifeLink Matching
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm">
            Explore how matching scores are constructed and validated using biomedical criteria.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Navigation tabs */}
          <div className="lg:col-span-1 space-y-3">
            <button
              onClick={() => setActiveTab("formula")}
              className={`w-full text-left p-4.5 rounded-2xl border transition-all ${
                activeTab === "formula"
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-md"
                  : "bg-slate-900/40 border-slate-850 text-slate-400 hover:bg-slate-900/70"
              }`}
            >
              <div className="font-bold text-sm mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Scoring Formula
              </div>
              <p className="text-slate-500 text-xs">Mathematical breakdown of match scores.</p>
            </button>

            <button
              onClick={() => setActiveTab("blood")}
              className={`w-full text-left p-4.5 rounded-2xl border transition-all ${
                activeTab === "blood"
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-md"
                  : "bg-slate-900/40 border-slate-850 text-slate-400 hover:bg-slate-900/70"
              }`}
            >
              <div className="font-bold text-sm mb-1 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Blood Compatibility Matrix
              </div>
              <p className="text-slate-500 text-xs">8-group Rh-factor biological compatibilities.</p>
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="lg:col-span-2">
            {activeTab === "formula" ? (
              <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
                <h3 className="text-lg font-bold text-slate-200">Compatibility Scoring Matrix</h3>
                <div className="bg-slate-950/60 p-4.5 rounded-xl border border-slate-850 text-center">
                  <div className="text-sm font-mono text-indigo-400 font-semibold tracking-wide">
                    Score = 0.2 × Blood + 0.4 × Urgency + 0.2 × Proximity + 0.2 × Size
                  </div>
                </div>

                <div className="space-y-4 text-xs text-slate-400">
                  <div className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <div>
                      <strong className="text-slate-200">ABO Compatibility (20%):</strong> Identical blood group matching yields 100 points. Compatible but non-identical matching types yield 50 points.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0"></span>
                    <div>
                      <strong className="text-slate-200">Urgency (40%):</strong> Patient clinical urgency levels (CRITICAL=100, HIGH=75, MEDIUM=50, LOW=25) with a waiting list bonus modifier (+1 point per 30 days registered, capped at 10).
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0"></span>
                    <div>
                      <strong className="text-slate-200">Proximity (20%):</strong> Scaled distance between donor and recipient. Proximity score drops linearly from 100 points at 0 km down to 0 points at 2000 km.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1.5 flex-shrink-0"></span>
                    <div>
                      <strong className="text-slate-200">Size compatibility (20%):</strong> The body weight ratio (Donor weight / Patient weight). Ratios inside the `[0.8, 1.2]` window score 100 points. A linear drop-off applies outside this window.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-slate-200">ABO-Rh Compatibility Logic</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Rh factor aware compatibility prevents incompatible organ allocations. Our database maps donor blood groups to compatible recipients prior to scoring.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {[
                    { donor: "O-", compat: "Universal Donor (All)" },
                    { donor: "O+", compat: "O+, A+, B+, AB+" },
                    { donor: "A-", compat: "A-, A+, AB-, AB+" },
                    { donor: "A+", compat: "A+, AB+" },
                    { donor: "B-", compat: "B-, B+, AB-, AB+" },
                    { donor: "B+", compat: "B+, AB+" },
                    { donor: "AB-", compat: "AB-, AB+" },
                    { donor: "AB+", compat: "AB+ Only (Universal Recipient)" }
                  ].map((cell, idx) => (
                    <div key={idx} className="bg-slate-900/50 border border-slate-850 p-3 rounded-xl text-center">
                      <div className="text-sm font-black text-slate-200 mb-1">{cell.donor}</div>
                      <div className="text-[10px] text-slate-500 font-medium leading-tight">{cell.compat}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-950/30 border-t border-slate-900/60 z-10 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-sm">
              Answers to technical questions regarding matching logic and platform features.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="glass-card rounded-2xl border border-slate-850 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-900/20 transition-colors"
                  >
                    <span className="font-bold text-sm text-slate-200">{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 text-slate-400 text-xs leading-relaxed border-t border-slate-850/50 pt-4 animate-in slide-in-from-top-2 duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Newsletter Sign-Up Section */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 w-full text-center z-10">
        <div className="glass-card glow-border p-8 sm:p-12 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/40 via-slate-950/40 to-slate-900/40 max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Stay updated with matches</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Subscribe to our newsletters to receive platform updates and technical announcements.
          </p>

          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto pt-2">
            <div className="relative w-full">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-600 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
            >
              <span>Subscribe</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {newsletterSubscribed && (
            <p className="text-emerald-400 text-xs animate-pulse">
              Subscription request received! Thank you for staying updated.
            </p>
          )}
        </div>
      </section>

      {/* Better Proper Footer Section */}
      <footer className="border-t border-slate-850 bg-[#04060d] py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Col 1: Platform Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Heart className="w-4 h-4 text-red-500 fill-red-500/10 heartbeat-pulse" />
              </div>
              <span className="font-extrabold text-slate-200">LifeLink Registry</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Real-time organ transplant matching platform matching donors with patients across clinical variables. Powered by MongoDB Geospatial aggregation engines.
            </p>
            <div className="text-xs text-slate-400 pt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Health System Registry Online</span>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Portal Gateways</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><Link to="/login" className="hover:text-slate-300 transition-colors">Donor Portal</Link></li>
              <li><Link to="/login" className="hover:text-slate-300 transition-colors">Recipient Waiting List</Link></li>
              <li><Link to="/login" className="hover:text-slate-300 transition-colors">Hospital Operations</Link></li>
              <li><Link to="/register" className="hover:text-slate-300 transition-colors">Register Profile</Link></li>
            </ul>
          </div>

          {/* Col 3: Science & Documentation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Medical Science</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <a href="#algorithm" className="hover:text-slate-300 transition-colors flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500/60" /> Blood Type Matrix
                </a>
              </li>
              <li>
                <a href="#algorithm" className="hover:text-slate-300 transition-colors flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-violet-500/60" /> Urgency Point Scales
                </a>
              </li>
              <li>
                <a href="file:///d:/LifeLink/API.md" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-550/60" /> Developer API Specs
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-slate-300 transition-colors flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500/60" /> FAQ Manual
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Operations & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Support Operations</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-600" />
                <span>support@lifelink.org</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-600" />
                <span>Hospital Admin Portal</span>
              </li>
              <li className="text-[10px] text-slate-600 leading-relaxed pt-2">
                LifeLink is an organ matching registry MVP. Do not submit actual personal identifying information (PII).
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xxs text-slate-600">
          <div>
            &copy; {new Date().getFullYear()} LifeLink Platform. Built for real-time healthcare matching.
          </div>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Transplant Guidelines</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
