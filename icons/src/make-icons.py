"""Darts TV Guide app icon — 'Bold' design.
Red tile, white concentric rings, dark dart striking the bull. Flat and
high-contrast so it stays legible down to 16px.
"""
import math, os, sys

RED     = "#e03b42"      # tile
RED_D   = "#b3262c"      # ring gaps / depth
WHITE   = "#ffffff"
NAVY    = "#161b24"      # dart
SHADOW  = "#8f1f25"

ANG   = -42.0            # dart direction
BANDS = [(1.00, WHITE), (0.74, RED), (0.50, WHITE), (0.26, RED), (0.13, WHITE)]

def rings(cx, cy, R, bands=BANDS):
    return "".join(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{R*f:.2f}" fill="{c}"/>'
                   for f, c in bands)

def dart(cx, cy, R, scale=1.0):
    def P(t, perp=0.0):
        x = cx + t*math.cos(math.radians(ANG)); y = cy + t*math.sin(math.radians(ANG))
        px, py = math.cos(math.radians(ANG+90)), math.sin(math.radians(ANG+90))
        return x + px*perp, y + py*perp
    def s(t, p=0.0):
        x, y = P(t, p); return f"{x:.2f},{y:.2f}"
    T, B0, B1 = R*0.04*scale, R*0.30*scale, R*0.92*scale
    F0, F1    = R*0.88*scale, R*1.62*scale
    w, bw     = R*0.30*scale, R*0.088*scale
    flight = f'<polygon points="{s(F0)} {s(F1, w)} {s(F1*0.985,0)} {s(F1,-w)}"'
    barrel = f'<polygon points="{s(B0, bw*0.55)} {s(B1, bw)} {s(B1,-bw)} {s(B0,-bw*0.55)}"'
    point  = (f'<line x1="{P(T)[0]:.2f}" y1="{P(T)[1]:.2f}" x2="{P(B0)[0]:.2f}" y2="{P(B0)[1]:.2f}" '
              f'stroke-width="{R*0.035*scale:.2f}" stroke-linecap="round"')
    return (f'<g transform="translate({R*0.045:.1f},{R*0.055:.1f})" opacity=".30">'
            f'{flight} fill="{SHADOW}"/>{barrel} fill="{SHADOW}"/></g>'
            f'{point} stroke="{NAVY}"/>{barrel} fill="{NAVY}"/>{flight} fill="{NAVY}"/>')

def build(path, *, size=512, R_frac=0.290, rounded=True, bg=True,
          bg_only=False, simple=False, with_dart=True, title="Darts TV Guide"):
    cx = size/2
    R  = size*R_frac
    rx = size*0.2237 if rounded else 0
    ground = f'<rect width="{size}" height="{size}" rx="{rx:.1f}" fill="{RED}"/>' if bg else ''
    if bg_only:
        body = ground
    elif simple:                      # 16-32px: fewer, fatter rings, no dart
        body = ground + rings(cx, cx, R, [(1.00,WHITE),(0.66,RED),(0.34,WHITE),(0.16,RED)])
    else:
        body = ground + rings(cx, cx, R) + (dart(cx, cx, R) if with_dart else '')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" '
           f'height="{size}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n')
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    open(path, "w").write(svg)

if __name__ == "__main__":
    out = sys.argv[1]
    build(f"{out}/icon.svg")
    build(f"{out}/icon-square.svg", rounded=False)
    build(f"{out}/favicon.svg", R_frac=0.44, simple=True)
    # maskable: flight reaches 1.62*R, must stay inside 40% of canvas
    build(f"{out}/icon-maskable.svg", rounded=False, R_frac=0.215)
    # adaptive foreground: inside 33.3%, transparent ground
    build(f"{out}/android-foreground.svg", rounded=False, R_frac=0.178, bg=False)
    build(f"{out}/android-background.svg", rounded=False, bg_only=True)
    print("svgs written")
