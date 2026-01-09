import { NextResponse } from "next/server";
import { Cashfree } from "cashfree-pg";
import { createClient } from "@supabase/supabase-js";

// Initialize Cashfree
// @ts-ignore
Cashfree.XClientId = process.env.CASHFREE_APP_ID!;
// @ts-ignore
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY!;
// @ts-ignore
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { orderId, gigId } = await req.json();

    if (!orderId || !gigId) {
      return NextResponse.json({ error: "Missing verification data" }, { status: 400 });
    }

    // 1. Verify Status with Cashfree
    // @ts-ignore
    const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
    
    // Check if any transaction in the list is successful
    const validPayment = response.data?.find((p: any) => p.payment_status === "SUCCESS");

    if (!validPayment) {
      return NextResponse.json({ error: "Payment pending or failed" }, { status: 400 });
    }

    // 2. Idempotency: Check if already processed
    const { data: existingTxn } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("gateway_order_id", orderId)
      .single();

    if (existingTxn) {
      return NextResponse.json({ success: true, message: "Transaction already processed" });
    }

    // 3. Fetch Gig Details
    const { data: gig } = await supabaseAdmin
      .from("gigs")
      .select("poster_id, assigned_worker_id")
      .eq("id", gigId)
      .single();

    if (!gig) throw new Error("Gig not found");

    // 4. Create Transaction Record
    const { error: txnError } = await supabaseAdmin.from("transactions").insert({
      gig_id: gigId,
      user_id: gig.poster_id,
      amount: validPayment.payment_amount,
      type: "ESCROW_DEPOSIT",
      status: "COMPLETED",
      gateway: "CASHFREE",
      gateway_order_id: orderId,
      gateway_payment_id: validPayment.cf_payment_id
    });

    if (txnError) throw txnError;

    // 5. Create or Update Escrow Record
    const { data: existingEscrow } = await supabaseAdmin
      .from("escrow")
      .select("id")
      .eq("gig_id", gigId)
      .single();

    if (existingEscrow) {
      await supabaseAdmin.from("escrow").update({
        amount: validPayment.payment_amount,
        amount_held: validPayment.payment_amount,
        status: "HELD",
        original_amount: validPayment.payment_amount,
        gateway_fee: 0 
      }).eq("gig_id", gigId);
    } else {
      await supabaseAdmin.from("escrow").insert({
        gig_id: gigId,
        poster_id: gig.poster_id,
        worker_id: gig.assigned_worker_id,
        amount: validPayment.payment_amount,
        amount_held: validPayment.payment_amount,
        original_amount: validPayment.payment_amount,
        platform_fee: 0,
        gateway_fee: 0,
        status: "HELD",
        release_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // 6. Update Gig Status
    await supabaseAdmin.from("gigs").update({
      status: "IN_PROGRESS",
      payment_status: "ESCROW_FUNDED",
      escrow_status: "HELD",
      escrow_amount: validPayment.payment_amount,
      escrow_locked_at: new Date().toISOString()
    }).eq("id", gigId);

    return NextResponse.json({ success: true, message: "Escrow funded successfully" });

  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}   