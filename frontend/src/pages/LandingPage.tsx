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
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Match Score Calculator States
  const [calcOrgan, setCalcOrgan] = useState<"Heart" | "Lung" | "Liver" | "Pancreas" | "Kidney">("Kidney");
  const [calcDonorBlood, setCalcDonorBlood] = useState("O-");
  const [calcRecipientBlood, setCalcRecipientBlood] = useState("O-");
  const [calcDistance, setCalcDistance] = useState(150);
  const [calcUrgency, setCalcUrgency] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [calcWaitlistDays, setCalcWaitlistDays] = useState(120);
  const [calcHlaMismatches, setCalcHlaMismatches] = useState(2);
  const [calcDonorWeight, setCalcDonorWeight] = useState(70);
  const [calcRecipientWeight, setCalcRecipientWeight] = useState(72);
  const [calcDonorAge, setCalcDonorAge] = useState(35);
  const [calcRecipientAge, setCalcRecipientAge] = useState(38);

  const pulsePathRef = useRef<SVGPathElement | null>(null);
  const graphRef = useRef<HTMLDivElement | null>(null);

  // ABO-Rh compatibility check
  const BLOOD_COMPATIBILITY: Record<string, string[]> = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"]
  };

  const isBloodCompatible = BLOOD_COMPATIBILITY[calcDonorBlood]?.includes(calcRecipientBlood) ?? false;

  // Max distance by organ type
  const maxDistanceLimit = 
    calcOrgan === "Heart" || calcOrgan === "Lung" ? 400 :
    calcOrgan === "Liver" || calcOrgan === "Pancreas" ? 1200 : 2000;

  const isDistanceCompatible = calcDistance <= maxDistanceLimit;

  let compatibilityStatus = "COMPATIBLE";
  let incompatibilityReason = "";

  if (!isBloodCompatible) {
    compatibilityStatus = "INCOMPATIBLE";
    incompatibilityReason = `Blood Type Mismatch: ${calcDonorBlood} is not compatible with recipient ${calcRecipientBlood}.`;
  } else if (!isDistanceCompatible) {
    compatibilityStatus = "INCOMPATIBLE";
    incompatibilityReason = `Cold Ischemia Limit Exceeded: Max distance for ${calcOrgan} is ${maxDistanceLimit} km (current: ${calcDistance} km).`;
  }

  // Calculate scores if compatible
  let bloodScore = 0;
  let urgencyScore = 0;
  let distanceScore = 0;
  let hlaScore = 0;
  let sizeScore = 0;
  let ageScore = 0;
  let finalScore: number | null = null;

  if (compatibilityStatus === "COMPATIBLE") {
    // Blood Score (20%)
    bloodScore = calcDonorBlood === calcRecipientBlood ? 100 : 50;

    // Urgency Score (30%)
    const urgencyBaseScores = { CRITICAL: 100, HIGH: 75, MEDIUM: 50, LOW: 25 };
    const baseUrgency = urgencyBaseScores[calcUrgency];
    const waitingBonus = Math.min(10, Math.floor(calcWaitlistDays / 30));
    urgencyScore = Math.min(100, baseUrgency + waitingBonus);

    // Distance Score (20%)
    distanceScore = Math.max(0, 100 * (1 - calcDistance / maxDistanceLimit));

    // HLA Score (20%)
    hlaScore = 100 * (1 - calcHlaMismatches / 6);

    // Weight Score (5%)
    const weightRatio = calcDonorWeight / calcRecipientWeight;
    sizeScore = (weightRatio >= 0.8 && weightRatio <= 1.2)
      ? 100
      : Math.max(0, 100 * (1 - Math.abs(1 - weightRatio)));

    // Age Score (5%)
    const ageDiff = Math.abs(calcDonorAge - calcRecipientAge);
    ageScore = Math.max(0, 100 - 3 * ageDiff);

    const calculated = 
      0.20 * bloodScore +
      0.30 * urgencyScore +
      0.20 * distanceScore +
      0.20 * hlaScore +
      0.05 * sizeScore +
      0.05 * ageScore;
    
    finalScore = Math.round(calculated * 100) / 100;
  }

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

            {/* Right Column: Interactive Match Calculator */}
            <div className="paper-card p-6 sm:p-8 rounded-3xl space-y-6 bg-white border border-[#DAD3C2]/50 shadow-sm">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#1F6F5C] font-bold">Simulator Desk</span>
                <h3 className="text-lg font-bold font-serif-fraunces text-[#12231F] mt-0.5">Interactive Match Calculator</h3>
                <p className="text-xs text-[#4A5C55] leading-relaxed mt-1">
                  Adjust patient and donor clinical parameters to calculate suitability scores in real-time.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Column 1: Biological Factors */}
                <div className="space-y-3.5">
                  <div className="border-b border-[#DAD3C2]/45 pb-1 font-bold text-[#1F6F5C] tracking-wide uppercase text-[10px]">
                    Biological Factors
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#4A5C55] font-semibold mb-1">Donor Blood</label>
                      <select
                        value={calcDonorBlood}
                        onChange={(e) => setCalcDonorBlood(e.target.value)}
                        className="w-full bg-[#F3EFE6] border border-[#DAD3C2] p-2 rounded-lg font-mono text-[#12231F] font-bold outline-none focus:border-[#1F6F5C]"
                      >
                        {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#4A5C55] font-semibold mb-1">Recipient Blood</label>
                      <select
                        value={calcRecipientBlood}
                        onChange={(e) => setCalcRecipientBlood(e.target.value)}
                        className="w-full bg-[#F3EFE6] border border-[#DAD3C2] p-2 rounded-lg font-mono text-[#12231F] font-bold outline-none focus:border-[#1F6F5C]"
                      >
                        {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] text-[#4A5C55] font-semibold mb-1">
                      <span>HLA Mismatch Loci</span>
                      <span className="font-bold font-mono text-[#1F6F5C]">{calcHlaMismatches} / 6</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      value={calcHlaMismatches}
                      onChange={(e) => setCalcHlaMismatches(parseInt(e.target.value))}
                      className="w-full h-1 bg-[#F3EFE6] rounded appearance-none cursor-pointer accent-[#1F6F5C]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#4A5C55] font-semibold mb-1">Donor Age (Yrs)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={calcDonorAge}
                        onChange={(e) => setCalcDonorAge(Math.max(1, parseInt(e.target.value) || 35))}
                        className="w-full bg-[#F3EFE6] border border-[#DAD3C2] p-2 rounded-lg font-mono text-[#12231F] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#4A5C55] font-semibold mb-1">Recipient Age</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={calcRecipientAge}
                        onChange={(e) => setCalcRecipientAge(Math.max(1, parseInt(e.target.value) || 35))}
                        className="w-full bg-[#F3EFE6] border border-[#DAD3C2] p-2 rounded-lg font-mono text-[#12231F] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#4A5C55] font-semibold mb-1">Donor Wt (Kg)</label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={calcDonorWeight}
                        onChange={(e) => setCalcDonorWeight(Math.max(10, parseInt(e.target.value) || 70))}
                        className="w-full bg-[#F3EFE6] border border-[#DAD3C2] p-2 rounded-lg font-mono text-[#12231F] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#4A5C55] font-semibold mb-1">Recipient Wt</label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={calcRecipientWeight}
                        onChange={(e) => setCalcRecipientWeight(Math.max(10, parseInt(e.target.value) || 72))}
                        className="w-full bg-[#F3EFE6] border border-[#DAD3C2] p-2 rounded-lg font-mono text-[#12231F] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Logistics & Urgency */}
                <div className="space-y-3.5">
                  <div className="border-b border-[#DAD3C2]/45 pb-1 font-bold text-[#1F6F5C] tracking-wide uppercase text-[10px]">
                    Logistics & Urgency
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#4A5C55] font-semibold mb-1">Organ Needed</label>
                    <select
                      value={calcOrgan}
                      onChange={(e) => setCalcOrgan(e.target.value as any)}
                      className="w-full bg-[#F3EFE6] border border-[#DAD3C2] p-2 rounded-lg font-bold text-[#12231F] outline-none focus:border-[#1F6F5C]"
                    >
                      {["Kidney", "Heart", "Lung", "Liver", "Pancreas"].map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] text-[#4A5C55] font-semibold mb-1">
                      <span>Geographic Distance</span>
                      <span className="font-bold font-mono text-[#1F6F5C]">{calcDistance} km</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max={2500}
                      value={calcDistance}
                      onChange={(e) => setCalcDistance(parseInt(e.target.value))}
                      className="w-full h-1 bg-[#F3EFE6] rounded appearance-none cursor-pointer accent-[#1F6F5C]"
                    />
                    <div className="text-[9px] text-[#4A5C55] text-right mt-0.5">
                      Max Limit: <span className="font-bold">{maxDistanceLimit} km</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#4A5C55] font-semibold mb-1">Urgency Level</label>
                    <select
                      value={calcUrgency}
                      onChange={(e) => setCalcUrgency(e.target.value as any)}
                      className="w-full bg-[#F3EFE6] border border-[#DAD3C2] p-2 rounded-lg font-bold text-[#12231F] outline-none focus:border-[#1F6F5C]"
                    >
                      {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#4A5C55] font-semibold mb-1">Waitlist Seniority (Days)</label>
                    <input
                      type="number"
                      min="0"
                      max="3000"
                      value={calcWaitlistDays}
                      onChange={(e) => setCalcWaitlistDays(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-[#F3EFE6] border border-[#DAD3C2] p-2 rounded-lg font-mono text-[#12231F] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Calculator Output Section */}
              <div className="bg-[#F3EFE6] p-4 rounded-2xl border border-[#DAD3C2] transition-all duration-300">
                {compatibilityStatus === "INCOMPATIBLE" ? (
                  <div className="text-center py-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                      <X className="w-3 h-3" /> Rejection Alert
                    </span>
                    <p className="text-xs font-bold text-red-950 font-serif-fraunces">{incompatibilityReason}</p>
                    <p className="text-[10px] text-[#4A5C55] mt-1.5 leading-relaxed">
                      Matches with biological incompatibilities or exceeding organ transport cold ischemia times are automatically blocked from score calculation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#1F6F5C]/10 text-[#1F6F5C] border border-[#1F6F5C]/20 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          Compatible Pairing
                        </span>
                        <h4 className="text-sm font-bold text-[#12231F] font-serif-fraunces mt-1">Calculated Score</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-extrabold font-mono text-[#1F6F5C]">
                          {finalScore?.toFixed(1) || "0.0"}
                        </span>
                        <span className="text-xs font-mono text-[#4A5C55] ml-0.5">/100</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[10px] text-[#4A5C55]">
                      {/* Breakdown Bars */}
                      <div>
                        <div className="flex justify-between font-semibold mb-0.5">
                          <span>Blood Compatibility (20% wt)</span>
                          <span className="font-mono text-[#12231F]">{(0.20 * bloodScore).toFixed(1)} / 20</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-1.5 border border-[#DAD3C2]/45">
                          <div className="bg-[#1F6F5C] h-1.5 rounded-full" style={{ width: `${bloodScore}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold mb-0.5">
                          <span>Medical Urgency & Seniority (30% wt)</span>
                          <span className="font-mono text-[#12231F]">{(0.30 * urgencyScore).toFixed(1)} / 30</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-1.5 border border-[#DAD3C2]/45">
                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${urgencyScore}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold mb-0.5">
                          <span>Geospatial Proximity (20% wt)</span>
                          <span className="font-mono text-[#12231F]">{(0.20 * distanceScore).toFixed(1)} / 20</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-1.5 border border-[#DAD3C2]/45">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${distanceScore}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold mb-0.5">
                          <span>HLA Tissue Matching (20% wt)</span>
                          <span className="font-mono text-[#12231F]">{(0.20 * hlaScore).toFixed(1)} / 20</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-1.5 border border-[#DAD3C2]/45">
                          <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${hlaScore}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold mb-0.5">
                          <span>Anatomical Weight & Age Match (10% wt)</span>
                          <span className="font-mono text-[#12231F]">{(0.05 * sizeScore + 0.05 * ageScore).toFixed(1)} / 10</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-1.5 border border-[#DAD3C2]/45">
                          <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: `${(sizeScore + ageScore) / 2}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
            <Link to="/privacy" className="hover:text-[#1F6F5C] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#1F6F5C] transition-colors">Terms of Service</Link>
            <Link to="/terms#guidelines" className="hover:text-[#1F6F5C] transition-colors">Transplant Guidelines</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
