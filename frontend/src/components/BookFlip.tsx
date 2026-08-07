import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, FileText, CheckCircle, Activity, User } from "lucide-react";

interface CasePage {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  timestamp: string;
  caseId: string;
  details: string[];
  metrics: { label: string; value: string }[];
}

const PAGES_DATA: CasePage[] = [
  {
    title: "Donor Registration Profile",
    subtitle: "Clinical offer logged",
    icon: <User className="w-6 h-6 text-emerald-600" />,
    timestamp: "2026-08-07T09:00:00Z",
    caseId: "DN-4091-O",
    details: [
      "Rh-negative O blood group matrix validated.",
      "Anatomical coordinates verified via HTML5 geolocation.",
      "Explicit consent form signed with biometric coordinates.",
      "ID & medical verification scan: PENDING review."
    ],
    metrics: [
      { label: "Blood Type", value: "O-" },
      { label: "Weight", value: "72 kg" },
      { label: "Consent Status", value: "VERIFIED" }
    ]
  },
  {
    title: "Compatibility Engine Audit",
    subtitle: "Real-time query completed",
    icon: <Activity className="w-6 h-6 text-blue-600" />,
    timestamp: "2026-08-07T09:00:02Z",
    caseId: "CM-8022-X",
    details: [
      "Geospatial transport window calculated: < 45 km.",
      "Body mass index ratio index verified (0.95 compatibility ratio).",
      "Biological ABO-Rh matrix verified with active recipient.",
      "Dynamic compatibility match score: 94%"
    ],
    metrics: [
      { label: "Match Score", value: "94%" },
      { label: "Distance Check", value: "14.2 km" },
      { label: "Rh Grouping", value: "COMPATIBLE" }
    ]
  },
  {
    title: "Clinical Match Propose",
    subtitle: "Hospital coordinator verify",
    icon: <FileText className="w-6 h-6 text-amber-600" />,
    timestamp: "2026-08-07T09:01:10Z",
    caseId: "PR-3104-Y",
    details: [
      "Coordinator review of clinical credentials completed.",
      "Patient urgency level verified: CRITICAL.",
      "Match proposed status set to PENDING.",
      "Response alert dispatched to patient and donor."
    ],
    metrics: [
      { label: "Urgency Rank", value: "CRITICAL" },
      { label: "Coordinator", value: "Dr. A. Miller" },
      { label: "Time Gated", value: "24 Hours" }
    ]
  },
  {
    title: "Transplant Coordination",
    subtitle: "Final coordination complete",
    icon: <CheckCircle className="w-6 h-6 text-emerald-600 animate-pulse" />,
    timestamp: "2026-08-07T09:12:05Z",
    caseId: "TC-9051-A",
    details: [
      "Donor acceptance logged with timestamp.",
      "Recipient consent and coordinates confirmed.",
      "Donor availability locked to prevent duplicate requests.",
      "Dispatching transplant transit team alert."
    ],
    metrics: [
      { label: "Status", value: "COMPLETED" },
      { label: "Transit Duration", value: "40 Mins" },
      { label: "Confirmation ID", value: "LL-89510" }
    ]
  }
];

export const BookFlip: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(media.matches);
  }, []);

  const handleNext = () => {
    if (currentPage < PAGES_DATA.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4">
      {/* Container with 3D depth */}
      <div
        style={prefersReducedMotion ? { transition: "none" } : undefined}
        className="relative perspective-container h-[500px] w-full bg-[#fcfcfa] rounded-3xl border border-[#DAD3C2] shadow-flat p-6 sm:p-10 flex flex-col justify-between overflow-hidden"
      >
        {/* Book Spine Overlay (Tactile detail) */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-[#DAD3C2] opacity-70 hidden md:block" />
        <div className="absolute top-0 bottom-0 left-1/2 w-[20px] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#12231f]/5 to-transparent hidden md:block" />

        {/* Tactile Folder Tab */}
        <div className="absolute top-0 right-10 bg-[#E8E2D4] border-x border-b border-[#DAD3C2] px-6 py-1.5 rounded-b-xl text-[10px] font-mono uppercase tracking-wider text-[#4A5C55] font-black">
          Case File Series
        </div>

        {/* Content area: left/right layout on desktop, single page on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch flex-1">
          {/* Left Page (Tactile Info) */}
          <div className="flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#DAD3C2]/50 pb-6 md:pb-0 md:pr-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3EFE6] flex items-center justify-center border border-[#DAD3C2]">
                  {PAGES_DATA[currentPage].icon}
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#12231F] font-serif-fraunces">
                    {PAGES_DATA[currentPage].title}
                  </h4>
                  <p className="text-xxs text-[#4A5C55] font-mono uppercase tracking-wider">
                    {PAGES_DATA[currentPage].subtitle}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-4">
                {PAGES_DATA[currentPage].details.map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#4A5C55]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1F6F5C] mt-1.5 flex-shrink-0" />
                    <p className="leading-relaxed">{detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-[#DAD3C2]/40 mt-6 flex justify-between items-center text-[10px] font-mono text-[#4A5C55]">
              <span>ID: {PAGES_DATA[currentPage].caseId}</span>
              <span>LOG: {new Date(PAGES_DATA[currentPage].timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Right Page (Metrics & Diagnostics) */}
          <div className="flex flex-col justify-between md:pl-8">
            <div className="space-y-6">
              <h5 className="text-xs font-mono uppercase tracking-wider text-[#4A5C55] font-black border-b border-[#DAD3C2]/50 pb-2">
                Clinical Diagnostics
              </h5>

              <div className="grid grid-cols-1 gap-4">
                {PAGES_DATA[currentPage].metrics.map((metric, idx) => (
                  <div key={idx} className="bg-[#F3EFE6] border border-[#DAD3C2] p-4 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-medium text-[#4A5C55]">{metric.label}</span>
                    <span className="text-sm font-bold font-mono text-[#12231F]">{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-400 mt-6 flex justify-between items-center">
              <span>Verified Match Log</span>
              <span>Page {currentPage + 1} of {PAGES_DATA.length}</span>
            </div>
          </div>
        </div>

        {/* Page Switch Controls */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-[#DAD3C2]">
          <button
            onClick={handlePrev}
            disabled={currentPage === 0}
            aria-label="Previous Page"
            className="p-3 bg-[#F3EFE6] hover:bg-[#E8E2D4] border border-[#DAD3C2] text-[#12231F] rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Slider visual dot controls */}
          <div className="flex gap-2">
            {PAGES_DATA.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                aria-label={`Go to page ${idx + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  currentPage === idx ? "bg-[#1F6F5C] scale-125" : "bg-[#DAD3C2] hover:bg-[#4A5C55]"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentPage === PAGES_DATA.length - 1}
            aria-label="Next Page"
            className="p-3 bg-[#F3EFE6] hover:bg-[#E8E2D4] border border-[#DAD3C2] text-[#12231F] rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookFlip;
