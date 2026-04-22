import base64
import requests
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel

import uuid
import os


router = APIRouter()

FLUX_API_KEY = "<API_KEY>"
FLUX_URL = "https://api.fluxapi.ai/api/v1/flux/kontext/generate"



@router.post("/ai/upload")
def upload(file: UploadFile = File(...)):
    print("Received file:", file.filename)
    filename = f"{uuid.uuid4()}.png"
    path = f"static/ai_outputs/{filename}"

    with open(path, "wb") as f:
        f.write(file.file.read())

    return {
        "url": f"https://editra.pro/{path}"
    }


class GenerateRequest(BaseModel):
    prompt: str


@router.post("/ai/generate")
def generate_image(data: GenerateRequest):
    payload = {
        "prompt": data.prompt,
        "enableTranslation": True,
        "aspectRatio": "1:1",
        "outputFormat": "jpeg",
        "promptUpsampling": False,
        "model": "flux-kontext-pro",
        "safetyTolerance": 2,
        # "width": 1024,
        # "height": 1024,
        # "steps": 25
    }

    headers = {
        "Authorization": f"Bearer {FLUX_API_KEY}",
        "Content-Type": "application/json"
    }

    r = requests.post(FLUX_URL, json=payload, headers=headers)

    if r.status_code != 200:
        return {"error": r.text}

    data = r.json()

    return {
        "taskId": data["data"]["taskId"]
    }


@router.get("/ai/result/{task_id}")
def get_result(task_id: str):
    res = requests.get(
        f"https://api.fluxapi.ai/api/v1/flux/kontext/task/{task_id}",
        headers={
            "Authorization": f"Bearer {FLUX_API_KEY}"
        }
    )

    data = res.json()

    return data




class EditRequest(BaseModel):
    prompt: str
    inputImage: str  # URL (NIE base64!)

@router.post("/ai/edit")
def edit_image(data: EditRequest):

    payload = {
        "prompt": data.prompt,
        "inputImage": data.inputImage,  # 🔥 KLUCZOWE
        "enableTranslation": True,
        "aspectRatio": "1:1",
        "outputFormat": "jpeg",
        "model": "flux-kontext-pro",
        "safetyTolerance": 2
    }

    headers = {
        "Authorization": f"Bearer {FLUX_API_KEY}",
        "Content-Type": "application/json"
    }

    r = requests.post(FLUX_URL, json=payload, headers=headers)

    if r.status_code != 200:
        return {"error": r.text}

    result = r.json()

    return {
        "taskId": result["data"]["taskId"]  # 🔥 tak samo jak generate
    }