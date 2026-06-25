import type { ToolInfo } from '../../types/index';

export const MARKETING_LAB_TOOL_DATA: Record<string, ToolInfo> = {
  'utm-builder': {
    useCases: [
      'Tagging campaign URLs so Google Analytics actually tells you something',
      'Tracking where your social media traffic is really coming from',
      'Measuring which email campaigns drive actual clicks',
      'A/B testing ad campaigns with proper attribution',
    ],
    tips: [
      "Stick to lowercase for source and medium — it's less error-prone",
      'Keep campaign names consistent across all your channels',
      'Hyphens over spaces in campaign names — URLs thank you later',
      'Document your UTM conventions so your team stays aligned',
    ],
    related: ['seo-meta', 'og-preview'],
  },
  'seo-meta': {
    useCases: [
      'Writing title tags that actually get clicks in search results',
      "Crafting meta descriptions that don't get truncated awkwardly",
      'Generating Open Graph tags so your links look good on social',
      'Previewing how your page will appear in Google before publishing',
    ],
    tips: [
      'Title: 50–60 characters keeps you safe from truncation',
      'Description: 150–160 characters is the sweet spot',
      'Get your target keyword near the beginning — it matters',
      'Every page deserves its own unique title and description',
    ],
    related: ['utm-builder', 'social-counter'],
  },
  'social-counter': {
    useCases: [
      'Checking character limits before you hit post and get cut off',
      'Optimizing tweet length for maximum engagement',
      'Writing LinkedIn posts that don\'t get buried behind "...see more"',
      'Planning Instagram captions without counting characters manually',
    ],
    tips: [
      'Twitter allows 280, but 100–120 characters gets way more engagement',
      'LinkedIn: 3000 max, but 1300 is where the "see more" cutoff hits',
      'Instagram: 2200 max, but only the first 125 show in the feed',
      'Always leave room for media attachments and hashtags',
    ],
    related: ['seo-meta', 'utm-builder'],
  },
  'color-palette': {
    useCases: [
      'Building a color palette for a new brand from scratch',
      'Creating complementary schemes that actually look good together',
      'Generating design system color tokens with purpose',
      "Exploring color harmonies when you're stuck on direction",
    ],
    tips: [
      'The 60-30-10 rule: dominant, secondary, accent — it works every time',
      'Complementary colors create energy and contrast',
      'Analogous colors feel calm and cohesive',
      'Always check your palette for accessibility contrast ratios',
    ],
    related: ['contrast-checker', 'seo-meta'],
  },
  'og-preview': {
    useCases: [
      'Previewing how your link looks before sharing on social media',
      'Checking that OG image and description are set correctly',
      'Debugging why a shared link looks wrong on Twitter or Facebook',
      'Generating the exact meta tags your page needs',
    ],
    tips: [
      'The Twitter card preview shows the large image format',
      'Facebook truncates descriptions around 110 characters in the preview',
      'LinkedIn pulls OG tags but has its own card styling',
      'Copy the generated tags and paste them into your <head>',
    ],
    related: ['seo-meta', 'social-resizer'],
  },
  'social-resizer': {
    useCases: [
      "Resizing a hero image to fit Twitter's post dimensions",
      'Cropping a photo for an Instagram square post',
      'Creating a LinkedIn banner from a landscape photo',
      'Preparing profile pictures for multiple platforms at once',
    ],
    tips: [
      'Center-crop ensures the most important part stays visible',
      'Each preset shows the platform name and exact pixel dimensions',
      'PNG export preserves quality — no compression artifacts',
      'Start with the largest image you have for best results',
    ],
    related: ['og-preview', 'image-compress'],
  },
  'brand-extractor': {
    useCases: [
      "Extracting brand colors and fonts from a competitor's website",
      'Building a style guide from an existing site before a redesign',
      'Grabbing logo and favicon URLs for client onboarding',
      'Pulling OG meta data for social media audits',
    ],
    tips: [
      'Some sites block cross-origin requests — try another URL if extraction fails',
      'Colors include CSS custom properties and inline styles',
      'Fonts are extracted from font-family declarations and @font-face rules',
      'Copy as CSS variables to drop directly into your project',
    ],
    related: ['color-palette', 'brand-guidelines'],
  },
  'social-scheduler': {
    useCases: [
      'Planning a week of social media content across multiple platforms',
      'Generating optimal posting times based on platform best practices',
      'Maintaining a consistent posting schedule without manual planning',
      'Exporting a content calendar as CSV for team collaboration',
    ],
    tips: [
      'Select your platforms and content types, then hit Generate for a 4-week plan',
      'Browser notifications remind you 15 minutes before each scheduled post',
      'Schedules persist across sessions — come back anytime to view or modify',
      'Export as CSV to share with your team or import into other tools',
    ],
    related: ['social-counter', 'social-resizer'],
  },
};

export function getMarketingLabToolInfo(toolId: string): ToolInfo {
  return MARKETING_LAB_TOOL_DATA[toolId] || { useCases: [], tips: [], related: [] };
}
