import { useAuth } from "../useAuth";
import { createAdminNotification } from "../../services/adminNotificationService";

export function useAdminRecordNotification() {
  const { user } = useAuth();

  return (title: string, message: string) => {
    if (!user?.uid) {
      return;
    }

    void createAdminNotification({
      title,
      message,
      category: "records",
      source: "petCorner",
    }).catch(() => undefined);
  };
}
