"""Regenerates the app icon SVGs in this folder.

    python3 icons/make-icons.py icons

Colours are taken from style.css so the icon always matches the app. The PNGs
alongside are rasterised from these SVGs (180/192/512 + maskable 512, then
stripped of their alpha channel and re-deflated); if you change the artwork,
re-export them with any SVG rasteriser and keep the same filenames.
"""
import math, sys

# Palette lifted straight from style.css so the icon matches the app.
BG, BG_LIFT = "#0e1117", "#1a2230"
CREAM, DARK = "#e8edf4", "#222a37"
GREEN, GREEN_DK = "#2dd4a7", "#17a37d"
RED = "#e0455c"
WIRE = "#0e1117"
STEEL, STEEL_HI, STEEL_DK = "#9fadc0", "#dfe7f0", "#5d6a7d"

def polar(cx, cy, r, deg):
    a = math.radians(deg)
    return cx + r*math.cos(a), cy + r*math.sin(a)

def ring_sector(cx, cy, r_in, r_out, a0, a1):
    x0o,y0o = polar(cx,cy,r_out,a0); x1o,y1o = polar(cx,cy,r_out,a1)
    x1i,y1i = polar(cx,cy,r_in,a1);  x0i,y0i = polar(cx,cy,r_in,a0)
    lg = 1 if (a1-a0) % 360 > 180 else 0
    return (f"M{x0o:.2f},{y0o:.2f}A{r_out:.2f},{r_out:.2f} 0 {lg} 1 {x1o:.2f},{y1o:.2f}"
            f"L{x1i:.2f},{y1i:.2f}A{r_in:.2f},{r_in:.2f} 0 {lg} 0 {x0i:.2f},{y0i:.2f}Z")

def board(cx, cy, R, wedges=20, detail=True):
    r_dbl_o, r_dbl_i = R, R*0.906
    r_trb_o, r_trb_i = R*0.630, R*0.578
    r_bull_o, r_bull_i = R*0.168, R*0.076
    out, step = [], 360.0/wedges
    off = -90 - step/2
    for i in range(wedges):
        a0 = off+i*step
        out.append(f'<path d="{ring_sector(cx,cy,r_bull_o,r_dbl_o,a0,a0+step)}" '
                   f'fill="{CREAM if i%2==0 else DARK}"/>')
    for i in range(wedges):
        a0 = off+i*step; col = GREEN if i%2==0 else RED
        out.append(f'<path d="{ring_sector(cx,cy,r_dbl_i,r_dbl_o,a0,a0+step)}" fill="{col}"/>')
        if detail:
            out.append(f'<path d="{ring_sector(cx,cy,r_trb_i,r_trb_o,a0,a0+step)}" fill="{col}"/>')
    if detail:
        w = max(R*0.012, 1.0)
        for i in range(wedges):
            a = off+i*step
            x0,y0 = polar(cx,cy,r_bull_o,a); x1,y1 = polar(cx,cy,r_dbl_o,a)
            out.append(f'<line x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}" '
                       f'stroke="{WIRE}" stroke-width="{w:.2f}" stroke-opacity=".55"/>')
        for r in (r_trb_i, r_trb_o, r_dbl_i):
            out.append(f'<circle cx="{cx}" cy="{cy}" r="{r:.2f}" fill="none" stroke="{WIRE}" '
                       f'stroke-width="{w:.2f}" stroke-opacity=".55"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{r_bull_o:.2f}" fill="{GREEN}"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{r_bull_i:.2f}" fill="{RED}"/>')
    return "\n    ".join(out), r_dbl_o

