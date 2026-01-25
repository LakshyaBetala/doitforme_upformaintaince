import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(dateString: string | null) {
  if (!dateString) return "";

  // 1. Force UTC interpretation if "Z" or offset is missing
  // Supabase often returns "2023-10-25T10:00:00" (no Z). We must add it.
  const safeDateString = dateString.endsWith("Z") || dateString.includes("+") 
    ? dateString 
    : `${dateString}Z`;
  
  const date = new Date(safeDateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // 2. Handle future dates (e.g. slight clock skew)
  if (seconds < 0) return "Just now";

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + "y ago";

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + "mo ago";

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + "d ago";

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + "h ago";

  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + "m ago";

  return "Just now";
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}