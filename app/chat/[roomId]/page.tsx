"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Send, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = params?.roomId as string; // This maps to gig_id
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [user, setUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gigTitle, setGigTitle] = useState("");

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<any>(null);

  // 1. Load User, Check Permissions, Load Messages
  useEffect(() => {
    if (!roomId) return;

    const initChat = async () => {
      try {
        // A. Get Current User
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
            router.push("/login");
            return;
        }
        setUser(currentUser);

        // B. Check Permissions (Query 'gigs' table)
        const { data: gig, error: gigError } = await supabase
          .from("gigs")
          .select("title, poster_id, assigned_worker_id, status")
          .eq("id", roomId)
          .single();

        if (gigError || !gig) {
          setError("Project not found.");
          setLoading(false);
          return;
        }

        const isParticipant = gig.poster_id === currentUser.id || gig.assigned_worker_id === currentUser.id;
        if (!isParticipant) {
          setError("Unauthorized: You are not part of this project.");
          setLoading(false);
          return;
        }

        setGigTitle(gig.title);

        // C. Load Existing Messages (Query 'messages' table)
        const { data: msgs, error: msgError } = await supabase
          .from("messages")
          .select("*")
          .eq("gig_id", roomId)
          .order("created_at", { ascending: true });

        if (msgError) throw msgError;
        setMessages(msgs || []);

        // D. Setup Realtime Subscription
        const channel = supabase.channel(`chat:${roomId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `gig_id=eq.${roomId}`,
            },
            (payload) => {
              setMessages((prev) => [...prev, payload.new as Message]);
            }
          )
          .subscribe();

        channelRef.current = channel;
        setLoading(false);

      } catch (err: any) {
        console.error("Chat Init Error:", err);
        setError("Failed to load chat.");
        setLoading(false);
      }
    };

    initChat();

    // Cleanup subscription
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [roomId, supabase, router]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 2. Send Message Handler
  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    const content = input.trim();
    setInput(""); // Clear input immediately

    // Optimistic UI Update (Optional, but makes it feel instant)
    // We rely on Realtime to confirm, but could add here if needed.

    try {
      // Use the API route to send (handles validation/security)
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            gigId: roomId, 
            senderId: user.id, 
            content: content 
        }),
      });

      const json = await res.json();

      if (!json.success) {
        alert(json.error || "Failed to send message");
      }
    } catch (err) {
      console.error("Send Error:", err);
      alert("Network error sending message.");
    }
  };

  // --- RENDER STATES ---

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0B11] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#8825F5]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#0B0B11] text-white gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-lg">{error}</p>
        <Link href="/dashboard" className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
            Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0B0B11] text-white font-sans selection:bg-[#8825F5] selection:text-white">
      
      {/* 1. HEADER */}
      <header className="px-6 py-4 border-b border-white/10 bg-[#121217] flex items-center gap-4 shadow-lg z-10">
        <Link href={`/gig/${roomId}`} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </Link>
        <div>
          <h1 className="font-bold text-lg leading-none">{gigTitle || "Project Chat"}</h1>
          <p className="text-xs text-white/40 mt-1">Encrypted • Real-time</p>
        </div>
      </header>

      {/* 2. MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((m) => {
          const isMe = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div 
                className={`max-w-[85%] md:max-w-[60%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-md break-words ${
                  isMe 
                    ? "bg-[#8825F5] text-white rounded-br-none" 
                    : "bg-[#1A1A24] border border-white/10 text-white/90 rounded-bl-none"
                }`}
              >
                {m.content}
                <div className={`text-[10px] mt-1 text-right ${isMe ? "text-white/60" : "text-white/30"}`}>
                   {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. INPUT AREA */}
      <div className="p-4 bg-[#121217] border-t border-white/10">
        <div className="max-w-4xl mx-auto relative flex gap-3 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-[#0B0B11] text-white px-5 py-4 rounded-xl border border-white/10 focus:border-[#8825F5] outline-none transition-all placeholder:text-white/20"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="p-4 bg-[#8825F5] hover:bg-[#7b1dd1] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-all shadow-lg shadow-[#8825F5]/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

    </div>
  );
}