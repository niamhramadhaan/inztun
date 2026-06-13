import type { ToolInfo } from '../../types/index';

export const PLAYGROUND_TOOL_DATA: Record<string, ToolInfo> = {
  'typing-test': {
    useCases: ['Improve your typing speed and accuracy', 'Practice for coding interviews', 'Test your WPM for job applications', 'Fun competitive challenge with friends'],
    tips: ['Focus on accuracy first, speed will follow', 'Use all 10 fingers for best results', 'The test ends when you complete the text', 'Try different texts for variety'],
    related: ['ascii-art', 'morse-code'],
  },
  'zalgo-text': {
    useCases: ['Create spooky Halloween messages', 'Add dramatic effect to social media posts', 'Generate glitch-style text for designs', 'Fun way to obfuscate text'],
    tips: ['Lower intensity (1-3) for readable glitch', 'Higher intensity (7-10) for maximum chaos', 'May not display correctly on all platforms', 'Copy and paste into social media'],
    related: ['flip-text', 'leet-speak'],
  },
  'flip-text': {
    useCases: ['Create upside-down text for social media', 'Fun way to confuse friends', 'Add visual interest to messages', 'Create puzzle-style text'],
    tips: ['Works best with simple letters and numbers', 'Some characters may not flip perfectly', 'Paste directly into Twitter, Discord, etc.', 'Combine with Zalgo for extra effect'],
    related: ['zalgo-text', 'leet-speak'],
  },
  'leet-speak': {
    useCases: ['Classic hacker/nerd culture text', 'Gaming usernames and profiles', 'Fun way to write messages', 'Nostalgic internet culture'],
    tips: ['Simple mode: single character substitution', 'Advanced mode: multi-character substitution', 'Not all letters have leet equivalents', 'Great for gaming tags'],
    related: ['flip-text', 'morse-code'],
  },
  'morse-code': {
    useCases: ['Learn Morse code basics', 'Send secret messages', 'Emergency communication practice', 'Fun encoding challenge'],
    tips: ['Use / to separate words', 'Dots (.) and dashes (-) are the basics', 'Play Sound to hear the morse code', 'International Morse standard used'],
    related: ['leet-speak', 'ascii-art'],
  },
  'ascii-art': {
    useCases: ['Create text-based banners', 'Add flair to terminal applications', 'Retro-style headers for documents', 'Fun way to display text'],
    tips: ['Keep text short for best results', 'Works best with uppercase letters', 'Copy output for use in terminals', 'Numbers and basic punctuation supported'],
    related: ['typing-test', 'morse-code'],
  },
};

export function getPlaygroundToolInfo(toolId: string): ToolInfo {
  return PLAYGROUND_TOOL_DATA[toolId] || { useCases: [], tips: [], related: [] };
}
