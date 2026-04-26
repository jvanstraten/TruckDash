# Dashboard design data

I can't even with normal HTML/CSS, SVG with Inkscape, or other such normal
workflows. So here's one with Blender instead.

The blend file contains a script that exports the contained data to SVG paths
and metadata to a JSON object exported by a typescript file. Note that the
script is very dumb:

 - It knows which blender object is supposed to be what based on its object
   name. Names must therefore be given carefully. The collection scructure
   is *not* used by the script and just there to organize things manually.
 - Only mesh and text data is supported. Curves, like those imported from
   Material Design Icons, have to be converted to mesh objects first. This
   also means that the resulting SVG paths are only interpolated line
   segments.
 - For meshes, each face becomes its own path. It's therefore probably quite
   important for performance to make as few faces as possible. Applying the
   decimate -> planar modifier helps here.
 - Scale must be applied to all objects; the script doesn't understand it.
   Likewise for rotation for anything other than needle objects, and for some
   objects even location must be applied.
 - Z values are ignored and are used only for layering things visually in
   the blender viewport.
 - Where color matters, the actual color data is ignored, and only material
   names are used. The final colors are set via CSS.
 - Probably lots of things I'm not thinking of now. Basically, here be dragons
   if you want to edit things.

The output data can be regenerated with the `generate.sh` script.
