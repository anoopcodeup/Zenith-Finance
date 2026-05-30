import { prisma } from "../config/prisma";
import { NotificationType } from "@prisma/client";
import { isNotificationEnabledRepo } from "../repositories/notificationPreference.repository";

export const isNotificationEnabled = (
  userId: string,
  type: NotificationType
) => {
  return isNotificationEnabledRepo(prisma, userId, type);
};
