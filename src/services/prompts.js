// Illustration-only prompt — browser adds D letters via Canvas compositor
const DAD_FACE = `Transform the uploaded family photo into a clean flat vector illustration for a custom apparel print.

WHAT TO CREATE:
A flat vector cartoon illustration of all the people in the uploaded photo.
Centered on pure white background. Portrait orientation (taller than wide).
The illustration should look like a professional custom embroidery or screen-print design.

STYLE:
• Flat vector art — embroidery/screen-print aesthetic
• Strong bold black outlines around all figures (clean, crisp edges)
• Solid flat color fills EVERYWHERE — absolutely no gradients, no shading, no drop shadows, no highlights, no 3D effects
• Simplified clean shapes — professional apparel graphic quality
• White background (#FFFFFF)
• People float directly on white — NO box, NO frame, NO rectangle container, NO border around figures

PEOPLE:
• Include ALL people from the photo
• Preserve their relative sizes, poses, and arrangement
• Full body preferred, or cropped at waist — keep natural proportions
• Simplified recognizable clothing in flat solid colors matching the original

FACES — include simple flat vector features on every person:
• Skin tone: flat solid #D3B385 on ALL people (faces, necks, hands, arms) — no variation
• Eyes: simple flat almond/oval shapes, solid dark fill
• Eyebrows: clean arcs or short lines
• Nose: minimal dot or short line
• Mouth: simple flat curved line or shape
• Features must be simple and stylized — NOT realistic, NOT 3D, NO gradients on face

HAIR:
• Simplified solid-fill shapes
• Preserve recognizable hair color and general style
• No texture, no gradient

OUTPUT QUALITY:
Clean flat vector illustration on white background.
Professional custom apparel print quality.
ONLY the people — no D letters, no text, no decorative elements.`

export const PROMPTS = {
  'dad-face': [
    { label: 'DAD', prompt: DAD_FACE },
  ],
}
