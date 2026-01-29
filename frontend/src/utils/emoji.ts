export const getEmojiUrl = (emojiChar: string): string => {
    // Convert emoji character to unified hex code
    // Example: 👍 -> 1f44d
    const codePoints = [];
    for (const char of emojiChar) {
        codePoints.push(char.codePointAt(0)?.toString(16));
    }
    const unified = codePoints.join('-');
    return `/emoji/${unified}.png`;
};
