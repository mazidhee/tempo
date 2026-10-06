from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import sys

folder = Path(sys.argv[1]).resolve()
labels = [('a', 'A - Open canvas'), ('b', 'B - Reading page'), ('c', 'C - Quiet margin'), ('d', 'D - Familiar greeting'), ('e', 'E - One word')]
font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 23)
sheet = Image.new('RGB', (1860, 1170), '#101614')
draw = ImageDraw.Draw(sheet)
for index, (key, label) in enumerate(labels):
    image = Image.open(folder / f'thought-{key}-1440.png').convert('RGB')
    image = image.crop((210, 60, image.width, image.height))
    image.thumbnail((590, 520), Image.Resampling.LANCZOS)
    x, y = 20 + (index % 3) * 620, 20 + (index // 3) * 575
    draw.text((x, y), label, font=font, fill='#edf3ef')
    sheet.paste(image, (x, y + 42))
draw.text((1260, 710), 'Tempo Home options', font=font, fill='#edf3ef')
draw.text((1260, 750), 'Fictional design preview', font=font, fill='#aab9ae')
draw.text((1260, 790), 'Same thought; five layouts', font=font, fill='#aab9ae')
out = folder / 'home-options-contact.png'
sheet.save(out)
print(out)
