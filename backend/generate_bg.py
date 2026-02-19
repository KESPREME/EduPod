from PIL import Image, ImageDraw, ImageFont
import os
import random

def create_classroom_placeholder():
    # Create directory if not exists
    os.makedirs("assets", exist_ok=True)
    
    width = 1920
    height = 1080
    
    # Create distinctive background (warm beige/wood colors)
    img = Image.new('RGB', (width, height), color='#f5f0e6')
    draw = ImageDraw.Draw(img)
    
    # Draw "floor"
    draw.rectangle([(0, height - 300), (width, height)], fill='#c4a06a')
    
    # Draw "chalkboard"
    board_padding = 100
    draw.rectangle(
        [(board_padding, 100), (width - board_padding, height - 350)], 
        fill='#1a3a2a', 
        outline='#5c3a1e', 
        width=20
    )
    
    # Draw decorative text
    try:
        # Try to use a default font, otherwise skip text or use default
        font = ImageFont.load_default()
        # Scale is hard with default font, but let's try to draw some "chalk" lines
        draw.line([(board_padding + 50, 200), (width - board_padding - 50, 200)], fill='#ffffff', width=2)
        draw.line([(board_padding + 50, 250), (width - board_padding - 50, 250)], fill='#ffffff', width=2)
    except:
        pass

    # Save
    output_path = os.path.join("assets", "classroom_background.png")
    img.save(output_path)
    print(f"Generated placeholder at {output_path}")

if __name__ == "__main__":
    create_classroom_placeholder()
