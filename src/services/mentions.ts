const MENTION_REGEX = /@([a-zA-Z0-9._]{1,30})/g;
const MENTION_PATTERN = /@([a-zA-Z0-9._]{3,30})/;

export interface MentionMatch {
  username: string;
  startIndex: number;
  endIndex: number;
}

export const mentionsService = {
  parseMentions(text: string): MentionMatch[] {
    const matches: MentionMatch[] = [];
    let match: RegExpExecArray | null;

    while ((match = MENTION_REGEX.exec(text)) !== null) {
      matches.push({
        username: match[1].toLowerCase(),
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }

    return matches;
  },

  extractUsernames(text: string): string[] {
    const mentions = this.parseMentions(text);
    const unique = new Set<string>();
    mentions.forEach(m => unique.add(m.username));
    const result: string[] = [];
    unique.forEach(u => result.push(u));
    return result;
  },

  replaceMentionWithDisplay(text: string, username: string, displayName: string): string {
    const pattern = new RegExp(`@${escapeRegex(username)}\\b`, 'gi');
    return text.replace(pattern, `@${displayName}`);
  },

  stripMentions(text: string): string {
    return text.replace(MENTION_REGEX, '').trim();
  },

  getSuggestionRange(text: string, cursorPosition: number): { start: number; end: number; query: string } | null {
    const beforeCursor = text.slice(0, cursorPosition);
    const atIndex = beforeCursor.lastIndexOf('@');

    if (atIndex === -1) return null;

    const afterAt = text.slice(atIndex + 1, cursorPosition);
    if (/^[a-zA-Z0-9._]{0,30}$/.test(afterAt)) {
      return { start: atIndex, end: cursorPosition, query: afterAt.toLowerCase() };
    }

    return null;
  },

  isMention(text: string): boolean {
    MENTION_PATTERN.lastIndex = 0;
    return MENTION_PATTERN.test(text);
  },
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
