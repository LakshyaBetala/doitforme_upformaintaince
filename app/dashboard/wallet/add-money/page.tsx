"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { ArrowLeft, Wallet, CreditCard, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function AddMoneyPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Load User on Mount
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
      else router.push("/login");
    };
    getUser();
  }, [router, supabase]);

  // Handle Payment
  const handlePayment = async () => {
    if (!amount || Number(amount) < 1) return alert("Please enter a valid amount (Min ₹1)");
    setLoading(true);

    try {
      // 1. Create Order on Server (You need this API route)
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), userId: user?.id }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Order creation failed");

      // 2. Open Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Add this to .env.local
        amount: data.order.amount,
        currency: "INR",
        name: "DoItForMe",
        description: "Wallet Recharge",
        order_id: data.order.id,
        handler: async function (response: any) {
          // 3. Verify Payment on Server
          await fetch("/api/payment/verify", {
            method: "POST",
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              userId: user?.id,
              amount: Number(amount)
            }),
          });
          
          alert("Payment Successful! Wallet Updated.");
          router.push("/dashboard");
        },
        prefill: {
          email: user?.email,
        },
        theme: {
          color: "#8825F5",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (error: any) {
      alert("Payment Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="min-h-screen bg-[#0B0B11] text-white p-6 lg:p-12 selection:bg-[#8825F5] selection:text-white">
        <div className="max-w-xl mx-auto space-y-8">
          
          {/* Header */}
          <div>
            <Link href="/dashboard" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-4 group w-fit">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Wallet className="w-8 h-8 text-[#8825F5]" /> Add Money
            </h1>
            <p className="text-white/50 mt-2">Top up your wallet securely via Razorpay.</p>
          </div>

          {/* Amount Input Card */}
          <div className="bg-[#1A1A24] border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/60 uppercase tracking-wider">Amount to Add</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-white/40 font-bold">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500"
                  className="w-full bg-[#0B0B11] border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-3xl font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-[#8825F5] focus:ring-1 focus:ring-[#8825F5] transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Amounts */}
            <div className="flex gap-3">
              {[100, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all hover:scale-105"
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <button
              onClick={handlePayment}
              disabled={loading || !amount}
              className="w-full py-4 bg-[#8825F5] hover:bg-[#7a1fe0] text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(136,37,245,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <CreditCard className="w-5 h-5" />}
              {loading ? "Processing..." : `Pay ₹${amount || "0"}`}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-white/30 pt-4 border-t border-white/5">
              <ShieldCheck className="w-3 h-3" />
              <span>Secured by Razorpay • 100% Safe</span>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}