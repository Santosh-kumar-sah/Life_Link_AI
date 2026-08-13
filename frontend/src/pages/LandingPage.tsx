import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
  Sparkles,
  Phone
} from "lucide-react";
import MoleculesBackground from "../components/MoleculesBackground";
import Tilt from "../components/Tilt";
import BookFlip from "../components/BookFlip";

gsap.registerPlugin(ScrollTrigger);

// Helper component for magnetic CTA pull effect
const MagneticButton: React.FC<{ children: React.ReactNode; className?: string; to: string }> = ({ children, className = "", to }) => {
  const buttonRef = useRef<HTMLAnchorElement | null>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [shouldDisable, setShouldDisable] = useState(false);

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShouldDisable(isTouch || prefersReduced);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (shouldDisable) return;
    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    // Cap pull translation at max 12px
    const maxPull = 12;
    const factorX = (mouseX / (rect.width / 2)) * maxPull;
    const factorY = (mouseY / (rect.height / 2)) * maxPull;

    setCoords({ x: factorX, y: factorY });
  };

  const handleMouseLeave = () => {
    setCoords({ x: 0, y: 0 });
  };

  return (
    <Link
      ref={buttonRef}
      to={to}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate(${coords.x.toFixed(1)}px, ${coords.y.toFixed(1)}px) scale(1.02)`,
        transition: coords.x === 0 ? "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)" : "transform 0.1s ease-out",
      }}
      className={`inline-flex items-center justify-center transition-shadow shadow-md hover:shadow-lg ${className}`}
    >
      {children}
    </Link>
  );
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [proximityVal, setProximityVal] = useState(45); // Interactive Matching Science Slider
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const pulsePathRef = useRef<SVGPathElement | null>(null);
  const graphRef = useRef<HTMLDivElement | null>(null);

  // Monitor scroll for nav opacity/frosted glass
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // GSAP animated heartbeat stroke drawing
  useEffect(() => {
    const path = pulsePathRef.current;
    if (!path) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      // Just make line static
      gsap.set(path, { strokeDasharray: "none", strokeDashoffset: 0 });
      return;
    }

    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

    gsap.to(path, {
      strokeDashoffset: 0,
      ease: "power2.out",
      scrollTrigger: {
        trigger: path,
        start: "top 80%",
        end: "top 45%",
        scrub: 1.5,
      }
    });
  }, []);

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
    <div className="min-h-screen bg-[#FBFAF7] text-[#12231F] flex flex-col selection:bg-[#1F6F5C]/10 selection:text-[#1F6F5C] overflow-x-hidden relative warm-grid">
      {/* Ambient Canvas Molecular background (Hero background only) */}
      <div className="absolute top-0 left-0 right-0 h-[800px] overflow-hidden pointer-events-none z-0">
        <MoleculesBackground />
      </div>

      {/* Header (Transparent over hero, glass slider on scroll) */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-slide py-3.5" : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1F6F5C]/10 flex items-center justify-center border border-[#1F6F5C]/20">
              <Heart className="w-5 h-5 text-[#1F6F5C] fill-[#1F6F5C]/10 heartbeat-pulse" />
            </div>
            <span className="text-lg font-black tracking-tight text-[#12231F] font-serif-fraunces">
              LifeLink
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-[#4A5C55]">
            <a href="#features" className="hover-underline hover:text-[#1F6F5C] transition-colors">Features</a>
            <a href="#algorithm" className="hover-underline hover:text-[#1F6F5C] transition-colors">Matching Science</a>
            <a href="#casefile" className="hover-underline hover:text-[#1F6F5C] transition-colors">Case File</a>
            <a href="#faq" className="hover-underline hover:text-[#1F6F5C] transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-6">
            <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-[#4A5C55] hover:text-[#1F6F5C] transition-colors">
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-4.5 py-2.5 bg-[#1F6F5C] hover:bg-[#154C3F] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-16 text-center z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-[#1F6F5C]/10 border border-[#1F6F5C]/20 text-[#1F6F5C] rounded-full text-[10px] font-bold uppercase tracking-wider mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time Clinical Registry Engine</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 max-w-5xl text-[#12231F] font-serif-fraunces leading-[1.1]"
        >
          Connecting donor willingness with patient waiting list{" "}
          <span className="text-[#1F6F5C] italic">precision.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-sm sm:text-base text-[#4A5C55] max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          LifeLink links clinical registries, matching patient ABO compatibility and geospatial proximity to secure vital transport corridors in milliseconds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 w-full sm:w-auto"
        >
          {/* Magnetic CTA Buttons */}
          <MagneticButton
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#1F6F5C] hover:bg-[#154C3F] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-[#1F6F5C]/10"
          >
            Create Your Profile <ArrowRight className="w-4 h-4 ml-2" />
          </MagneticButton>
          <MagneticButton
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#F3EFE6] hover:bg-[#E8E2D4] border border-[#DAD3C2] text-[#12231F] text-xs font-bold uppercase tracking-wider rounded-xl"
          >
            Access Dashboard
          </MagneticButton>
        </motion.div>

        {/* Signature Pulse Line Draw to Graph resolver */}
        <div className="w-full max-w-5xl mx-auto relative mt-6 pb-20">
          <svg
            viewBox="0 0 1000 120"
            className="w-full h-auto text-[#1F6F5C]/25"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {/* Heartbeat pulse path */}
            <path
              ref={pulsePathRef}
              d="M0 60 L300 60 L320 60 L330 30 L340 90 L350 60 L360 60 L370 20 L380 100 L390 60 L400 60 L410 45 L420 75 L430 60 L450 60 L1000 60"
              stroke="#1F6F5C"
              strokeWidth="2.5"
            />
          </svg>

          {/* Node chart overlay */}
          <div ref={graphRef} className="absolute inset-0 flex justify-between items-center px-20">
            <div className="paper-card p-3 rounded-xl flex items-center gap-2 border border-[#DAD3C2]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1F6F5C] animate-ping" />
              <span className="text-[10px] font-mono uppercase text-[#4A5C55]">Donor Register</span>
            </div>
            <div className="paper-card p-3 rounded-xl flex items-center gap-2 border border-[#DAD3C2]">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span className="text-[10px] font-mono uppercase text-[#4A5C55]">Match Engine</span>
            </div>
            <div className="paper-card p-3 rounded-xl flex items-center gap-2 border border-[#DAD3C2]">
              <MapPin className="w-4 h-4 text-[#C4453D]" />
              <span className="text-[10px] font-mono uppercase text-[#4A5C55]">Hospital Hub</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip - 3D Tilt blocks */}
      <section className="bg-[#F3EFE6] border-y border-[#DAD3C2]/80 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "98.2%", desc: "Scoring Match Accuracy" },
              { title: "< 2 Mins", desc: "Live Match Calculation" },
              { title: "100%", desc: "ABO Compliant Validation" },
              { title: "24/7", desc: "Active Coordinator Oversight" }
            ].map((stat, idx) => (
              <Tilt key={idx} className="w-full">
                <div className="paper-card p-6 rounded-2xl flex flex-col justify-center items-center text-center h-28 preserve-3d">
                  <div className="text-3xl font-bold font-mono text-[#1F6F5C] mb-1">
                    {stat.title}
                  </div>
                  <div className="text-[10px] font-mono text-[#4A5C55] uppercase tracking-wider">
                    {stat.desc}
                  </div>
                </div>
              </Tilt>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid with staggered entrances */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#12231F] font-serif-fraunces mb-4">
              Real-time matching coordination
            </h2>
            <p className="text-sm text-[#4A5C55] max-w-xl mx-auto leading-relaxed">
              Medical coordination systems engineered to automate validation checking and coordinate critical matching metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Heart className="w-5 h-5" />,
                title: "ABO-Rh Compatibilities",
                desc: "Biological compliance checkers matching patient O-Rh compatibility with donor listings.",
                accent: "border-[#1F6F5C]/20"
              },
              {
                icon: <Activity className="w-5 h-5" />,
                title: "Urgency Multipliers",
                desc: "Calculates list priority based on severity indicators and length of registration date.",
                accent: "border-amber-500/20"
              },
              {
                icon: <MapPin className="w-5 h-5" />,
                title: "Transport Proximity",
                desc: "MongoDB 2dsphere indexes computing transport distances inside local hospital scopes.",
                accent: "border-blue-500/20"
              },
              {
                icon: <Award className="w-5 h-5" />,
                title: "Anatomical Weight Check",
                desc: "Calculates donor weight mass matching indexes to confirm organ size compliance.",
                accent: "border-pink-500/20"
              }
            ].map((feat, idx) => (
              <Tilt key={idx} className="h-full">
                <div className={`paper-card p-8 rounded-2xl border ${feat.accent} flex flex-col justify-between h-full preserve-3d`}>
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#F3EFE6] border border-[#DAD3C2] flex items-center justify-center mb-6 text-[#1F6F5C]">
                      {feat.icon}
                    </div>
                    <h3 className="text-base font-bold text-[#12231F] font-serif-fraunces mb-3">{feat.title}</h3>
                    <p className="text-xs text-[#4A5C55] leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              </Tilt>
            ))}
          </div>
        </div>
      </section>

      {/* Matching Science Section (ABO grid + Interactive slider inside Glass panel) */}
      <section id="algorithm" className="py-24 bg-[#F3EFE6] border-y border-[#DAD3C2]/65 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#12231F] font-serif-fraunces mb-4">
              Match Engine compatibility science
            </h2>
            <p className="text-sm text-[#4A5C55] max-w-xl mx-auto">
              Our clinical matrix combines geospatial thresholds and biological compatibility indices to calculate transplant suitability.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left Column: Frosted Glass Panel ABO grid */}
            <div className="glass-slide p-6 sm:p-8 rounded-3xl space-y-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#1F6F5C] font-bold">Slide Ref: ABO-Rh</span>
                <h3 className="text-lg font-bold font-serif-fraunces text-[#12231F] mt-1">Rh-Aware Compatibility Matrices</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center">
                {[
                  { d: "O-", r: "Universal (All)" },
                  { d: "O+", r: "Rh+ Only" },
                  { d: "A-", r: "A / AB" },
                  { d: "A+", r: "A+ / AB+" },
                  { d: "B-", r: "B / AB" },
                  { d: "B+", r: "B+ / AB+" },
                  { d: "AB-", r: "AB- / AB+" },
                  { d: "AB+", r: "AB+ Only" }
                ].map((cell, idx) => (
                  <div key={idx} className="bg-white/80 border border-[#DAD3C2]/50 p-3 rounded-xl">
                    <div className="text-sm font-bold font-mono text-[#1F6F5C]">{cell.d}</div>
                    <div className="text-[10px] text-[#4A5C55] font-semibold mt-1 leading-tight">{cell.r}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Interactive Proximity Matrix */}
            <div className="paper-card p-6 sm:p-8 rounded-3xl space-y-6 bg-white">
              <div>
                <h3 className="text-lg font-bold font-serif-fraunces text-[#12231F]">Geospatial Transport Window</h3>
                <p className="text-xs text-[#4A5C55] leading-relaxed mt-2">
                  Proximity transport duration scales match scores. Match window decreases linearly over travel distances.
                </p>
              </div>

              {/* Proximity Slider simulation */}
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center text-xs font-mono text-[#4A5C55]">
                  <span>Transport Proximity</span>
                  <span className="text-[#1F6F5C] font-bold">{proximityVal} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="500"
                  value={proximityVal}
                  onChange={(e) => setProximityVal(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#F3EFE6] rounded-lg appearance-none cursor-pointer accent-[#1F6F5C]"
                />
                <div className="bg-[#F3EFE6] p-4 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[#4A5C55] font-medium">Estimated Transit time:</span>
                  <span className="font-mono font-bold text-[#12231F]">
                    {Math.round((proximityVal * 60) / 80)} minutes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case File Sequential Book-Flip Section */}
      <section id="casefile" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#12231F] font-serif-fraunces mb-4">
              How a match completes
            </h2>
            <p className="text-sm text-[#4A5C55] max-w-xl mx-auto">
              Follow the chronological transplant logistics pipeline. Select the tab pages below to flip through the case folder stages.
            </p>
          </div>

          <BookFlip />
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section id="faq" className="py-24 bg-[#F3EFE6] border-t border-[#DAD3C2]/70 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#12231F] font-serif-fraunces mb-4">
              Frequently Answered Inquiries
            </h2>
            <p className="text-sm text-[#4A5C55] max-w-sm mx-auto">
              Technical documentation covering coordinates and compliance validation.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-[#DAD3C2] rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#F3EFE6]/35 transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-sm text-[#12231F]">{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#1F6F5C]" /> : <ChevronDown className="w-4 h-4 text-[#4A5C55]" />}
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 text-[#4A5C55] text-xs leading-relaxed border-t border-[#DAD3C2]/40 pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter Signup Form Panel */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 w-full text-center z-10">
        <div className="paper-card p-8 sm:p-12 rounded-3xl bg-white max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#12231F] font-serif-fraunces">Receive Registry Bulletins</h2>
          <p className="text-xs text-[#4A5C55] max-w-md mx-auto leading-relaxed">
            Subscribe to our newsletters to receive platform updates and technical announcements.
          </p>

          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto pt-2">
            <div className="relative w-full">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5C55]" />
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full bg-[#FBFAF7] border border-[#DAD3C2] rounded-xl pl-10 pr-4 py-3 text-xs text-[#12231F] focus:outline-none focus:border-[#1F6F5C] focus:ring-1 focus:ring-[#1F6F5C] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1F6F5C] hover:bg-[#154C3F] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>Subscribe</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {newsletterSubscribed && (
            <p className="text-[#3C8B6E] text-xs font-bold animate-pulse">
              Subscription request received! Thank you for staying updated.
            </p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#DAD3C2] bg-[#F3EFE6] py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1F6F5C]/10 flex items-center justify-center border border-[#1F6F5C]/20">
                <Heart className="w-4 h-4 text-[#1F6F5C] fill-[#1F6F5C]/10 heartbeat-pulse" />
              </div>
              <span className="font-bold text-[#12231F] font-serif-fraunces">LifeLink Registry</span>
            </div>
            <p className="text-[#4A5C55] text-xs leading-relaxed">
              Clinical registry matching engine matching coordinates and compatibility scoring algorithms in real time.
            </p>
            <div className="text-[10px] text-[#3C8B6E] font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3C8B6E] animate-pulse"></span>
              <span>Health System Registry Online</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#4A5C55]">Portal Gateways</h4>
            <ul className="space-y-2 text-xs text-[#4A5C55]">
              <li><Link to="/login" className="hover:text-[#1F6F5C] transition-colors">Donor Portal</Link></li>
              <li><Link to="/login" className="hover:text-[#1F6F5C] transition-colors">Recipient Waiting List</Link></li>
              <li><Link to="/login" className="hover:text-[#1F6F5C] transition-colors">Hospital Operations</Link></li>
              <li><Link to="/register" className="hover:text-[#1F6F5C] transition-colors">Register Profile</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#4A5C55]">Medical Science</h4>
            <ul className="space-y-2 text-xs text-[#4A5C55]">
              <li><a href="#algorithm" className="hover:text-[#1F6F5C] transition-colors">ABO Compatibility</a></li>
              <li><a href="#algorithm" className="hover:text-[#1F6F5C] transition-colors">Urgency Criteria</a></li>
              <li><a href="#casefile" className="hover:text-[#1F6F5C] transition-colors">Sequence Folder</a></li>
              <li><a href="#faq" className="hover:text-[#1F6F5C] transition-colors">FAQ Manual</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#4A5C55]">Registry Support</h4>
            <ul className="space-y-2 text-xs text-[#4A5C55]">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#4A5C55]/60" />
                <span>support@lifelink.org</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#4A5C55]/60" />
                <span>Hospital Admin Gate</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#1F6F5C]/80" />
                <span className="font-semibold text-xs text-[#12231F]">Helpline: 1-800-24-DONOR</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#1F6F5C]/80" />
                <span className="font-semibold text-xs text-[#12231F]">Emergency: 1-888-LIFELINK</span>
              </li>
              <li className="text-[10px] text-[#4A5C55]/70 leading-relaxed pt-2">
                LifeLink is an organ matching registry MVP. Do not submit actual personal identifying information (PII).
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-[#DAD3C2]/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-[#4A5C55]">
          <div>
            &copy; {new Date().getFullYear()} LifeLink Platform. Built for real-time healthcare matching.
          </div>
          <div className="flex gap-4">
            <span className="hover:text-[#1F6F5C] cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-[#1F6F5C] cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-[#1F6F5C] cursor-pointer transition-colors">Transplant Guidelines</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
