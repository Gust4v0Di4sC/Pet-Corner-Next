"use client";

import { useCallback, useState } from "react";
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
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const uploadProfileImage = useCallback(
    async (input: UploadCustomerProfileImageInput): Promise<CustomerProfileImageAsset> => {
      setErrorMessage(null);
      setIsUploading(true);

      try {
        return await saveCustomerProfileImage(input);
      } catch (error) {
        setErrorMessage(mapUploadErrorMessage(error));
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return {
    isUploading,
    errorMessage,
    clearError,
    uploadProfileImage,
  };
}
