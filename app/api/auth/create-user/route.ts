import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Added: name, phone, college to destructuring
    const { id, email, name, phone, college } = body;

    console.log("API: Syncing user:", email);

    if (!id || !email) {
      return NextResponse.json({ error: "Missing ID or Email" }, { status: 400 });
    }

    // Initialize Admin Client (Bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // --- STEP 1: HANDLE STALE DATA (GHOST USERS) ---
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser && existingUser.id !== id) {
      console.log(`API: Cleaning up stale user (Old ID: ${existingUser.id})`);
      await supabase.from("users").delete().eq("id", existingUser.id);
      await supabase.from("wallets").delete().eq("user_id", existingUser.id);
    }

    // --- STEP 2: UPSERT NEW USER DATA ---
    const { error: userError } = await supabase
      .from("users")
      .upsert({ 
        id: id, 
        email: email,
        // Use provided name or fallback to email prefix
        name: name || email.split("@")[0],
        phone: phone || null,
        college: college || null, // <--- SAVING COLLEGE HERE
        kyc_verified: false 
      })
      .select()
      .single();

    if (userError) {
      console.error("API: User Upsert Error:", userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // --- STEP 3: ENSURE WALLET EXISTS ---
    const { error: walletError } = await supabase
      .from("wallets")
      .upsert(
        { user_id: id, balance: 0, frozen: 0, total_earned: 0, total_withdrawn: 0 }, 
        { onConflict: "user_id", ignoreDuplicates: true }
      );

    if (walletError) console.error("API: Wallet Error:", walletError);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("API: Critical Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}