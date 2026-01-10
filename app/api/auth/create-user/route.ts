import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, name, phone, college } = body;

    if (!id || !email) {
      return NextResponse.json({ error: "Missing ID or Email" }, { status: 400 });
    }

    // Initialize Admin Client (Bypasses RLS to ensure we can read/write everything)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // --- 1. FETCH EXISTING USER DATA ---
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    // --- 2. PREPARE SMART DATA (The Fix) ---
    // If user exists, keep their old data. Only overwrite if new data is sent (truthy).
    // If user is new, use the defaults.
    
    const finalName = name || existingUser?.name || email.split("@")[0];
    const finalPhone = phone || existingUser?.phone || null;
    const finalCollege = college || existingUser?.college || null;
    
    // Preserve verification status
    const finalKyc = existingUser?.kyc_verified || false;

    // --- 3. UPSERT USER ---
    const { error: userError } = await supabase
      .from("users")
      .upsert({ 
        id: id, 
        email: email,
        name: finalName,
        phone: finalPhone,
        college: finalCollege,
        kyc_verified: finalKyc,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      console.error("API: User Upsert Error:", userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // --- 4. ENSURE WALLET EXISTS ---
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