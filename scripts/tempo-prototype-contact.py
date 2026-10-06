from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import sys

folder = Path(sys.argv[1]).resolve()
screens = ['tasks','plan','habits','history','recovery','work','focus','search','home','study','statistics','goals','journal','review','settings']
font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 22)
for screen in screens:
    sheet = Image.new('RGB', (1860, 1130), '#171b1d')
    draw = ImageDraw.Draw(sheet)
    for index in range(5):
        image = Image.open(folder / f'{screen}-{index}-1440.png').convert('RGB')
        image = image.crop((188, 154, 1440, 1000))
        image.thumbnail((590, 480), Image.Resampling.LANCZOS)
        x, y = 20 + (index % 3) * 620, 20 + (index // 3) * 555
        draw.text((x, y), f'{chr(65 + index)}  {screen.title()}', font=font, fill='#edf1f2')
        sheet.paste(image, (x, y + 42))
    draw.text((1260, 670), f'Tempo · {screen.title()}', font=font, fill='#edf1f2')
    draw.text((1260, 710), 'Five layout options', font=font, fill='#a9b5bb')
    draw.text((1260, 750), 'Fictional data · select in studio', font=font, fill='#a9b5bb')
    sheet.save(folder / f'{screen}-options.png')
print(folder)
