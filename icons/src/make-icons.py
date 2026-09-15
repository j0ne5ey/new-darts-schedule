"""Regenerates the Darts TV Guide icon SVGs.

    python3 icons/src/make-icons.py icons/src

Modelled on Apple's direct-hit emoji: a target tilted in perspective with a
visible disc edge, and a teal dart with a three-vane flight, grooved barrel and
gold point, on the app's charcoal tile. The PNGs beside them are rasterised
from these SVGs, then alpha-stripped where opaque and re-deflated -- re-export
with any SVG rasteriser if you change the artwork, keeping the same filenames.

Crop budgets (checked when changing geometry): the flight reaches 1.79 x R from
centre, which must stay inside 40% of the canvas for maskable and 33.3% for the
Android adaptive foreground.
"""
"""Darts TV Guide icon — modelled on Apple's direct-hit emoji:
a target tilted in perspective with a visible disc edge, and a teal dart
with a three-vane flight, grooved barrel and gold point."""
import math, os, sys

BG_A, BG_B = "#272c36", "#13161d"
RED, RED_DK, RED_LT = "#c9352c", "#96251e", "#e2564a"
WHITE, WHITE_SH     = "#f4f1ee", "#d8d2cc"
TEAL, TEAL_DK, TEAL_LT = "#62c3d4", "#3b8ba1", "#a6e0ec"
GOLD, GOLD_DK       = "#e3ad33", "#b07f1c"

TILT   = -13.0   # board rotation
SQUASH = 0.78    # vertical foreshortening
ANG    = -37.0   # dart direction (screen space)

def defs(ident=""):
    return f'''<radialGradient id="bg{ident}" cx="50%" cy="36%" r="80%">
      <stop offset="0" stop-color="{BG_A}"/><stop offset="1" stop-color="{BG_B}"/></radialGradient>
    <linearGradient id="rim{ident}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{RED_DK}"/><stop offset="1" stop-color="#6d1a14"/></linearGradient>
    <radialGradient id="face{ident}" cx="36%" cy="28%" r="78%">
      <stop offset="0" stop-color="#fff" stop-opacity=".30"/>
      <stop offset="0.52" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".30"/></radialGradient>
    <linearGradient id="barrel{ident}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{TEAL_LT}"/><stop offset="0.45" stop-color="{TEAL}"/>
      <stop offset="1" stop-color="{TEAL_DK}"/></linearGradient>
    <linearGradient id="vaneA{ident}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{TEAL_LT}"/><stop offset="1" stop-color="{TEAL}"/></linearGradient>
    <linearGradient id="vaneB{ident}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{TEAL}"/><stop offset="1" stop-color="{TEAL_DK}"/></linearGradient>'''

def board(cx, cy, R, ident=""):
    """Target disc in perspective: side wall, then the ringed face."""
    depth = R*0.17
    bands = [(1.00, RED), (0.855, WHITE), (0.705, RED), (0.555, WHITE),
             (0.405, RED), (0.255, WHITE), (0.125, RED)]
    o = [f'<ellipse cx="{cx:.1f}" cy="{cy+R*0.92:.1f}" rx="{R*0.90:.1f}" ry="{R*0.15:.1f}" '
         f'fill="#000" opacity=".30"/>']
    o.append(f'<g transform="translate({cx:.2f},{cy:.2f}) rotate({TILT})">')
    # side wall of the disc
    o.append(f'  <ellipse cx="0" cy="{depth:.2f}" rx="{R:.2f}" ry="{R*SQUASH:.2f}" fill="url(#rim{ident})"/>')
    o.append(f'  <rect x="{-R:.2f}" y="0" width="{2*R:.2f}" height="{depth:.2f}" fill="url(#rim{ident})"/>')
    # face
    o.append(f'  <g transform="scale(1,{SQUASH})">')
    for i, (f, col) in enumerate(bands):
        o.append(f'    <circle cx="0" cy="0" r="{R*f:.2f}" fill="{col}"/>')
        if col is WHITE:  # faint inner shading so rings read as recessed
            o.append(f'    <circle cx="0" cy="0" r="{R*f:.2f}" fill="none" '
                     f'stroke="{WHITE_SH}" stroke-width="{R*0.012:.2f}" opacity=".6"/>')
    o.append(f'    <circle cx="0" cy="0" r="{R:.2f}" fill="url(#face{ident})"/>')
    o.append('  </g>')
    o.append('</g>')
    return "\n    ".join(o)

