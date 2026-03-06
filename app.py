from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
import numpy as np
from hsl import apply_hsl_adjustment
import io, os, uuid, base64
import rawpy

app = FastAPI()

# Serve static files (CSS, JS, etc.)
# Mount static files at /static
app.mount("/static", StaticFiles(directory="static"), name="static")


UPLOAD_DIR = "uploads"
RESULT_DIR = "results"
# STATIC_DIR = "static"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

# Keep current image in memory as PIL Image (RGBA)
CURRENT_IMAGE = None

print("Static path:", os.path.abspath("static"))

@app.get("/")
async def index():
    """Serve the HTML with sliders."""
    with open("templates/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())



@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1].lower()
    supported = ["jpg", "jpeg", "png", "cr2", "webp", "gif", "bmp", "avif",
                 "nef", "arw", "raf", "dng", "orf", "rw2"]
    if ext not in supported:
        raise HTTPException(400, "Your file is not supported!")

    contents = await file.read()

    try:
        if ext in ["cr2", "nef", "arw", "raf", "dng", "orf", "rw2"]:
            # RAW decode using rawpy
            with rawpy.imread(io.BytesIO(contents)) as raw:
                rgb = raw.postprocess()
            img = Image.fromarray(rgb).convert("RGBA")
        else:
            # Standard image decode
            img = Image.open(io.BytesIO(contents)).convert("RGBA")
    except Exception as e:
        raise HTTPException(500, f"Failed to decode image: {str(e)}")

    # Save as PNG regardless of input format
    new_name = f"{uuid.uuid4()}.png"
    save_path = os.path.join(UPLOAD_DIR, new_name)
    img.save(save_path, format="PNG")

    # Encode to base64 for frontend (optional)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    base64_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
    data_url = f"data:image/png;base64,{base64_data}"

    return JSONResponse({
        "filename": file.filename,
        "converted": data_url
    })


@app.post("/adjust")
async def adjust_image(
    hue_shift: float = Form(...),
    sat_scale: float = Form(...),
    light_scale: float = Form(...)
):
    global CURRENT_IMAGE
    if CURRENT_IMAGE is None:
        raise HTTPException(400, "No image uploaded")

    arr = np.array(CURRENT_IMAGE)  # RGBA
    adjusted = apply_hsl_adjustment(
        arr, hue_shift=hue_shift, sat_scale=sat_scale, light_scale=light_scale
    )
    out = Image.fromarray(adjusted)
    out_path = os.path.join(RESULT_DIR, "result.png")
    out.save(out_path, format="PNG")
    return FileResponse(out_path, media_type="image/png", filename="result.png")
