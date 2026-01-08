import { NextResponse } from "next/server";
import { Cashfree } from "cashfree-pg";
import { supabaseServer } from "@/lib/supabaseServer";

// Initialize Cashfree
// @ts-ignore
Cashfree.XClientId = process.env.CASHFREE_APP_ID!;
// @ts-ignore
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY!;
// @ts-ignore
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX; // Switch to PRODUCTION when live

export async function POST(req: Request) {
  try {
    const { amount, gigId, posterId, posterPhone, posterEmail } = await req.json();

    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    // Security check
    if (!user || user.id !== posterId) {
      return NextResponse.json({ error: "Unauthorized transaction" }, { status: 401 });
    }

    if (!amount || !gigId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate Unique Order ID
    const orderId = `gig_${gigId}_${Date.now()}`;

    const request = {
      order_amount: Number(amount),
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: posterId,
        customer_phone: posterPhone || "9999999999",
        customer_email: posterEmail || user.email || "user@example.com",
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/gig/${gigId}?payment_status=verifying&order_id={order_id}`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
      },
      order_note: `Escrow for Gig ${gigId}`,
    };

    // @ts-ignore
    const response = await Cashfree.PGCreateOrder("2023-08-01", request);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Cashfree Create Order Error:", error.response?.data?.message || error.message);
    return NextResponse.json(
      { error: error.response?.data?.message || "Payment initialization failed" },
      { status: 500 }
    );
  }
}