def dart(cx, cy, R, ident=""):
    """Teal dart struck in the bull: gold point, bulged grooved barrel and a
       three-vane flight with the vanes visibly separated, as on the emoji."""
    def P(t, perp=0.0, ang=ANG):
        x = cx + t*math.cos(math.radians(ang))
        y = cy + t*math.sin(math.radians(ang))
        px, py = math.cos(math.radians(ang+90)), math.sin(math.radians(ang+90))
        return x + px*perp, y + py*perp
    PT0, PT1 = R*0.02, R*0.42
    B0,  B1  = R*0.40, R*1.00
    S1       = R*1.30
    o = []

    def line(a, b, w, col, cap="round", op=1.0):
        (x0,y0),(x1,y1) = P(a), P(b)
        o.append(f'<line x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}" stroke="{col}" '
                 f'stroke-width="{w:.2f}" stroke-linecap="{cap}" stroke-opacity="{op}"/>')

    # ---- flight: compact swept-back fan, three vanes with visible edges ----
    V0, V1 = R*1.10, R*1.76
    L = V1 - V0
    def vane(tip_t, tip_p, back_t, fill):
        a  = P(V0)
        b  = P(tip_t, tip_p)
        c  = P(back_t)
        c1 = P(V0 + (tip_t-V0)*0.34, tip_p*0.78)
        c2 = P(back_t + (tip_t-back_t)*0.50, tip_p*0.92)
        o.append(f'<path d="M{a[0]:.2f},{a[1]:.2f} Q{c1[0]:.2f},{c1[1]:.2f} {b[0]:.2f},{b[1]:.2f} '
                 f'Q{c2[0]:.2f},{c2[1]:.2f} {c[0]:.2f},{c[1]:.2f} Z" fill="{fill}" '
                 f'stroke="{TEAL_DK}" stroke-width="{R*0.014:.2f}" stroke-linejoin="round"/>')
    vane(V0 + L*0.46,  R*0.44, V1,        f"url(#vaneB{ident})")  # upper vane, behind
    vane(V0 + L*0.30, -R*0.40, V1,        TEAL_DK)                # lower vane, shaded
    vane(V0 + L*0.60,  R*0.14, V1*1.015,  f"url(#vaneA{ident})")  # front vane, on top
    # crease where the front vane folds over the shaft
    (kx0,ky0),(kx1,ky1) = P(V0), P(V1)
    o.append(f'<line x1="{kx0:.2f}" y1="{ky0:.2f}" x2="{kx1:.2f}" y2="{ky1:.2f}" '
             f'stroke="{TEAL_DK}" stroke-width="{R*0.016:.2f}" stroke-opacity=".55"/>')

    # ---- stem ----
    line(B1, S1, R*0.062, TEAL_DK)

    # ---- barrel: bulged profile rather than a flat stroke ----
    prof = [(0.00,0.34),(0.18,0.80),(0.38,1.00),(0.62,0.98),(0.82,0.82),(1.00,0.52)]
    hw = R*0.088
    up   = [P(B0+(B1-B0)*f,  hw*k) for f, k in prof]
    down = [P(B0+(B1-B0)*f, -hw*k) for f, k in reversed(prof)]
    pts = " ".join(f"{x:.2f},{y:.2f}" for x, y in up + down)
    o.append(f'<polygon points="{pts}" fill="url(#barrel{ident})"/>')
    for g in (0.34, 0.50, 0.66):        # grooves
        (x0,y0),(x1,y1) = P(B0+(B1-B0)*g, hw*0.98), P(B0+(B1-B0)*g, -hw*0.98)
        o.append(f'<line x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}" '
                 f'stroke="{TEAL_DK}" stroke-width="{R*0.020:.2f}" stroke-opacity=".65"/>')
    # top highlight along the barrel
    (hx0,hy0),(hx1,hy1) = P(B0+(B1-B0)*0.18, hw*0.52), P(B0+(B1-B0)*0.80, hw*0.44)
    o.append(f'<line x1="{hx0:.2f}" y1="{hy0:.2f}" x2="{hx1:.2f}" y2="{hy1:.2f}" '
             f'stroke="{TEAL_LT}" stroke-width="{R*0.026:.2f}" stroke-linecap="round" stroke-opacity=".75"/>')

    # ---- gold point, last so it sits over the board ----
    line(PT0, PT1, R*0.048, GOLD_DK)
    line(PT0, PT1, R*0.028, GOLD)
    return "\n    ".join(o)

def build(path, *, size=512, R_frac=0.285, rounded=True, bg=True, bg_only=False,
          simple=False, ident="", title="Darts TV Guide"):
    cx = cy = size/2
    R = size*R_frac
    rx = size*0.2237 if rounded else 0
    ground = f'<rect width="{size}" height="{size}" rx="{rx:.1f}" fill="url(#bg{ident})"/>' if bg else ''
    if bg_only:
        body = ground
    elif simple:
        # tiny sizes: flat target only, no perspective or dart
        bands = [(1.00, RED), (0.80, WHITE), (0.60, RED), (0.38, WHITE), (0.18, RED)]
        rings = "".join(f'<circle cx="{cx}" cy="{cy}" r="{R*f:.2f}" fill="{c}"/>' for f, c in bands)
        body = ground + rings
    else:
        body = ground + "\n    " + board(cx, cy, R, ident) + "\n    " + dart(cx, cy, R, ident)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" '
           f'width="{size}" height="{size}" role="img" aria-label="{title}">\n'
           f'  <title>{title}</title>\n  <defs>{defs(ident)}</defs>\n  {body}\n</svg>\n')
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    open(path, "w").write(svg)

if __name__ == "__main__":
    out = sys.argv[1]
    build(f"{out}/icon.svg")
    build(f"{out}/icon-square.svg", rounded=False)
    build(f"{out}/favicon.svg", R_frac=0.42, simple=True)
    build(f"{out}/icon-maskable.svg", rounded=False, R_frac=0.195)
    build(f"{out}/android-foreground.svg", rounded=False, R_frac=0.160, bg=False)
    build(f"{out}/android-background.svg", rounded=False, bg_only=True)
    print("svgs written")
