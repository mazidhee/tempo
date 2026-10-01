import sys
from pathlib import Path
from PIL import Image, ImageDraw
directory=Path(sys.argv[1])
pages=['home','plan','habits','tasks','focus','study','statistics','goals','review','journal','settings']
for width in [1280,390]:
    for theme in ['dark','light']:
        for part, group in enumerate([pages[:6],pages[6:]],1):
            tile_w=640 if width==1280 else 390
            tile_h=360 if width==1280 else 720
            sheet=Image.new('RGB',(tile_w*3,(tile_h+26)*2),'#d4d4d4')
            draw=ImageDraw.Draw(sheet)
            for i,name in enumerate(group):
                capture=Image.open(directory/f'{name}-{theme}-{width}.png').convert('RGB')
                capture.thumbnail((tile_w,tile_h))
                x=(i%3)*tile_w;y=(i//3)*(tile_h+26)
                draw.text((x+8,y+4),f'{name} {theme} {width}',fill='#000000')
                sheet.paste(capture,(x,y+26))
            sheet.save(directory/f'contact-{theme}-{width}-{part}.jpg',quality=95)
