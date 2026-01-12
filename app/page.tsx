"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Lock, 
  DollarSign, 
  ChevronDown,
  Quote,
  Star
} from "lucide-react";

// -------------------------------------------------------
// UTILITIES & HOOKS
// -------------------------------------------------------

const useScrollPosition = () => {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return scrollY;
};

// -------------------------------------------------------
// SWISS MINIMALIST LANDING PAGE (FINAL POLISH)
// -------------------------------------------------------

export default function HomePage() {
  const router = useRouter();
  const scrollY = useScrollPosition();
  
  // State for FAQ
  const [faqTab, setFaqTab] = useState<"students" | "posters">("students");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // State for Loading Animation
  const [isLoading, setIsLoading] = useState(false);
  const [clickPos, setClickPos] = useState({ x: 0, y: 0 });

  // --- MOUSE SPOTLIGHT LOGIC ---
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      // Update CSS variables for high performance
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  const toggleFAQ = (i: number) => {
    setOpenFaq(openFaq === i ? null : i);
  };

  // --- LOGIN HANDLER (Triggers 360 Swing at Click Position) ---
  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    // Capture click position
    setClickPos({ x: e.clientX, y: e.clientY });
    setIsLoading(true);
    
    // Wait for the swing animation (approx 1.2s) before redirecting
    setTimeout(() => {
      router.push("/login");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative selection:bg-brand-purple selection:text-white font-sans">
      
      {/* -------------------------------------------------------
          MOUSE SPOTLIGHT ("Hint of Grey")
      --------------------------------------------------------- */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(600px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.04), transparent 80%)`
        }}
      />

      {/* -------------------------------------------------------
          LOADING OVERLAY (Fast 360° Swing at Cursor)
      --------------------------------------------------------- */}
      {isLoading && (
        <div 
          className="fixed z-[10000] pointer-events-none"
          style={{ 
            left: clickPos.x, 
            top: clickPos.y,
            transform: 'translate(-50%, -20%)' // Center pivot
          }}
        >
           {/* Smaller Size (w-12), Faster Animation (0.4s) */}
           <div className="relative w-12 h-12 origin-[top_center] animate-[spin_0.4s_linear_infinite]">
              <Image 
                src="/sloth.png" 
                alt="Loading..." 
                fill 
                className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" 
              />
           </div>
        </div>
      )}

      {/* -------------------------------------------------------
          NAVBAR
      --------------------------------------------------------- */}
      <header className={`fixed z-50 w-full top-0 left-0 transition-all duration-500 border-b ${scrollY > 20 ? "bg-background/80 backdrop-blur-xl border-white/5" : "bg-transparent border-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 transition-transform duration-500 group-hover:rotate-12">
              <Image src="/logo.svg" alt="logo" fill className="object-contain" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white group-hover:text-zinc-300 transition-colors">
              DoItForMe
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">How it works</button>
            <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">FAQ</button>
            <Link href="/contact" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Support</Link>
          </nav>

          <button
            onClick={handleLogin}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-black bg-white hover:bg-zinc-200 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            Login
          </button>
        </div>
      </header>

      {/* -------------------------------------------------------
          HERO SECTION
      --------------------------------------------------------- */}
      <section className="pt-48 pb-32 relative max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center text-center relative z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-purple/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 w-fit mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">India's Verified Student Marketplace</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tighter text-white mb-8">
          Outsource tasks.<br/>
          <span className="text-zinc-500">Earn while you learn.</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mb-12">
          The safest peer-to-peer marketplace for university students. 
          Get assignments and errands done, or monetize your free time securely.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button onClick={handleLogin} className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">
              Start Now <ArrowRight size={16} />
            </button>
            <button onClick={() => scrollToSection('transparency')} className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-bold border border-zinc-800 text-white hover:bg-zinc-900 transition-all">
               See How It Works
            </button>
        </div>

        {/* Minimal Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 pt-10 border-t border-white/5 w-full max-w-4xl">
           <StatItem label="Verified Students" value="100%" />
           <StatItem label="Payment Protection" value="Escrow" />
           <StatItem label="Posting Fee" value="0%" />
           <StatItem label="Support" value="24/7" />
        </div>
      </section>

      {/* -------------------------------------------------------
          TICKER
      --------------------------------------------------------- */}
      <div className="w-full bg-white border-y border-zinc-200 py-3 mb-24 overflow-hidden relative z-10">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10"></div>
        <div className="animate-marquee whitespace-nowrap flex gap-10">
          {[...Array(12)].map((_, i) => (
             <span key={i} className="text-lg font-bold text-black uppercase tracking-widest mx-4 flex items-center gap-4">
               ASSIGNMENTS <span className="text-zinc-300">•</span> 
               ERRANDS <span className="text-zinc-300">•</span> 
               PROJECTS <span className="text-zinc-300">•</span> 
               CASH <span className="text-zinc-300">•</span> 
               SKILLS <span className="text-zinc-300">•</span>
             </span>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------
          FEATURES (Bento Grid)
      --------------------------------------------------------- */}
      <section id="transparency" className="max-w-7xl mx-auto px-6 mb-32 relative z-10">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Complete Transparency.</h2>
          <p className="text-zinc-400 text-lg max-w-xl">We've stripped away the complexity. No hidden wallets. No confusion.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] p-8 group">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6"><ShieldCheck size={24} /></div>
                <h3 className="text-2xl font-bold text-white mb-3">Direct Escrow</h3>
                <p className="text-zinc-400 leading-relaxed max-w-lg">
                  Funds move directly. When you hire, you pay into Escrow. 
                  When work is done, funds go directly to the worker's payout method. 
                  No intermediate wallet storage.
                </p>
              </div>
              <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] group-hover:bg-blue-500/10 transition-colors duration-500" />
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-8 group hover:border-brand-purple/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-brand-purple mb-6"><Zap size={24} /></div>
              <h3 className="text-2xl font-bold text-white mb-3">Instant Match</h3>
              <p className="text-zinc-400">Post a gig and get applicants within minutes. Filter by rating.</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-8 group hover:border-brand-pink/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 mb-6"><Lock size={24} /></div>
              <h3 className="text-2xl font-bold text-white mb-3">Verified IDs</h3>
              <p className="text-zinc-400">No bots. Every user must upload a valid Student ID to participate.</p>
            </div>

            <div className="md:col-span-2 rounded-3xl border border-white/10 bg-[#0A0A0A] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                 <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 mb-6"><DollarSign size={24} /></div>
                 <h3 className="text-2xl font-bold text-white mb-3">The Economics</h3>
                 <ul className="space-y-3 text-zinc-400">
                    <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500"/> Free to post gigs</li>
                    <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-500"/> Free to apply for gigs</li>
                    <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-zinc-500"/> 10% Platform fee on payout</li>
                 </ul>
              </div>
              <div className="bg-black p-6 rounded-2xl border border-white/10 w-full md:w-64 text-center relative overflow-hidden">
                 <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-purple to-brand-blue"></div>
                 <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Payout Example</span>
                 <div className="mt-4 flex justify-between text-sm"><span className="text-zinc-400">Earned</span><span className="text-white">₹1000</span></div>
                 <div className="mt-2 flex justify-between text-sm"><span className="text-zinc-400">Fee (10%)</span><span className="text-red-400">-₹100</span></div>
                 <div className="mt-4 pt-4 border-t border-white/10 flex justify-between font-bold text-lg"><span className="text-white">You Get</span><span className="text-green-400">₹900</span></div>
              </div>
            </div>
        </div>
      </section>

      {/* -------------------------------------------------------
          HOW IT WORKS (No Wallet Flow)
      --------------------------------------------------------- */}
      <section id="how-it-works" className="py-24 bg-[#0A0A0A] border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
           <h2 className="text-3xl font-bold text-white mb-12 text-center">Simple Flow</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-[2px] bg-zinc-800 z-0"></div>
              {[
                { step: "01", title: "Create Account", desc: "Sign up and upload your Student ID for verification." },
                { step: "02", title: "Post or Apply", desc: "Posters pay into safe Escrow. Workers apply to tasks." },
                { step: "03", title: "Release Funds", desc: "Work approved? Funds are released directly to the worker." }
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center">
                   <div className="w-16 h-16 rounded-full bg-background border border-white/10 flex items-center justify-center text-xl font-bold text-white mb-6 shadow-xl">{item.step}</div>
                   <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                   <p className="text-zinc-400 max-w-xs">{item.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* -------------------------------------------------------
          STUDENT STORIES (Restored)
      --------------------------------------------------------- */}
      <section className="py-24 max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex items-center gap-4 mb-12">
           <div className="h-px bg-zinc-800 flex-1"></div>
           <h2 className="text-2xl font-bold text-white text-center">Student Stories</h2>
           <div className="h-px bg-zinc-800 flex-1"></div>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          <Testimonial role="Poster" quote="Got my assignment printed and delivered in 2 hours!" color="border-brand-purple" />
          <Testimonial role="Worker" quote="I made ₹2000 last weekend just helping with Figma designs." color="border-brand-blue" />
          <Testimonial role="Busy Student" quote="The direct payment flow is so much better than other apps." color="border-brand-pink" />
        </div>
      </section>

      {/* -------------------------------------------------------
          FAQ (Tabs Restored)
      --------------------------------------------------------- */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
           <h2 className="text-3xl font-bold text-white mb-6">Common Questions</h2>
           {/* Tab Switcher */}
           <div className="inline-flex bg-white/5 rounded-full p-1 border border-white/10">
              <button onClick={() => setFaqTab("students")} className={`px-8 py-2 rounded-full text-sm font-bold transition-all duration-300 ${faqTab === "students" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"}`}>Students</button>
              <button onClick={() => setFaqTab("posters")} className={`px-8 py-2 rounded-full text-sm font-bold transition-all duration-300 ${faqTab === "posters" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"}`}>Posters</button>
           </div>
        </div>

        <div className="space-y-4">
          {(faqTab === "students" ? studentFaq : posterFaq).map((f, i) => (
            <div key={i} className="border border-white/5 rounded-xl bg-[#0A0A0A] overflow-hidden">
              <button onClick={() => toggleFAQ(i)} className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors">
                <span className="font-medium text-white">{f.q}</span>
                <ChevronDown size={20} className={`text-zinc-500 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              <div className={`px-6 overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 pb-6' : 'max-h-0'}`}>
                <p className="text-zinc-400 leading-relaxed text-sm">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------
          FOOTER
      --------------------------------------------------------- */}
      <footer className="w-full bg-[#020202] py-12 border-t border-white/5 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <div className="relative w-6 h-6 grayscale opacity-50"><Image src="/logo.svg" alt="logo" fill /></div>
              <span className="font-bold text-lg text-white">DoItForMe</span>
            </div>
            <p className="text-xs text-zinc-600">© 2025 DoItForMe Inc.</p>
          </div>
          <div className="flex gap-8 text-sm text-zinc-500">
             <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
             <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
             <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// -------------------------------------------------------
// STATIC DATA & SUB-COMPONENTS
// -------------------------------------------------------

const studentFaq = [
  { q: "How do I get paid?", a: "Once your work is approved by the poster, funds are released immediately to your linked UPI or bank account. No minimum withdrawal limits." },
  { q: "Is verification required?", a: "Yes — you must upload a valid Student ID. This keeps the platform safe and exclusive to students." },
  { q: "What if the poster doesn't pay?", a: "They already paid! Funds are held in Escrow before you start working. If you do the work, you are guaranteed to get paid." },
  { q: "What if I face a dispute?", a: "You can raise a dispute directly in the chat. Our team reviews the chat history and evidence to ensure a fair resolution." },
];

const posterFaq = [
  { q: "Is my money safe?", a: "Yes. You deposit funds into Escrow. The worker cannot touch it until you verify their work and click 'Release'." },
  { q: "What if the work is bad?", a: "You can raise a dispute. Since the money is in Escrow, it can be refunded to you if the work is unsatisfactory." },
  { q: "Are there extra fees?", a: "Posting is free. You only pay the amount you set for the task." },
  { q: "How do disputes work?", a: "If you are unhappy with the work, raise a dispute before releasing funds. We mediate to ensure a fair outcome or refund." },
];

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-zinc-500 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function Testimonial({ role, quote, color }: { role: string, quote: string, color: string }) {
  return (
    <div className={`bg-[#0A0A0A] border-l-2 ${color} p-6 rounded-r-xl border-y border-r border-white/5`}>
      <div className="flex items-center gap-2 mb-3">
         <div className="p-1.5 bg-white/5 rounded-full"><Quote size={12} className="text-zinc-400" /></div>
         <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{role}</span>
      </div>
      <p className="text-zinc-300 text-sm leading-relaxed">"{quote}"</p>
      <div className="mt-4 flex gap-1">
         {[...Array(5)].map((_,i) => <Star key={i} size={10} className="fill-zinc-700 text-zinc-700" />)}
      </div>
    </div>
  );
}