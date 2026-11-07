"""Render the orbit mark to PNG and ICO. Editable masters live in static/*.svg."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / 'static'
DOC = ROOT / 'doc' / 'image' / 'logo'
SCALE = 16
SIZE = 200 * SCALE


def cubic(a, b, c, d, steps=60):
    points = []
    for i in range(steps + 1):
        t = i / steps
        x = (1-t)**3*a[0] + 3*(1-t)**2*t*b[0] + 3*(1-t)*t*t*c[0] + t**3*d[0]
        y = (1-t)**3*a[1] + 3*(1-t)**2*t*b[1] + 3*(1-t)*t*t*c[1] + t**3*d[1]
        points.append((round(x*SCALE), round(y*SCALE)))
    return points


def render(app=False, opaque=False, layers=('orbit', 'core', 'star')):
    image = Image.new('RGBA', (SIZE, SIZE), '#171527' if opaque else (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    if app and not opaque:
        draw.rounded_rectangle((0, 0, SIZE-1, SIZE-1), radius=44*SCALE, fill='#171527')
    orbit, core, star = ('#45d9e5', '#8c75e5', '#5ce3ae') if app else ('#29c7d7', '#7158c5', '#32c893')
    points = (cubic((41,115), (18,100), (52,65), (94,51)) +
              cubic((94,51), (136,37), (172,41), (171,61)) +
              cubic((171,61), (170,72), (158,83), (140,93)))
    if 'orbit' in layers:
        draw.line(points, fill=orbit, width=11*SCALE, joint='curve')
        for x, y in [(41, 115), (140, 93)]:
            draw.ellipse(((x-5.5)*SCALE, (y-5.5)*SCALE, (x+5.5)*SCALE, (y+5.5)*SCALE), fill=orbit)
    if 'core' in layers:
        draw.ellipse((57*SCALE, 57*SCALE, 143*SCALE, 143*SCALE), fill=core)
    if 'star' in layers:
        draw.polygon([(x*SCALE,y*SCALE) for x,y in [(153,102),(159,113),(171,116),(159,119),(153,130),(150,119),(139,116),(150,113)]], fill=star)
    return image.resize((1024, 1024), Image.Resampling.LANCZOS)


def main():
    transparent, app, apple = render(), render(app=True), render(app=True, opaque=True)
    for image, name in [(transparent, 'logo_transparent_bg'), (app, 'logo_roundedrectangle_bg')]:
        image.save(STATIC / f'{name}.png')
        image.save(STATIC / f'{name}.ico', sizes=[(16,16), (24,24), (32,32), (48,48), (64,64), (128,128), (256,256)])
        image.save(DOC / f'{name}.png')
    for size in (192, 512):
        app.resize((size, size), Image.Resampling.LANCZOS).save(STATIC / f'icon-{size}.png')
    for layer, name in [('orbit', 'orbit'), ('core', 'planet'), ('star', 'star')]:
        render(layers=(layer,)).resize((288, 288), Image.Resampling.LANCZOS).save(STATIC / f'loading-logo-{name}.png')
    apple.resize((180, 180), Image.Resampling.LANCZOS).convert('RGB').save(STATIC / 'apple-touch-icon.png')


if __name__ == '__main__':
    main()
