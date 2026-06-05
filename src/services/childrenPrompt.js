const CHILDREN_DRAWING = `PREMIUM CHILDREN'S DRAWING EXACT VECTOR RECREATION

TASK

Transform the uploaded children's drawing into a premium high-quality flat vector illustration while preserving the original artwork with maximum accuracy.

The objective is to create a professional SVG/vector version of the drawing that looks as close as possible to the original artwork created by the child.

This is NOT a redesign, reinterpretation, modernization, enhancement, stylization, or simplification task.

The final artwork must preserve the exact appearance, personality, and creative decisions of the original drawing while converting it into clean, scalable vector artwork suitable for:

* Apparel printing
* Embroidery-ready artwork
* Cricut SVG designs
* Stickers
* Posters
* Canvas prints
* Nursery wall art
* Personalized gifts
* Merchandise
* Digital artwork

CANVAS SPECIFICATIONS

* Size: 1920x1080 px
* Landscape orientation
* Background: pure white (#FFFFFF)
* No texture
* No gradients
* No shadows
* No decorative elements
* No borders
* No frames

LAYOUT — COMPOSITION PRESERVATION

Preserve the original composition exactly as shown in the uploaded drawing.

Maintain:
* Original placement of all elements
* Original spacing
* Original proportions
* Original scale relationships
* Original orientation
* Original visual balance

Do not rearrange any objects.
Do not reposition characters.
Do not crop artwork.

Center the complete illustration on the canvas while maintaining the original composition.
The artwork should occupy approximately 80-85% of the canvas height.

EXACT ARTWORK PRESERVATION — ABSOLUTE PRIORITY

Preserve every intentional element visible in the original drawing.

Maintain exactly:
* Characters
* Animals
* Faces
* Eyes
* Pupils
* Eyebrows
* Eyelashes
* Noses
* Mouths
* Teeth
* Ears
* Hair
* Clothing
* Hands
* Feet
* Wings
* Hearts
* Symbols
* Accessories
* Decorations
* Shapes
* Patterns
* Scribbles
* Hand-drawn marks
* Handwritten text
* Color placement
* Character expressions

The final vector illustration should look like the same drawing recreated professionally.

FACIAL FEATURES — PRESERVE EXACTLY

Maintain all facial details exactly as drawn.

Preserve:
* Eye shape
* Eye size
* Eye placement
* Pupil placement
* Eyebrows
* Eyelashes
* Nose shape
* Nose position
* Mouth shape
* Smile shape
* Teeth
* Facial expressions
* Cheek markings
* Character personality

Do not remove facial features.
Do not simplify faces.
Do not convert characters into faceless illustrations.
Do not reinterpret expressions.

LINEWORK PRESERVATION

Preserve the original line structure exactly.

Maintain:
* Original contours
* Original line placement
* Original drawing style
* Original hand-drawn character

Only improve:
* Jagged scanning artifacts
* Broken contour gaps
* Accidental image distortions

Do not redraw in another style.
Do not replace hand-drawn character with modern vector aesthetics.
Do not over-clean the artwork.

The child's unique drawing style must remain visible.

COLOR PRESERVATION

Match the original colors as accurately as possible.

Preserve:
* Marker colors
* Crayon colors
* Paint colors
* Neon colors
* Mixed colors
* Color intensity
* Color placement

Do not recolor.
Do not replace colors.
Do not harmonize colors.
Do not apply modern color grading.
Do not alter the child's original palette.

TEXT PRESERVATION

Preserve all handwritten text exactly as shown.

Maintain:
* Letter shapes
* Spacing
* Orientation
* Placement
* Handwriting style
* Misspellings
* Child-created typography

Do not replace handwritten text with fonts.
Do not correct spelling.
Do not redesign lettering.

VECTORIZATION STYLE

Convert the drawing into professional vector artwork.

Requirements:
* Clean vector paths
* Smooth scalable curves
* Crisp edges
* SVG-quality artwork
* High-resolution output
* Print-ready quality

The vectorization must remain visually faithful to the original drawing.

CLEANUP RULES

Remove only:
* Paper texture
* Notebook lines
* Fold marks
* Scanning shadows
* Camera shadows
* Wrinkles
* Background stains
* Dust
* Image artifacts

Preserve all intentional drawing elements.
When uncertain, preserve the element rather than remove it.

BACKGROUND REMOVAL

Remove completely:
* Paper background
* Notebook lines
* Page folds
* Shadows
* Creases
* Surface texture

Replace with: Pure white background (#FFFFFF). No additional elements.

ABSOLUTE RESTRICTIONS

Do not:
* Redesign characters
* Stylize characters
* Modernize artwork
* Simplify details
* Remove facial features
* Change expressions
* Change proportions
* Change colors
* Add realism
* Add gradients
* Add shadows
* Add highlights
* Add texture
* Add 3D effects
* Add decorative elements
* Add new objects
* Remove intentional objects
* Correct artistic imperfections
* Replace handwriting with fonts

QUALITY TARGET

The final result must appear as:

An exact premium vector recreation of the original children's drawing, preserving every visible artistic decision, every facial feature, every expression, every color, every handwritten element, every shape, every symbol, and every detail while removing only the paper background and scan artifacts.

The artwork should look as if the original drawing was recreated perfectly by a professional vector illustrator while remaining completely faithful to the child's original creation.`

export const CHILDREN_PROMPT = {
  'children-drawing': [
    { label: 'Дитячий малюнок', prompt: CHILDREN_DRAWING },
  ],
}
