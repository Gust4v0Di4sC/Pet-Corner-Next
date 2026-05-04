import type { ProfileImageFeedback } from "@/features/account/components/profile-sidebar/profile-sidebar.types";

export function shouldUseUnoptimizedProfileImage(profileImageUrl: string): boolean {
  return /^https?:\/\//i.test(profileImageUrl);
}

export function getProfileImageFeedbackClassName(feedback: ProfileImageFeedback): string {
  if (feedback.type === "error") {
    return "bg-red-950/40 text-red-200";
  }

  return "bg-emerald-500/20 text-emerald-300";
}