def dart(cx, cy, R, ang=-34.0):
    """Dart struck in the bull. Drawn with a dark keyline so it stays legible
       where it crosses the busy board."""
    def P(t, perp=0.0):
        x,y = polar(cx,cy,t,ang)
        px,py = math.cos(math.radians(ang+90)), math.sin(math.radians(ang+90))
        return x+px*perp, y+py*perp
    T, B0, B1, S1, F0, F1 = 0.0, R*0.36, R*0.80, R*1.14, R*1.08, R*1.62
    o = []
    def seg(a, b, w, col, cap="round", op=1.0):
        x0,y0 = P(a); x1,y1 = P(b)
        o.append(f'<line x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}" stroke="{col}" '
                 f'stroke-width="{w:.2f}" stroke-linecap="{cap}" stroke-opacity="{op}"/>')
    kw = R*0.055  # keyline thickness
    # keyline (drawn first, slightly fatter than each part)
    seg(T,  B0, R*0.050+kw, BG)
    seg(B0, B1, R*0.150+kw, BG)
    seg(B1, S1, R*0.075+kw, BG)
    # point, barrel, shaft
    seg(T,  B0, R*0.050, STEEL)
    seg(B0, B1, R*0.150, STEEL)
    seg(B0, B1, R*0.055, STEEL_HI)          # barrel highlight
    seg(B1, S1, R*0.075, STEEL_DK)
    # flight: kite with a centre fold, keylined
    a = P(F0); b = P(F1); w = R*0.36
    u1 = P(F0+(F1-F0)*0.40,  w); u2 = P(F0+(F1-F0)*0.40, -w)
    kite = (f"M{a[0]:.2f},{a[1]:.2f} L{u1[0]:.2f},{u1[1]:.2f} L{b[0]:.2f},{b[1]:.2f} "
            f"L{u2[0]:.2f},{u2[1]:.2f} Z")
    o.append(f'<path d="{kite}" fill="{GREEN}" stroke="{BG}" stroke-width="{kw*1.6:.2f}" '
             f'stroke-linejoin="round"/>')
    o.append(f'<path d="M{a[0]:.2f},{a[1]:.2f} L{u2[0]:.2f},{u2[1]:.2f} L{b[0]:.2f},{b[1]:.2f} Z" '
             f'fill="{GREEN_DK}"/>')
    return "\n    ".join(o)

def bullseye(cx, cy, R):
    """Small-size mark: concentric rings read cleanly down to 16px."""
    bands = [(1.00, DARK), (0.82, CREAM), (0.62, GREEN), (0.40, CREAM), (0.24, RED)]
    o = [f'<circle cx="{cx}" cy="{cy}" r="{R*f:.2f}" fill="{c}"/>' for f, c in bands]
    # four wedge cuts so it still says "dartboard", not just "target"
    w = R*0.13
    for a in (0, 90, 180, 270):
        x0,y0 = polar(cx,cy,R*0.30,a); x1,y1 = polar(cx,cy,R*1.02,a)
        o.append(f'<line x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}" '
                 f'stroke="{BG}" stroke-width="{w:.2f}" stroke-linecap="butt"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{R*0.24:.2f}" fill="{RED}"/>')
    return "\n    ".join(o)

def build(path, *, size=512, radius_frac=0.335, wedges=20, detail=True, with_dart=True,
          rounded=True, mark="board", title="Darts TV Guide"):
    R, cx = size*radius_frac, size/2
    rx = size*0.234 if rounded else 0
    if mark == "bull":
        body = bullseye(cx, cx, R); surround = ""
    else:
        body, r_out = board(cx, cx, R, wedges, detail)
        surround = (f'<circle cx="{cx}" cy="{cx}" r="{r_out*1.075:.2f}" fill="#11161f" '
                    f'stroke="#2a3342" stroke-width="{size*0.008:.2f}"/>')
    d = dart(cx, cx, R) if (with_dart and mark != "bull") else ""
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}" role="img" aria-label="{title}">
  <title>{title}</title>
  <defs>
    <radialGradient id="g" cx="50%" cy="38%" r="78%">
      <stop offset="0" stop-color="{BG_LIFT}"/><stop offset="1" stop-color="{BG}"/>
    </radialGradient>
  </defs>
  <rect width="{size}" height="{size}" rx="{rx:.1f}" fill="url(#g)"/>
  <g>
    {surround}
    {body}
    {d}
  </g>
</svg>
'''
    open(path, "w").write(svg)

base = sys.argv[1]
build(f"{base}/icon.svg")
build(f"{base}/favicon.svg", mark="bull", radius_frac=0.40)
# iOS applies its own mask, so the apple-touch source is square and opaque.
build(f"{base}/icon-square.svg", rounded=False)
# Android maskable: no dart, board fills the 80% safe circle cleanly.
build(f"{base}/icon-maskable.svg", radius_frac=0.335, rounded=False, with_dart=False)
print("written")
