const CHILDREN_DRAWING = `EXACT CHILDREN'S DRAWING VECTOR TRACE

MISSION CRITICAL

Transform the uploaded children's drawing into a clean SVG-quality vector image while preserving the original artwork with maximum possible accuracy.

THIS IS NOT AN ILLUSTRATION TASK.

THIS IS NOT A REDESIGN TASK.

THIS IS NOT A BEAUTIFICATION TASK.

THIS IS NOT A MODERNIZATION TASK.

THIS IS NOT AN ENHANCEMENT TASK.

THIS IS A STRICT VECTOR TRACING TASK.

Act as a professional vector artist manually tracing the original drawing line-by-line and color-by-color.

The uploaded drawing is the ONLY source of truth.

No creative interpretation is allowed.

HIGHEST PRIORITY RULE

The final artwork must look like the exact same drawing created by the child.

The objective is not to improve the drawing.

The objective is to preserve the drawing.

Every visible artistic decision made by the child must remain intact.

If something looks imperfect, preserve the imperfection.

If something looks asymmetrical, preserve the asymmetry.

If something looks unfinished, preserve the unfinished appearance.

If something looks awkward, preserve the awkwardness.

Do not improve anything.

Do not fix anything.

Do not beautify anything.

Do not optimize anything.

CANVAS

1920 x 1080 px

Landscape orientation

Background: Pure White (#FFFFFF)

No shadows

No gradients

No texture

No decorative elements

No borders

No frames

Center the complete artwork.

Maintain original composition.

Artwork occupies approximately 80-85% of canvas height.

STRICT COMPOSITION PRESERVATION

Preserve exactly:

* Position of all objects
* Position of all characters
* Relative scale
* Relative spacing
* Relative proportions
* Orientation
* Visual balance
* Empty spaces

Do not move any object.

Do not rearrange anything.

Do not resize selected objects independently.

Do not crop any part of the drawing.

STRICT LINE TRACING MODE

Trace every visible line.

Trace every visible contour.

Trace every visible scribble.

Trace every visible mark intentionally made by the child.

Preserve:

* Line placement
* Line direction
* Line curvature
* Line irregularity
* Line character
* Hand-drawn appearance

Only remove:

* Camera artifacts
* Compression artifacts
* Scanning artifacts

Do not redraw.

Do not reinterpret.

Do not replace with cleaner professional linework.

FACIAL FEATURES LOCK

Preserve exactly:

* Eye shape
* Eye placement
* Pupil placement
* Eyebrows
* Eyelashes
* Nose shape
* Nose placement
* Mouth shape
* Smile shape
* Teeth
* Ears
* Facial proportions
* Facial asymmetry
* Character expression

Do not enhance faces.

Do not beautify faces.

Do not add missing facial details.

Do not remove facial details.

COLOR SAMPLING MODE — HIGHEST PRIORITY

Color accuracy is more important than visual attractiveness.

Extract colors directly from the uploaded drawing.

Match colors as closely as possible.

Preserve:

* Original hue
* Original saturation
* Original brightness
* Original marker colors
* Original crayon colors
* Original paint colors
* Original pencil colors

Preserve uneven coloring.

Preserve color inconsistencies.

Preserve overlapping marker strokes.

Preserve lighter areas.

Preserve darker areas.

Preserve accidental marker density variations.

Preserve visible color imperfections.

Do not recolor.

Do not harmonize colors.

Do not improve colors.

Do not increase saturation.

Do not increase contrast.

Do not color-correct.

Do not white-balance.

Do not normalize colors.

Do not substitute colors with visually similar colors.

Use colors sampled from the original artwork.

DETAIL INVENTION PROHIBITION

Absolutely do not add:

* Extra eyes
* Extra eyelashes
* Extra eyebrows
* Extra fingers
* Extra toes
* Extra hair strands
* Extra clothing details
* Extra decorations
* Extra symbols
* Extra outlines
* Extra contours
* Extra textures
* Extra highlights
* Extra shadows
* Extra patterns
* Extra accessories
* Extra color transitions

Only elements explicitly visible in the original drawing may appear in the final artwork.

Any detail not visible in the source image is prohibited.

HANDWRITING PRESERVATION

Preserve all handwritten text exactly as drawn.

Maintain:

* Letter shapes
* Child handwriting style
* Placement
* Orientation
* Spacing
* Uneven lettering
* Misspellings

Do not replace handwriting with fonts.

Do not redesign lettering.

Do not correct spelling.

BACKGROUND CLEANUP

Remove completely:

* Notebook lines
* Paper texture
* Fold marks
* Wrinkles
* Creases
* Stains
* Shadows
* Dust
* Scanning artifacts
* Camera artifacts

Replace with: Pure White Background (#FFFFFF). Nothing else.

VECTORIZATION RULES

Create:

* Clean vector paths
* Smooth scalable curves
* SVG-quality artwork
* Print-ready vector quality

However: Vector quality must never alter the appearance of the drawing. Vectorization must behave like tracing. Not illustration. Not enhancement. Not redesign.

ABSOLUTE RESTRICTIONS

Do NOT:

* Redesign
* Stylize
* Modernize
* Beautify
* Enhance
* Improve
* Interpret
* Correct proportions
* Correct anatomy
* Correct perspective
* Correct symmetry
* Correct facial features
* Correct handwriting
* Add realism
* Add shadows
* Add gradients
* Add highlights
* Add textures
* Add decorative elements
* Add new objects
* Remove intentional objects

If a detail exists in the drawing, preserve it.

If a detail does not exist in the drawing, do not create it.

FINAL QUALITY TARGET

The final image must appear as if a professional vector artist manually traced every visible line and every visible color from the original children's drawing without making a single creative decision.

The result must preserve:

* Same composition
* Same proportions
* Same expressions
* Same handwriting
* Same colors
* Same imperfections
* Same personality
* Same artistic decisions

The output should be visually indistinguishable from the original drawing except that the paper background, notebook lines, folds, shadows and scan artifacts have been removed and the artwork has been converted into clean vector format.`

export const CHILDREN_PROMPT = {
  'children-drawing': [
    { label: 'Дитячий малюнок', prompt: CHILDREN_DRAWING },
  ],
}
