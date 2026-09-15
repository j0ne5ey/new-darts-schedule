"""Generates the Darts TV Guide icon family.
Design baseline: red/white concentric bullseye, black dart struck in the bull,
dashed motion arcs, on a near-black rounded tile.
"""
import math, sys, os

BG_A, BG_B = "#272c36", "#13161d"      # charcoal tile, so a black dart reads
RED        = "#e12a32"
WHITE      = "#f2f5f9"
BLACK      = "#0b0d11"                  # dart body (true black vs the tile)
STEEL      = "#b7c0cc"                  # barrel
STEEL_DK   = "#78828f"
ARC        = "#8b95a3"
OUTLINE    = "#f2f5f9"                  # white keyline around the flight

def polar(cx, cy, r, deg):
    a = math.radians(deg)
    return cx + r*math.cos(a), cy + r*math.sin(a)

def arc_path(cx, cy, r, a0, a1):
    x0, y0 = polar(cx, cy, r, a0)
    x1, y1 = polar(cx, cy, r, a1)
    large = 1 if (a1 - a0) % 360 > 180 else 0
    return f"M{x0:.2f},{y0:.2f}A{r:.2f},{r:.2f} 0 {large} 1 {x1:.2f},{y1:.2f}"

def target(cx, cy, R, shadow=True):
    o = []
    if shadow:
        o.append(f'<ellipse cx="{cx:.1f}" cy="{cy+R*0.98:.1f}" rx="{R*0.74:.1f}" '
                 f'ry="{R*0.13:.1f}" fill="#000" opacity=".28"/>')
    bands = [(1.00, RED), (0.80, WHITE), (0.62, RED), (0.42, WHITE), (0.22, RED)]
    for f, col in bands:
        o.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{R*f:.2f}" fill="{col}"/>')
    # soft top-left sheen, keeps it from looking flat at large sizes
    o.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{R:.2f}" fill="url(#sheen)"/>')
    return "\n    ".join(o)

def arcs(cx, cy, R):
    w = R*0.055
    dash = f'stroke-dasharray="{R*0.17:.1f} {R*0.15:.1f}" stroke-linecap="round"'
    o = [f'<path d="{arc_path(cx,cy,R*1.20,118,262)}" fill="none" stroke="{ARC}" '
         f'stroke-width="{w:.2f}" {dash} opacity=".85"/>',
         f'<path d="{arc_path(cx,cy,R*1.20,292,340)}" fill="none" stroke="{ARC}" '
         f'stroke-width="{w:.2f}" {dash} opacity=".55"/>']
    return "\n    ".join(o)

def dart(cx, cy, R, ang=-45.0, reach=1.95):
    """Dart struck in the bull. Standard-flight silhouette: flares from the
       shaft then runs straight back, so it stays a solid shape at 60px."""
    def P(t, perp=0.0):
        x, y = polar(cx, cy, t, ang)
        px, py = math.cos(math.radians(ang+90)), math.sin(math.radians(ang+90))
        return x + px*perp, y + py*perp
    def pt(t, p=0.0):
        x, y = P(t, p); return f"{x:.2f},{y:.2f}"
    TIP, B0, B1, S1 = 0.0, R*0.26, R*0.66, R*0.99
    F0, F1 = R*0.88, R*reach
    L = F1 - F0
    o = []
    def seg(a, b, w, col, cap="round"):
        (x0, y0), (x1, y1) = P(a), P(b)
        o.append(f'<line x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}" '
                 f'stroke="{col}" stroke-width="{w:.2f}" stroke-linecap="{cap}"/>')
    seg(TIP, B0, R*0.060, STEEL_DK)                  # point
    seg(B0,  B1, R*0.165, STEEL)                     # barrel
    seg(B0,  B1, R*0.055, "#e9eef4")                 # barrel highlight
    seg(B1,  S1, R*0.090, BLACK)                     # shaft

    w = R*0.34
    d = (f"M{pt(F0)} L{pt(F0+L*0.30, w)} L{pt(F1-L*0.06, w*0.96)} "
         f"L{pt(F1, w*0.70)} L{pt(F1,-w*0.70)} L{pt(F1-L*0.06,-w*0.96)} "
         f"L{pt(F0+L*0.30,-w)} Z")
    o.append(f'<path d="{d}" fill="{BLACK}" stroke="{OUTLINE}" '
             f'stroke-width="{R*0.044:.2f}" stroke-linejoin="round"/>')
    o.append(f'<line x1="{P(F0)[0]:.2f}" y1="{P(F0)[1]:.2f}" '
             f'x2="{P(F1)[0]:.2f}" y2="{P(F1)[1]:.2f}" '
             f'stroke="{OUTLINE}" stroke-width="{R*0.022:.2f}" opacity=".45"/>')
    return "\n    ".join(o)

def build(path, *, size=512, R_frac=0.300, rounded=True, with_dart=True, with_arcs=True,
          bg=True, reach=1.95, bg_only=False, title="Darts TV Guide"):
    cx = cy = size/2
    R = size*R_frac
    rx = size*0.2237 if rounded else 0
    defs = (f'<radialGradient id="bgg" cx="50%" cy="36%" r="80%">'
            f'<stop offset="0" stop-color="{BG_A}"/><stop offset="1" stop-color="{BG_B}"/></radialGradient>'
            f'<radialGradient id="sheen" cx="34%" cy="28%" r="72%">'
            f'<stop offset="0" stop-color="#fff" stop-opacity=".22"/>'
            f'<stop offset="0.55" stop-color="#fff" stop-opacity="0"/>'
            f'<stop offset="1" stop-color="#000" stop-opacity=".16"/></radialGradient>')
    ground = (f'<rect width="{size}" height="{size}" rx="{rx:.1f}" fill="url(#bgg)"/>'
              if bg else '')
    parts = [ground]
    if not bg_only:
        if with_arcs: parts.append(arcs(cx, cy, R))
        parts.append(target(cx, cy, R))
        if with_dart: parts.append(dart(cx, cy, R, reach=reach))
    body = "\n    ".join(p for p in parts if p)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" '
           f'width="{size}" height="{size}" role="img" aria-label="{title}">\n'
           f'  <title>{title}</title>\n  <defs>{defs}</defs>\n  {body}\n</svg>\n')
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    open(path, "w").write(svg)

base = sys.argv[1]
# Web + shared masters
build(f"{base}/icon.svg")                                                   # rounded tile
build(f"{base}/icon-square.svg", rounded=False)                             # iOS masks its own
build(f"{base}/favicon.svg", R_frac=0.42, with_dart=False, with_arcs=False) # legible at 16px
# Web maskable: everything inside the 80% safe circle (radius 0.40*size)
build(f"{base}/icon-maskable.svg", rounded=False, R_frac=0.200, with_arcs=False)
# Android adaptive foreground: art inside the 66.7% safe area, transparent ground
build(f"{base}/android-foreground.svg", rounded=False, R_frac=0.165,
      with_arcs=False, bg=False)
build(f"{base}/android-background.svg", rounded=False, bg_only=True)
print("svgs written")
