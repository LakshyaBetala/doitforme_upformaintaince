"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import Image from "next/image";
import { MapPin, Clock, IndianRupee, Briefcase, Search } from "lucide-react";

// --- ROBUST TIME AGO ---
function timeAgo(dateString: string) {
  if (!dateString) return "";
  const now = new Date();
  const past = new Date(dateString);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// --- BACKGROUND COMPONENT ---
function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute w-[40rem] h-[40rem] bg-[#8825F5]/10 blur-[100px] rounded-full -top-40 -left-40 animate-blob will-change-transform" />
      <div className="absolute w-[30rem] h-[30rem] bg-[#0097FF]/10 blur-[100px] rounded-full top-[30%] -right-20 animate-blob animation-delay-2000 will-change-transform" />
    </div>
  );
}

export default function FeedPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadGigs = async () => {
      try {
        setLoading(true);

        const nowIso = new Date().toISOString();
        const { data, error: fetchError } = await supabase
          .from("gigs")
          .select("*")
          .eq("status", "open") 
          .or(`deadline.is.null,deadline.gt.${nowIso}`)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        setGigs(data || []);

        const urlMap: Record<string, string> = {};
        data?.forEach((gig: any) => {
          if (gig.images?.[0]) {
            const { data: publicData } = supabase.storage
              .from("gig-images")
              .getPublicUrl(gig.images[0]);
            urlMap[gig.id] = publicData?.publicUrl;
          }
        });
        setImageUrls(urlMap);

      } catch (err) {
        console.error("Feed Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadGigs();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#0B0B11] text-white p-4 md:p-6 relative selection:bg-brand-purple overflow-x-hidden">
      <BackgroundBlobs />
      
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Explore Gigs</h1>
            <p className="text-white/50 text-sm md:text-base">Find work that fits your skills.</p>
          </div>
          <button 
            onClick={() => router.push("/post")}
            className="w-full md:w-auto px-8 py-4 bg-[#8825F5] active:scale-95 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(136,37,245,0.3)] touch-manipulation"
          >
            Post a Gig
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-[#1A1A24] rounded-3xl animate-pulse border border-white/5" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && gigs.length === 0 && (
          <div className="text-center py-20 bg-[#1A1A24]/50 rounded-[32px] border border-white/10 px-6">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No gigs found</h3>
            <p className="text-white/50 mb-6">Be the first to post a gig!</p>
            <button onClick={() => router.push("/post")} className="text-[#8825F5] font-bold hover:underline touch-manipulation">
              Create Gig
            </button>
          </div>
        )}

        {/* Gigs Grid - Optimized for scrolling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 [content-visibility:auto]">
          {gigs.map((gig) => (
            <div
              key={gig.id}
              onClick={() => router.push(`/gig/${gig.id}`)}
              className="group bg-[#121217] border border-white/10 rounded-[28px] overflow-hidden active:scale-[0.98] transition-all cursor-pointer hover:border-[#8825F5]/40 flex flex-col h-full touch-manipulation"
            >
              {/* Image Section */}
              <div className="relative h-48 bg-[#1A1A24] w-full overflow-hidden">
                {imageUrls[gig.id] ? (
                  <Image 
                    src={imageUrls[gig.id]} 
                    alt={gig.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/10">
                    <Briefcase className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/10">
                  {timeAgo(gig.created_at)}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4 gap-2">
                  <h2 className="text-lg font-bold text-white leading-snug line-clamp-2 group-hover:text-brand-purple transition-colors">
                    {gig.title}
                  </h2>
                  <span className="text-brand-purple font-black bg-brand-purple/10 px-3 py-1 rounded-xl text-sm whitespace-nowrap">
                    ₹{gig.price}
                  </span>
                </div>

                <p className="text-white/50 text-sm line-clamp-2 mb-6 flex-1 font-medium">
                  {gig.description}
                </p>

                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-white/30 border-t border-white/5 pt-5 mt-auto">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-brand-blue" /> 
                    <span className="truncate max-w-[100px]">{gig.location || "Remote"}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <Clock className="w-3.5 h-3.5 text-brand-purple" /> 
                    <span className="truncate max-w-[80px]">{gig.deadline ? new Date(gig.deadline).toLocaleDateString() : "No Deadline"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}