import type { ToolInfo } from '../../types/index';

export const DESIGN_STUDIO_TOOL_DATA: Record<string, ToolInfo> = {
  'css-gradient': {
    useCases: [
      "Building a gradient background that doesn't look like 2012",
      'Designing hero sections with smooth color transitions',
      'Creating gradient buttons and cards that pop',
      'Exploring color transitions for brand work',
    ],
    tips: [
      'Three or more color stops create the smoothest transitions',
      'Linear at 135deg is the sweet spot for diagonal flows',
      'Radial gradients naturally draw the eye to the center',
      'Layer gradients with rgba for added depth and richness',
    ],
    related: ['border-radius', 'typography-scale'],
  },
  'border-radius': {
    useCases: [
      'Designing pill-shaped buttons and tags',
      'Creating organic, blob-like shapes for modern layouts',
      'Matching corner radii to your design system tokens',
      'Previewing asymmetric corner styles for unique elements',
    ],
    tips: [
      'Equal radii on all four corners gives you that clean, uniform look',
      'Push it past 50% for circles and ovals',
      'Asymmetric radii create interesting, distinctive shapes',
      'Scale your radius proportionally to the component size',
    ],
    related: ['css-gradient', 'typography-scale'],
  },
  'typography-scale': {
    useCases: [
      'Establishing a heading hierarchy that actually makes sense',
      'Generating type scales for a new design system',
      'Calculating responsive font sizes that scale smoothly',
      'Building modular scales that feel intentional',
    ],
    tips: [
      'Perfect Fourth (1.333) is a safe, balanced default',
      'Golden Ratio (1.618) feels bolder and more dramatic',
      'Keep your base size between 14–18px for comfortable reading',
      'Rem units are better for accessibility than px',
    ],
    related: ['spacing-system', 'css-gradient'],
  },
  'spacing-system': {
    useCases: [
      'Building a consistent spacing token set for your design system',
      'Generating CSS custom properties for margins and padding',
      'Creating Tailwind-compatible spacing scales',
      'Establishing a padding/margin system that removes guesswork',
    ],
    tips: [
      '8px base is the industry standard — hard to go wrong with it',
      '4px for tight UI, 8px for general spacing',
      'Keep it to 8–10 steps — too many choices slow you down',
      'Name your steps clearly: space-1 through space-N',
    ],
    related: ['typography-scale', 'border-radius'],
  },
  'image-compress': {
    useCases: [
      'Shrinking images before uploading to your site or CMS',
      'Reducing email attachment sizes without visible quality loss',
      'Optimizing product photos for faster page loads',
      'Batch-compressing assets before deploying',
    ],
    tips: [
      "JPEG quality 70–85 is the sweet spot for web — you won't see the difference",
      'WebP usually beats JPEG and PNG on file size',
      "PNG is lossless so quality slider won't affect it",
      'Compare the two previews side-by-side before downloading',
    ],
    related: ['image-resize', 'image-convert'],
  },
  'image-resize': {
    useCases: [
      'Fitting hero images to exact breakpoint dimensions',
      'Creating thumbnails from full-resolution photos',
      'Preparing avatars for profile picture slots',
      'Scaling images down before uploading to save bandwidth',
    ],
    tips: [
      'Lock aspect ratio is on by default — turn it off for forced crops',
      'Type exact pixel values instead of guessing with sliders',
      'Preview scales down but the download uses full resolution',
      'Works with any image format your browser supports',
    ],
    related: ['image-compress', 'image-convert'],
  },
  'image-convert': {
    useCases: [
      'Converting PNG screenshots to JPEG for smaller file size',
      'Switching to WebP for modern browser performance',
      'Converting transparent PNGs to JPEG (white background added)',
      'Preparing images for platforms that only accept specific formats',
    ],
    tips: [
      'WebP gives the best compression for web — use it when you can',
      "JPEG quality slider doesn't apply to PNG (it's always lossless)",
      'Converting from PNG to JPEG adds a white background for transparency',
      'The preview shows what the converted image will look like',
    ],
    related: ['image-compress', 'image-resize'],
  },
  'contrast-checker': {
    useCases: [
      'Checking if your text color passes WCAG accessibility standards',
      'Verifying contrast before shipping a design',
      'Finding the right background color for readable text',
      'Auditing an existing design system for accessibility gaps',
    ],
    tips: [
      'AA Normal (4.5:1) is the minimum most sites should aim for',
      'AAA Normal (7:1) is the gold standard for accessible text',
      'Swap button lets you quickly test the inverse combination',
      'The live preview shows exactly how readable the text will be',
    ],
    related: ['color-palette', 'image-compress'],
  },
  'favicon-generator': {
    useCases: [
      'Generating all favicon sizes from a single logo image',
      'Creating Apple Touch icons for iOS home screens',
      'Building Android Chrome icons for PWA manifests',
      'Quick favicon for a new project without opening Photoshop',
    ],
    tips: [
      'Square images give the best results — crop beforehand if needed',
      'Each size has its use case shown next to the preview',
      'Downloads as transparent PNG',
      'The 512×512 size works for PWA splash screens too',
    ],
    related: ['image-compress', 'image-resize'],
  },
  'logo-builder': {
    useCases: [
      'Creating a quick logo for a side project',
      'Building icon-based marks from the inztun icon set',
      'Designing simple geometric logos with shapes and text',
      'Exporting PNG logos for use in headers, favicons, or social',
    ],
    tips: [
      'Choose a shape background first, then layer your icon or text on top',
      'Use the size slider to find the right balance between icon and shape',
      'Import colors from your saved palette for brand consistency',
      'Downloaded PNG is 256×256 — use Image Resize for other dimensions',
    ],
    related: ['favicon-generator', 'brand-guidelines'],
  },
  'image-crop': {
    useCases: [
      'Cropping photos to specific aspect ratios for social media',
      'Removing unwanted edges from screenshots',
      'Creating square profile pictures from landscape photos',
      'Isolating a subject from a wider shot',
    ],
    tips: [
      'Use the ratio presets for common formats like 1:1, 16:9, 4:3',
      'Drag the corner handles for precise control',
      'The rule-of-thirds grid helps with composition',
      'Output uses original image resolution, not the preview size',
    ],
    related: ['image-resize', 'image-filters'],
  },
  'image-filters': {
    useCases: [
      'Quick grayscale conversion for black-and-white effects',
      'Adjusting brightness and contrast before publishing',
      'Applying sepia tone for vintage aesthetic',
      'Sharpening slightly soft photos',
    ],
    tips: [
      'Filters stack — combine grayscale + brightness for custom looks',
      'Blur is useful for creating background bokeh effects',
      'The split view shows original vs filtered side by side',
      'Download uses full original resolution, not the preview size',
    ],
    related: ['image-compress', 'image-crop'],
  },
  'image-metadata': {
    useCases: [
      'Checking what EXIF data your photos contain before sharing',
      'Stripping GPS coordinates before posting photos publicly',
      'Verifying camera settings used for a particular shot',
      'Extracting metadata for photo cataloging',
    ],
    tips: [
      'GPS coordinates link to OpenStreetMap for easy viewing',
      'Strip metadata before uploading to social media for privacy',
      'Copy JSON exports all metadata for programmatic use',
      "Canvas redraw always strips EXIF — that's how the strip feature works",
    ],
    related: ['image-compress', 'image-convert'],
  },
  'font-pairer': {
    useCases: [
      'Finding the right heading + body font combination for a new project',
      'Exploring curated font pairs that work well together',
      'Getting Google Fonts import CSS for your chosen pair',
      'Testing how different font sizes look together',
    ],
    tips: [
      'Serif headings with sans-serif body is a classic, reliable combo',
      'Match the mood: geometric fonts for tech, serifs for editorial',
      'Adjust the size sliders to see how the pair reads at different scales',
      'Copy the CSS to get the Google Fonts @import ready to paste',
    ],
    related: ['typography-scale', 'brand-guidelines'],
  },
  'brand-guidelines': {
    useCases: [
      'Generating a full brand identity board from your brand kit data',
      'Creating client-ready brand guidelines as PNG or PDF',
      'Showing logo usage rules, color system, and typography in one visual',
      'Producing brand boards for presentations and portfolios',
    ],
    tips: [
      'Upload a logo for the best results — it appears across multiple panels',
      'Load a saved Brand Kit to auto-fill colors, fonts, and name',
      'Use 2x resolution for retina displays and print-quality output',
      'Export as PDF for client deliverables, PNG for social sharing',
    ],
    related: ['logo-builder', 'font-pairer'],
  },
};

export function getDesignStudioToolInfo(toolId: string): ToolInfo {
  return DESIGN_STUDIO_TOOL_DATA[toolId] || { useCases: [], tips: [], related: [] };
}
