import type { ChangeEventHandler } from "react";
import type { SectionId } from "@/features/account/types/profile-dashboard";

export type ProfileSidebarUser = {
  name: string;
  email: string;
  profileImageUrl: string;
};

export type ProfileImageFeedback = {
  type: "success" | "error";
  message: string;
};

export type ProfileImageUploadState = {
  isUploading: boolean;
  feedbackItems: ProfileImageFeedback[];
};

export type ProfileSidebarState = {
  isExpanded: boolean;
  activeSection: SectionId;
  isLoggingOut: boolean;
};

export type ProfileSidebarActions = {
  onToggle: () => void;
  onClose: () => void;
  onSectionSelected: (section: SectionId) => void;
  onLogout: () => void;
  onProfileImageSelected: ChangeEventHandler<HTMLInputElement>;
};

export type ProfileSidebarProps = {
  user: ProfileSidebarUser;
  sidebar: ProfileSidebarState;
  profileImageUpload: ProfileImageUploadState;
  actions: ProfileSidebarActions;
};
