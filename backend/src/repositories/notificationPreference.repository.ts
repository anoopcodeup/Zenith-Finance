import { NotificationType } from "@prisma/client";
import { PrismaTx } from "../types/prisma";

/**
 * Check if a specific notification type is enabled for a user.
 * Defaults to true if no preference is set.
 */
export const isNotificationEnabledRepo = async (
    prisma: PrismaTx,
    userId: string,
    type: NotificationType
): Promise<boolean> => {
    const pref = await prisma.notificationPreference.findUnique({
        where: {
            userId_type: { userId, type },
        },
    });

    // default = enabled
    return pref?.enabled ?? true;
};
