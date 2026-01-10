// components/LogoutButton.tsx
"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react"; // Ensure you have installed lucide-react

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = supabaseBrowser();

  const handleLogout = async () => {
    setLoading(true);
    // 1. Sign out from Supabase (clears cookies)
    await supabase.auth.signOut();
    
    // 2. Refresh router to clear server cache & redirect
    router.refresh(); 
    router.replace("/login"); 
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium border border-red-200 mt-6"
    >
      <LogOut size={18} />
      <span>{loading ? "Logging out..." : "Log Out"}</span>
    </button>
  );
}