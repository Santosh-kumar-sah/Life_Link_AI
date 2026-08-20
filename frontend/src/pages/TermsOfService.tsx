import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#12231F] font-sans selection:bg-[#1F6F5C]/10 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#4A5C55] hover:text-[#1F6F5C] transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="paper-card p-8 md:p-12 rounded-3xl border border-[#DAD3C2] bg-white/70 backdrop-blur-md shadow-lg space-y-8">
          <div className="flex items-center gap-3 border-b border-[#DAD3C2]/50 pb-6">
            <div className="p-3 bg-[#1F6F5C]/10 rounded-2xl text-[#1F6F5C]">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-black tracking-tight text-[#12231F]">Terms of Service</h1>
              <p className="text-xs text-[#4A5C55] mt-1 font-mono">Last updated: August 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-sm leading-relaxed text-[#12231F]/90">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#12231F]">1. Platform Acceptance</h2>
              <p>
                By registering an account on LifeLink, you agree to comply with our simulated terms. All match proposals, donor status desks, and coordinators' notifications are mock procedures designed to demonstrate real-time matching heuristics.
              </p>
            </section>

            <section id="guidelines" className="space-y-3 scroll-mt-6">
              <h2 className="text-lg font-bold text-[#12231F]">2. Matching Engine Rules & Guidelines</h2>
              <p>
                Compatibility scores are calculated dynamically from 0 to 100 based on standard clinical rules:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Organ travel bounds:</strong> Matches are geographically filtered to preserve organ viability (Cold Ischemia Time): Hearts and Lungs are capped at 400km; Livers and Pancreases at 1200km; Kidneys at 2000km. Matches beyond these bounds score <code>null</code>.</li>
                <li><strong>HLA Tissue Mismatch:</strong> Mismatch alleles across Locus A, B, DR loci penalize compatibility.</li>
                <li><strong>Age Modifier:</strong> High age variances receive negative scoring penalties to prioritize age-appropriate matches.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#12231F]">3. User Declarations</h2>
              <p>
                Users agree that:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Recipient waitlist priority and urgency status (Low, Medium, High, Critical) is strictly read-only to patients and managed by authorized administrative personnel.</li>
                <li>Donors are responsible for maintaining accurate consent options and available organs checklist.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#12231F]">4. Medical Disclaimer</h2>
              <p className="text-[#C4453D] font-semibold">
                ⚠️ IMPORTANT: LifeLink does not provide formal medical diagnoses, clinical guidance, or binding treatment matching. Always consult with a licensed physician or official transplant organization for actual organ donation procedures.
              </p>
            </section>
          </div>
        </div>

        <div className="text-center text-xs text-[#4A5C55] mt-8 font-mono">
          &copy; {new Date().getFullYear()} LifeLink. Built for secure clinical coordination.
        </div>
      </div>
    </div>
  );
}
