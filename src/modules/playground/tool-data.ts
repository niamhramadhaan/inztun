import type { ToolInfo } from '../../types/index';

export const PLAYGROUND_TOOL_DATA: Record<string, ToolInfo> = {
  'typing-test': {
    useCases: ['Want to know your actual WPM? This tells you', 'Practicing for a coding interview that involves live typing', 'Testing your speed before adding it to your resume', 'Challenging your friends to a typing showdown'],
    tips: ['Accuracy first — speed comes naturally once you stop making mistakes', 'Touch typing with all 10 fingers is the real unlock', 'The test ends when you finish the text — no timer pressure', 'Different texts each time so you can\'t memorize the pattern'],
    related: ['banner-generator'],
  },
  'banner-generator': {
    useCases: ['Creating text-based banners for terminal applications', 'Adding retro flair to documents or presentations', 'Building headers for CLI tools that look intentional', 'Making text that stands out in plain-text environments'],
    tips: ['Short text works best — long words get stretched and hard to read', 'Uppercase letters render the cleanest', 'Copy output and drop it straight into your terminal or README', 'Numbers and basic punctuation are supported'],
    related: ['typing-test', 'pixel-art'],
  },
  'pixel-art': {
    useCases: ['Creating retro-style sprites for games', 'Designing pixel-perfect icons by hand', 'Making fun avatars or profile pictures', 'Learning color theory through constrained art'],
    tips: ['Start with 16x16 — it\'s easier to manage and looks more intentional', 'Flood fill (bucket) is great for quickly coloring backgrounds', 'Undo supports up to 30 steps — experiment freely', 'Export scales up automatically so your art looks crisp at any size'],
    related: ['banner-generator', 'css-gradient'],
  },
};

export function getPlaygroundToolInfo(toolId: string): ToolInfo {
  return PLAYGROUND_TOOL_DATA[toolId] || { useCases: [], tips: [], related: [] };
}
