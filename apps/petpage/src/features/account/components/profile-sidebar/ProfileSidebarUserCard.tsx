import Image from "next/image";
import { UserRound } from "lucide-react";
import { PROFILE_IMAGE_ACCEPT } from "@/features/account/components/profile-dashboard.constants";
import { ProfileImageUploader } from "@/features/account/components/profile-sidebar/ProfileImageUploader";
import type {
  ProfileImageUploadState,
  ProfileSidebarActions,
  ProfileSidebarUser,
} from "@/features/account/components/profile-sidebar/profile-sidebar.types";
import {
  getProfileImageFeedbackClassName,
  shouldUseUnoptimizedProfileImage,
} from "@/features/account/components/profile-sidebar/profile-sidebar.utils";

type ProfileSidebarUserCardProps = {
  user: ProfileSidebarUser;
  isExpanded: boolean;
  profileImageUpload: ProfileImageUploadState;
  onProfileImageSelected: ProfileSidebarActions["onProfileImageSelected"];
};

export function ProfileSidebarUserCard({
  user,
  isExpanded,
  profileImageUpload,
  onProfileImageSelected,
}: ProfileSidebarUserCardProps) {
  return (
    <div
      className={`flex ${
        isExpanded ? "items-start gap-3 px-1" : "flex-col items-center gap-3 px-0"
      }`}
    >
      <div className="shrink-0">
        <ProfileAvatar user={user} />

        {isExpanded ? (
          <ProfileImageUploader
            accept={PROFILE_IMAGE_ACCEPT}
            isUploading={profileImageUpload.isUploading}
            onProfileImageSelected={onProfileImageSelected}
          />
        ) : null}
      </div>

      {isExpanded ? (
        <ExpandedUserDetails user={user} feedbackItems={profileImageUpload.feedbackItems} />
      ) : (
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Perfil
        </p>
      )}
    </div>
  );
}

function ProfileAvatar({ user }: { user: ProfileSidebarUser }) {
  return (
    <div className="relative h-14 w-14 overflow-hidden rounded-full border border-slate-600 bg-[#fb8b24]">
      {user.profileImageUrl ? (
        <Image
          src={user.profileImageUrl}
          alt={`Foto de perfil de ${user.name}`}
          fill
          sizes="56px"
          unoptimized={shouldUseUnoptimizedProfileImage(user.profileImageUrl)}
          className="object-cover"
        />
      ) : (
        <span className="inline-flex h-full w-full items-center justify-center text-white">
          <UserRound className="h-7 w-7" />
        </span>
      )}
    </div>
  );
}

function ExpandedUserDetails({
  user,
  feedbackItems,
}: {
  user: ProfileSidebarUser;
  feedbackItems: ProfileImageUploadState["feedbackItems"];
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="break-words text-2xl font-semibold leading-tight text-slate-100">
        Ola, {user.name}
      </p>
      <p className="max-w-full break-all text-sm text-slate-300">{user.email}</p>
      <p className="inline-flex rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300">
        Sessao ativa
      </p>
      {feedbackItems.map((feedback) => (
        <p
          key={`${feedback.type}-${feedback.message}`}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium ${getProfileImageFeedbackClassName(
            feedback
          )}`}
        >
          {feedback.message}
        </p>
      ))}
    </div>
  );
}
