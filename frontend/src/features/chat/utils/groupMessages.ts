import type { Message } from '../../../types';

export interface MessageGroup {
    id: string; // Unique ID for the group (e.g., first-message-id)
    user_id: number;
    messages: Message[];
    date: Date;
}

/**
 * Groups messages by user and time (5 minutes threshold).
 * Also considers date changes to break groups.
 */
export const groupMessages = (messages: Message[]): MessageGroup[] => {
    if (!messages.length) return [];

    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;

    messages.forEach((msg) => {
        const msgDate = new Date(msg.created_at);

        // If no current group, start one
        if (!currentGroup) {
            currentGroup = {
                id: `group-${msg.id}`,
                user_id: msg.user_id,
                messages: [msg],
                date: msgDate,
            };
            return;
        }

        const lastMsg = currentGroup.messages[currentGroup.messages.length - 1];
        const lastMsgDate = new Date(lastMsg.created_at);

        // Check conditions to break the group:
        // 1. Different user
        // 2. Time gap > 5 minutes
        // 3. Different calendar day
        const isDifferentUser = msg.user_id !== currentGroup.user_id;
        const timeDiff = msgDate.getTime() - lastMsgDate.getTime();
        const isTimeGap = timeDiff > 5 * 60 * 1000; // 5 minutes
        const isDifferentDay = msgDate.toDateString() !== lastMsgDate.toDateString();

        if (isDifferentUser || isTimeGap || isDifferentDay) {
            // Push current group and start a new one
            groups.push(currentGroup);
            currentGroup = {
                id: `group-${msg.id}`,
                user_id: msg.user_id,
                messages: [msg],
                date: msgDate,
            };
        } else {
            // Add to current group
            currentGroup.messages.push(msg);
        }
    });

    // Push the last group
    if (currentGroup) {
        groups.push(currentGroup);
    }

    return groups;
};
