"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";

// --- COLLEGES LIST ---
const COLLEGES = [
  "SRM (Vadapalani)",
  "SRM (Ramapuram)",
  "SRM (Kattankulathur)",
  "DG Vaishnav",
  "MOP Vaishnav",
  "VIT Vellore",
  "VIT Chennai",
  "Sathyabama",
  "Saveetha",
  "CIT",
  "Other South University"
];

export default function AuthPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  // Mode Toggles
  const [view, setView] = useState<"LOGIN" | "SIGNUP">("LOGIN");
  const [loginMethod, setLoginMethod] = useState<"PASSWORD" | "OTP">("PASSWORD");

  // Form State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  // Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState(COLLEGES[0]);

  // --- HELPER: SYNC USER TO DB ---
  const syncUser = async (id: string, email: string, name?: string, phone?: string, college?: string) => {
    try {
      await fetch("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email, name, phone, college }),
      });
    } catch (e) {
      console.error("Sync failed", e);
    }
  };

  // --- SUBMIT HANDLER (Triggered by Button OR Enter Key) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop page reload
    setLoading(true);
    setMessage("");

    if (view === "LOGIN") {
      await handleLogin();
    } else {
      await handleSignup();
    }
  };

  const handleLogin = async () => {
    // 1. SMART CHECK: Does user exist?
    // We check the public 'users' table first to guide the user
    const { data: userExists } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (!userExists) {
      setLoading(false);
      setMessage("Account not found. Please Sign Up below.");
      setView("SIGNUP"); // <--- Auto-switch to Signup
      return;
    }

    let error = null;

    if (loginMethod === "OTP") {
      // OTP Login
      const res = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      error = res.error;
      if (!error) {
        setLoading(false);
        return router.push(`/verify?email=${encodeURIComponent(email)}&mode=login`);
      }
    } else {
      // Password Login
      const res = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      error = res.error;
      
      if (!error) {
        // Sync just in case, then redirect
        await syncUser(res.data.user?.id!, email);
        router.push("/dashboard");
        return;
      }
    }

    setLoading(false);
    if (error) setMessage(error.message);
  };

  const handleSignup = async () => {
    // Basic Validation
    if (!email || !password || !name || !phone) {
      setLoading(false);
      return setMessage("Please fill in all fields.");
    }

    // Supabase Signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone: phone,
          college: college,
        },
      },
    });

    if (error) {
      setLoading(false);
      return setMessage(error.message);
    }

    if (data.user) {
      // Sync to public DB
      await syncUser(data.user.id, email, name, phone, college);
      setLoading(false);
      
      if (data.session) {
        router.push("/dashboard");
      } else {
        setMessage("Signup successful! Please check your email to confirm.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-purple-600 p-6 text-center">
          <div className="flex justify-center mb-2">
             <div className="bg-white p-2 rounded-full h-12 w-12 flex items-center justify-center font-bold text-purple-600">
               DFM
             </div>
          </div>
          <h1 className="text-white text-xl font-bold">DoItForMe</h1>
          <p className="text-purple-200 text-sm">Gig work made simple</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            type="button" // Important: preventing form submit
            onClick={() => { setView("LOGIN"); setMessage(""); }}
            className={`w-1/2 p-4 text-sm font-semibold transition-colors ${
              view === "LOGIN" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500 hover:text-purple-500"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setView("SIGNUP"); setMessage(""); }}
            className={`w-1/2 p-4 text-sm font-semibold transition-colors ${
              view === "SIGNUP" ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-500 hover:text-purple-500"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Container */}
        <div className="p-6">
          <form onSubmit={handleSubmit}> {/* <--- The Wrapper handling Enter Key */}
            
            {/* LOGIN VIEW */}
            {view === "LOGIN" && (
              <div className="space-y-4">
                {/* Method Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                  <button
                    type="button"
                    onClick={() => setLoginMethod("PASSWORD")}
                    className={`flex-1 text-xs py-2 rounded-md font-medium transition-all ${
                      loginMethod === "PASSWORD" ? "bg-white shadow text-gray-800" : "text-gray-500"
                    }`}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("OTP")}
                    className={`flex-1 text-xs py-2 rounded-md font-medium transition-all ${
                      loginMethod === "OTP" ? "bg-white shadow text-gray-800" : "text-gray-500"
                    }`}
                  >
                    OTP / Magic Link
                  </button>
                </div>

                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full p-3 border rounded-lg text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                {loginMethod === "PASSWORD" && (
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-3 border rounded-lg text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
              </div>
            )}

            {/* SIGNUP VIEW */}
            {view === "SIGNUP" && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full p-3 border rounded-lg text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  type="email"
                  placeholder="Email (will be your username)"
                  className="w-full p-3 border rounded-lg text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full p-3 border rounded-lg text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Select University</label>
                  <select
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full p-3 border rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 appearance-none"
                  >
                    {COLLEGES.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <input
                  type="password"
                  placeholder="Create Password"
                  className="w-full p-3 border rounded-lg text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {/* Messages */}
            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm text-center ${message.includes("successful") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit" // <--- Triggers onSubmit
              disabled={loading}
              className="w-full mt-6 bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-purple-300"
            >
              {loading ? "Processing..." : view === "LOGIN" ? (loginMethod === "PASSWORD" ? "Login" : "Send Login Link") : "Sign Up"}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}