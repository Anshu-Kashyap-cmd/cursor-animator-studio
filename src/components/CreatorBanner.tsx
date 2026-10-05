import React, { useState } from "react";
import { Sparkles, Globe, ExternalLink, Check, Copy, Crown, Heart } from "lucide-react";

interface CreatorBannerProps {
  variant?: "full" | "compact" | "footer";
}

export const CreatorBanner: React.FC<CreatorBannerProps> = ({ variant = "full" }) => {
  const [copied, setCopied] = useState(false);
  const portalUrl = "https://aicreation2026.blogspot.com";
  const displayUrl = "aicreation2026.blogspot.com";
  const creatorName = "Anshu Kashyap";

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (variant === "compact") {
    return (
      <div className="w-full p-4 rounded-xl bg-gradient-to-r from-[#2A1810]/90 via-[#1C1512] to-[#2E1838]/90 border border-[#E8793A]/40 shadow-lg shadow-[#E8793A]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E8793A] to-[#FFB787] p-0.5 shadow-md shadow-[#E8793A]/30 flex-shrink-0 overflow-hidden">
            <div className="w-full h-full rounded-[10px] bg-[#1C1512] flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#E8793A] block">
              Creator & Developer
            </span>
            <span className="text-base font-black text-white tracking-wide">
              {creatorName}
            </span>
          </div>
        </div>

        <a
          href={portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] font-black text-xs tracking-wider shadow-md shadow-[#E8793A]/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{displayUrl}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="w-full my-8 relative group">
      {/* Ambient background glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#E8793A]/40 via-[#FF9F5A]/20 to-[#A855F7]/40 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500 pointer-events-none"></div>

      {/* Main card */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#241510] via-[#1A1211] to-[#251329] border-2 border-[#E8793A]/60 shadow-[0_0_40px_rgba(232,121,58,0.25)] backdrop-blur-2xl overflow-hidden">
        {/* Subtle decorative grid background */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #FFF 1px, transparent 0)",
            backgroundSize: "24px 24px"
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left section: Creator Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#E8793A] via-[#FFA873] to-[#FFD1A4] p-1 shadow-xl shadow-[#E8793A]/30 transform group-hover:rotate-3 transition-transform duration-300">
                <div className="w-full h-full rounded-[14px] bg-[#1C1512] flex items-center justify-center p-1.5 overflow-hidden">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain filter drop-shadow-md" />
                </div>
              </div>
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-black p-1.5 rounded-full shadow-md animate-bounce">
                <Crown className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#E8793A]/20 border border-[#E8793A]/50 text-[#FFA873] text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#E8793A]" />
                <span>Lead Architect & Creator</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-lg">
                <span className="bg-gradient-to-r from-white via-[#FFD1A4] to-[#FFA873] bg-clip-text text-transparent">
                  {creatorName}
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-[#D6CAC0] font-medium max-w-lg leading-relaxed">
                Empowering creators worldwide with modern AI studio tools, custom animation suites, and digital experiences.
              </p>
            </div>
          </div>

          {/* Right section: Website Button & Copy Feature */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-[#E8793A] via-[#F2925C] to-[#FFA873] text-[#1C1512] font-black text-sm sm:text-base tracking-wide shadow-xl shadow-[#E8793A]/40 hover:shadow-[#E8793A]/70 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer border-2 border-white/30 whitespace-nowrap"
            >
              <Globe className="w-5 h-5 text-[#1C1512]" />
              <span className="font-black tracking-wider">{displayUrl}</span>
              <ExternalLink className="w-4 h-4 text-[#1C1512]" />
            </a>

            <button
              onClick={handleCopy}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 hover:border-[#E8793A]/50 transition-all cursor-pointer shadow-md"
              title="Copy URL"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#7FBF8E]" />
                  <span className="text-[#7FBF8E]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#B8ADA3]" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom micro-bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#B8ADA3] gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7FBF8E] animate-ping" />
            <span className="font-semibold text-[#F3EDE7]">Official Portal Online</span>
            <span>•</span>
            <span>Free Cursors, AI Tools & Guides</span>
          </div>

          <a 
            href={portalUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-[#FFA873] font-bold underline transition-colors"
          >
            Visit {displayUrl} &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};
