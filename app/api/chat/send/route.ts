import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isUnsafeMessage(text: string) {
  const phoneRegex = /(\+?\d[\d -]{7,}\d)/g;
  const personalKeywords = /(whatsapp|watsapp|call\s?me|phone|mobile|reach\s?me|num(ber)?)/gi;
  const socialRegex = /(@\w{3,}|instagram|insta|ig|snap(chat)?|telegram|t\.me|tg)/gi;

  return (
    phoneRegex.test(text) ||
    personalKeywords.test(text) ||
    socialRegex.test(text)
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gigId, senderId, content } = body; // Standardized names

    if (!gigId || !content || !senderId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Verify participant of gig
    const { data: gig, error: gigErr } = await supabase
      .from("gigs")
      .select("poster_id, assigned_worker_id")
      .eq("id", gigId)
      .single();

    if (gigErr || !gig) return NextResponse.json({ error: "Gig not found" }, { status: 404 });

    if (senderId !== gig.poster_id && senderId !== gig.assigned_worker_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Safety Check
    if (isUnsafeMessage(content)) {
      await supabase.from("chat_blocked_logs").insert({
        room_id: gigId, // Maps to gig_id
        sender_id: senderId,
        message: content,
        reason: "Contact Info Detected",
      });
      return NextResponse.json({ success: false, blocked: true });
    }

    // 3. Insert Safe Message
    const { data, error } = await supabase
      .from("messages")
      .insert({
        gig_id: gigId,
        sender_id: senderId,
        content: content,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: data });

  } catch (err: any) {
    console.error("Chat Send Error:", err);
    return NextResponse.json({ error: err.message || "Failed to send" }, { status: 500 });
  }
}