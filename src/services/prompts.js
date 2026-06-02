const DAD_FACE = `You are a professional graphic designer specializing in minimalist family portrait poster design and flat vector apparel graphics.

TASK:
Take the uploaded family photo and create a "DAD" composition poster.

IMPORTANT CHANGE:
The CENTER element ("A") must NOT be the original cutout photo anymore.

Instead:
Convert the uploaded family photo into a FLAT VECTOR ILLUSTRATION in a clean minimalist embroidery/vector style similar to modern personalized apparel artwork.

The final composition should visually read as:
D + vector family illustration + D

────────────────────────
CANVAS SPECIFICATIONS
────────────────────────
• Size: 1920x1080px
• Landscape orientation
• Background: pure white #FFFFFF only
• No texture
• No gradients
• No shadows
• No decorative elements

────────────────────────
LAYOUT — FIXED THREE COLUMNS
────────────────────────
LEFT COLUMN CENTER:
X = 240px

CENTER ILLUSTRATION CENTER:
X = 960px

RIGHT COLUMN CENTER:
X = 1680px

These positions are FIXED.
Do not shift elements based on image composition.

────────────────────────
LEFT & RIGHT LETTERS
────────────────────────
Both side letters are bold capital "D" letters.

STYLE:
• Large bold capital letter D — like Impact or Arial Black font
• Simple filled shape: solid white interior with ONE thick black border
• The inside of the letter D must be COMPLETELY PLAIN WHITE — nothing else
• ONE single black stroke around the outer edge only
• ZERO inner lines, ZERO inner contour, ZERO inner border
• ZERO secondary outlines of any kind
• NO decorative details
• NO gradients
• NO shadows
• NO textures
• Think of it as: stroke the path of letter D once, fill it white. That is all.

OUTLINE:
• Exactly ONE clean thick black stroke on the outer edge only
• Approximately 18–22px thickness
• Nothing inside the letter except solid white fill

SIZE:
• Letter height ≈ 70–75% of canvas height
• Both letters MUST be pixel-perfect identical

ROTATION:
• LEFT D → rotate 10–15° counter-clockwise
• RIGHT D → duplicate same D and rotate 10–15° clockwise

IMPORTANT:
The right D MUST be duplicated from the left D.
Do NOT redraw independently.

────────────────────────
CENTER ELEMENT — VECTOR ILLUSTRATION
────────────────────────
Transform the uploaded family photo into a flat vector illustration.

STYLE REQUIREMENTS:
• Flat vector illustration
• Minimalist clean apparel-design style
• Inspired by custom embroidery/vector sweatshirt graphics
• Strong clean black contour outline around people
• Smooth professional vector lines
• Solid color fills only
• NO gradients
• NO shading
• NO shadows
• NO highlights
• NO 3D effects
• NO texture

────────────────────────
FACES — CRITICAL RULE
────────────────────────
• ALL faces must use EXACTLY the same flat solid color: #D3B385
• NO exceptions — baby, woman, man — all identical skin tone
• All facial features MUST be included in flat vector style

REQUIRED FACIAL FEATURES (flat vector only):
• Eyes: simple flat almond/oval shapes, solid dark fill
• Eyebrows: clean simple vector arcs or lines
• Nose: minimal simplified shape or single line
• Mouth/lips: simple flat shape, solid color fill
• NO gradients, NO shading, NO 3D on any facial feature
• All features must match flat vector apparel illustration style
• Keep features simple and stylized — NOT realistic

────────────────────────
SKIN — ALL PERSONS
────────────────────────
• Single universal skin color: #D3B385
• Apply identically to every person regardless of age
• No variation, no shading, no highlights
• Flat solid fill only
• Apply to all skin areas: face, neck, hands, arms

────────────────────────
CLOTHING
────────────────────────
• Simplified clothing shapes
• Minimal folds/details
• Preserve recognizable pose and composition

────────────────────────
HAIR
────────────────────────
• Simplified clean vector hair shapes
• Solid fills only
• NO gradients
• NO shading

────────────────────────
OUTLINES
────────────────────────
• Clear black contour outlines around all characters
• Crisp vector edges
• Professional clean illustration look

────────────────────────
BACKGROUND REMOVAL
────────────────────────
• Remove original photo background completely
• Replace with pure white #FFFFFF
• NO rectangle
• NO frame
• NO border around illustration
• Illustration floats directly on white background

────────────────────────
CENTER POSITIONING
────────────────────────
• Vector illustration centered at X = 960px
• Vertically centered
• Height ≈ 80–85% of canvas height
• Preserve original family proportions

────────────────────────
SPACING RULES
────────────────────────
Treat the center illustration as a rectangle block.

Maintain equal spacing between:
LEFT D ↔ CENTER illustration
CENTER illustration ↔ RIGHT D

Do NOT visually compensate based on where people stand.

────────────────────────
FINAL VISUAL STYLE
────────────────────────
Luxury minimalist sports-inspired family poster.

Visual structure:
[D]  [flat vector family illustration]  [D]

Pure white background.
Clean bold black outlines.
Minimal vector aesthetic.
Professional apparel graphic style.

────────────────────────
ABSOLUTE RESTRICTIONS
────────────────────────
• No text
• No gradients
• No shadows
• No glow
• No watercolor
• No realistic rendering
• No sketch style
• No painterly effects
• No background objects
• No decorative elements
• No double outlines on letters — letters have ONE stroke only
• No inner border or inner contour on any letter
• No inner shadow or inner decoration inside the letter D
• No frame around illustration
• No texture overlays

────────────────────────
IMPORTANT STYLE PRIORITY
────────────────────────
The center illustration MUST look like:
• custom vector apparel artwork
• clean embroidery-guide illustration
• modern personalized sweatshirt graphic
• flat simplified family portrait vector

NOT:
• realistic cartoon
• Disney style
• anime
• painterly illustration
• semi-realistic art`

export const PROMPTS = {
  'dad-face': [
    { label: 'DAD', prompt: DAD_FACE },
  ],
}
