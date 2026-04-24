"use client";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  saveCustomerProfileImage,
  type CustomerProfileImageAsset,
} from "@/services/account/customer-profile-image.service";

type UploadCustomerProfileImageInput = {
  customerId: string;
  file: File;
};

function mapUploadErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Nao foi possivel enviar a foto de perfil agora.";
}

export function useCustomerProfileImageUpload() {
  const uploadMutation = useMutation({
    mutationFn: async (input: UploadCustomerProfileImageInput): Promise<CustomerProfileImageAsset> =>
      saveCustomerProfileImage(input),
  });

  const clearError = useCallback(() => {
    uploadMutation.reset();
  }, [uploadMutation]);

  const uploadProfileImage = useCallback(
    async (input: UploadCustomerProfileImageInput): Promise<CustomerProfileImageAsset> => {
      return uploadMutation.mutateAsync(input);
    },
    [uploadMutation]
  );

  return {
    isUploading: uploadMutation.isPending,
    errorMessage: uploadMutation.error ? mapUploadErrorMessage(uploadMutation.error) : null,
    clearError,
    uploadProfileImage,
  };
}

