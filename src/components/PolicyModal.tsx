import React, { useState } from "react";
import { ShieldCheck, Lock, FileText, X, Check, Copy, ExternalLink, Heart } from "lucide-react";
import { GlassPanel } from "./GlassPanel.tsx";

export type PolicyTab = "privacy" | "security" | "disclaimer";

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PolicyTab;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  onClose,
  initialTab = "privacy",
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);
  const [copied, setCopied] = useState(false);

  // Sync initial tab when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://aicreation2026.blogspot.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <GlassPanel
        className="w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden border border-white/15 shadow-2xl rounded-2xl bg-[#1C1512]/95"
        intensity="high"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E8793A] to-[#6E5A7B] flex items-center justify-center text-white shadow-md shadow-[#E8793A]/20">
              {activeTab === "privacy" && <Lock className="w-5 h-5" />}
              {activeTab === "security" && <ShieldCheck className="w-5 h-5" />}
              {activeTab === "disclaimer" && <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F3EDE7] flex items-center gap-2">
                {activeTab === "privacy" && "Privacy Policy & Zero Data Collection"}
                {activeTab === "security" && "Security Standards & Vulnerability Reporting"}
                {activeTab === "disclaimer" && "Legal Disclaimer & Terms of Use"}
              </h2>
              <p className="text-[11px] text-[#B8ADA3]">
                Cursor Animator Studio • Crafted by <strong className="text-[#FFA873]">Anshu Kashyap</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#B8ADA3] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-white/5 bg-black/20">
          <button
            onClick={() => setActiveTab("privacy")}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "privacy"
                ? "bg-[#E8793A] text-[#1C1512] shadow-sm shadow-[#E8793A]/25"
                : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/5"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "security"
                ? "bg-[#E8793A] text-[#1C1512] shadow-sm shadow-[#E8793A]/25"
                : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/5"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security Policy</span>
          </button>

          <button
            onClick={() => setActiveTab("disclaimer")}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "disclaimer"
                ? "bg-[#E8793A] text-[#1C1512] shadow-sm shadow-[#E8793A]/25"
                : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/5"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Disclaimer & Terms</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-[#B8ADA3] leading-relaxed select-text">
          {/* PRIVACY TAB */}
          {activeTab === "privacy" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#7FBF8E]/15 to-[#E8793A]/10 border border-[#7FBF8E]/30 text-[#F3EDE7]">
                <p className="font-bold flex items-center gap-1.5 text-sm text-[#7FBF8E]">
                  <ShieldCheck className="w-4 h-4" /> Privacy & Secure Authentication Guarantee
                </p>
                <p className="text-xs text-[#D6CAC0] mt-1">
                  Cursor Animator Studio (<a href="https://cursor-animator-studio.ai.studio" target="_blank" rel="noopener noreferrer" className="text-[#FFA873] underline font-bold">cursor-animator-studio.ai.studio</a>) uses Google Authentication to securely preserve your animated cursor projects. We never sell, track, or share your personal data.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F3EDE7] text-sm mb-1">1. Zero Media Cloud Uploads & Local RAM Processing</h4>
                <p>
                  Every image, video file, canvas drawing, and .ani/.cur export remains strictly inside your local device’s RAM. Video decoding, frame splitting, and binary packaging execute on your machine with zero server-side exposure.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F3EDE7] text-sm mb-1">2. Google Account Authentication (Required)</h4>
                <p>
                  To secure your workspace, prevent unauthorized access to your creations, and sync projects across sessions and devices, users sign in with their Google Account. We store only your basic profile identifier (UID, email, display name) strictly to namespace your projects in Firestore.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F3EDE7] text-sm mb-1">3. Cloud & Local Workspace Synchronization</h4>
                <p>
                  Your projects are stored securely in Google Firestore under your account and cached locally using browser IndexedDB. You can delete individual projects or wipe your workspace at any time.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F3EDE7] text-sm mb-1">4. No Ad Networks or Tracking Pixels</h4>
                <p>
                  The codebase contains zero third-party tracking cookies, spy scripts, behavioral telemetry, or commercial advertisement trackers.
                </p>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#E8793A]/15 to-[#6E5A7B]/15 border border-[#E8793A]/30 text-[#F3EDE7]">
                <p className="font-bold flex items-center gap-1.5 text-sm text-[#FFA873]">
                  <Lock className="w-4 h-4" /> Multi-Layer Security Architecture
                </p>
                <p className="text-xs text-[#D6CAC0] mt-1">
                  Secured with Google OAuth 2.0 authentication, Firestore document rules, client-side sandboxing, and binary chunk sanitization. Live at <span className="font-mono text-[#FFA873]">cursor-animator-studio.ai.studio</span>.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F3EDE7] text-sm mb-1">1. Google OAuth 2.0 Authentication</h4>
                <p>
                  Authentication is managed by Google Identity Services and Firebase Auth SDK. Users never pass passwords to this application, protecting accounts against credential interception.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F3EDE7] text-sm mb-1">2. Binary & Buffer Overflow Protection</h4>
                <p>
                  Our custom parser rigorously validates byte headers, chunk offsets, and frame resolution bounds before parsing or synthesizing `.ani`, `.cur`, and `.ico` containers.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F3EDE7] text-sm mb-1">3. Firestore Security Rules & Access Control</h4>
                <p>
                  Database operations require a verified authenticated session. Every user can only read and write projects tied strictly to their own authenticated Google UID.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F3EDE7] text-sm mb-1">3. Responsible Vulnerability Disclosure</h4>
                <p>
                  Security researchers who discover edge cases or parser vulnerabilities are encouraged to responsibly report them via the official portal at{" "}
                  <a
                    href="https://aicreation2026.blogspot.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FFA873] underline font-bold"
                  >
                    aicreation2026.blogspot.com
                  </a>
                  . Reports are reviewed and patched promptly within 48 to 72 hours.
                </p>
              </div>
            </div>
          )}

          {/* DISCLAIMER TAB */}
          {activeTab === "disclaimer" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-[#F3EDE7]">
                <p className="font-bold flex items-center gap-1.5 text-sm text-white">
                  <FileText className="w-4 h-4 text-[#FFA873]" /> Open Source MIT License & Disclaimer
                </p>
                <p className="text-xs text-[#D6CAC0] mt-1">
                  Provided free and open-source under the MIT License for creators worldwide.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F3EDE7] text-sm mb-1">1. "AS IS" Provision</h4>
                <p>
                  Cursor Animator Studio is provided "AS IS", without warranty of any kind, express or implied. The maintainers shall not be liable for any claims, damages, or software interruptions resulting from usage.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F3EDE7] text-sm mb-1">2. User Ownership of Created Cursors</h4>
                <p>
                  You own 100% of the copyright and commercial rights to cursor packs, pixel art, and animations you produce. You are permitted to use them for personal setups or sell them commercially.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F3EDE7] text-sm mb-1">3. Trademark Notice</h4>
                <p>
                  "Windows", "Microsoft Windows", `.ANI`, and `.CUR` file nomenclature are referenced strictly for compatibility identification. This tool is an independent open-source project and is not affiliated with or endorsed by Microsoft Corporation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Creator Link & Close */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#B8ADA3]">Created by</span>
            <span className="text-xs font-black text-white bg-gradient-to-r from-[#FFA873] to-[#FFD1A4] bg-clip-text text-transparent">
              Anshu Kashyap
            </span>
            <span className="text-white/20">•</span>
            <a
              href="https://aicreation2026.blogspot.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#FFA873] hover:underline font-bold"
            >
              <span>aicreation2026.blogspot.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#F3EDE7] transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#7FBF8E]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Link Copied!" : "Share Link"}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#E8793A] hover:bg-[#FFA873] text-[#1C1512] text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#E8793A]/20"
            >
              Close
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};
