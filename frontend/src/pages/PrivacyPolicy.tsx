import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
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
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-black tracking-tight text-[#12231F]">Privacy Policy</h1>
              <p className="text-xs text-[#4A5C55] mt-1 font-mono">Last updated: August 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-sm leading-relaxed text-[#12231F]/90">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#12231F]">1. Introduction & MVP Notice</h2>
              <p>
                LifeLink is an AI-enabled real-time organ donation matching platform. This instance is configured as a demonstration MVP (Minimum Viable Product). Please do not submit any actual personally identifiable information (PII) or real medical details. All mock documents uploaded are for simulation purposes only.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#12231F]">2. Information We Collect</h2>
              <p>
                To provide matching heuristics, our database stores:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Profile Details:</strong> Age, weight, blood group, and geographical coordinates.</li>
                <li><strong>HLA Allele Assays:</strong> Locus A, B, and DR alleles to compute tissue compatibility.</li>
                <li><strong>Verification Documents:</strong> Identity proof and clinical referrals stored securely to manage active donor states.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#12231F]">3. Data Protection and Encryption</h2>
              <p>
                All session tokens are protected using secure HTTP-only cookies with signature verification. Access permissions are strictly role-segregated between donors, recipients, and system administrators to maintain clinical auditing standards.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#12231F]">4. Consent and Match Revocation</h2>
              <p>
                Donors retain absolute autonomy over their consent settings:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Toggling donor consent to <code>false</code> immediately removes the profile from the active recommendation list.</li>
                <li>Any in-flight pending match proposals linked to the donor will be automatically canceled, protecting donor privacy instantly.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#12231F]">5. Contact & Support</h2>
              <p>
                For questions regarding platform matching parameters or simulated data deletion, please utilize our real-time AI Support Assistant on the dashboard or contact your coordinator.
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
