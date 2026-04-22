# import base64
# import requests
# from fastapi import APIRouter, UploadFile, File
# from pydantic import BaseModel

# import uuid
# import os


# router = APIRouter()

# FLUX_API_KEY = "<API_KEY>"
# FLUX_URL = "https://api.fluxapi.ai/api/v1/flux/kontext/generate"



# @router.post("/ai/upload")
# def upload(file: UploadFile = File(...)):
#     print("Received file:", file.filename)
#     filename = f"{uuid.uuid4()}.png"
#     path = f"static/ai_outputs/{filename}"

#     with open(path, "wb") as f:
#         f.write(file.file.read())

#     return {
#         "url": f"https://editra.pro/{path}"
#     }


# class GenerateRequest(BaseModel):
#     prompt: str


# @router.post("/ai/generate")
# def generate_image(data: GenerateRequest):
#     payload = {
#         "prompt": data.prompt,
#         "enableTranslation": True,
#         "aspectRatio": "1:1",
#         "outputFormat": "jpeg",
#         "promptUpsampling": False,
#         "model": "flux-kontext-pro",
#         "safetyTolerance": 2,
#         # "width": 1024,
#         # "height": 1024,
#         # "steps": 25
#     }

#     headers = {
#         "Authorization": f"Bearer {FLUX_API_KEY}",
#         "Content-Type": "application/json"
#     }

#     r = requests.post(FLUX_URL, json=payload, headers=headers)

#     if r.status_code != 200:
#         return {"error": r.text}

#     data = r.json()

#     return {
#         "taskId": data["data"]["taskId"]
#     }


# @router.get("/ai/result/{task_id}")
# def get_result(task_id: str):
#     res = requests.get(
#         f"https://api.fluxapi.ai/api/v1/flux/kontext/task/{task_id}",
#         headers={
#             "Authorization": f"Bearer {FLUX_API_KEY}"
#         }
#     )

#     data = res.json()

#     return data




# class EditRequest(BaseModel):
#     prompt: str
#     inputImage: str  # URL (NIE base64!)

# @router.post("/ai/edit")
# def edit_image(data: EditRequest):

#     payload = {
#         "prompt": data.prompt,
#         "inputImage": data.inputImage,  # 🔥 KLUCZOWE
#         "enableTranslation": True,
#         "aspectRatio": "1:1",
#         "outputFormat": "jpeg",
#         "model": "flux-kontext-pro",
#         "safetyTolerance": 2
#     }

#     headers = {
#         "Authorization": f"Bearer {FLUX_API_KEY}",
#         "Content-Type": "application/json"
#     }

#     r = requests.post(FLUX_URL, json=payload, headers=headers)

#     if r.status_code != 200:
#         return {"error": r.text}

#     result = r.json()

#     return {
#         "taskId": result["data"]["taskId"]  # 🔥 tak samo jak generate
#     }



import os
from users.config import settings

BFL_API_KEY = settings.bfl_api_key
BFL_DEV_URL = "https://api.bfl.ai/v1/flux-dev"
BFL_URL = "https://api.bfl.ai/v1/flux-2-pro-preview"


from fastapi import APIRouter
from pydantic import BaseModel
import requests

router = APIRouter()

class GenerateRequest(BaseModel):
    prompt: str


@router.post("/ai/generate")
def generate_image(data: GenerateRequest):

    print('Received AI generation request with prompt:', data.prompt)

    res = requests.post(
        BFL_URL,
        headers={
            "accept": "application/json",
            "x-key": BFL_API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "prompt": data.prompt,
            "width": 1024,
            "height": 1024
        }
    )

    if res.status_code != 200:
        return {"error": res.text}

    result = res.json()

    print('BFL generation result:**************', res)

    return {
        "id": result["id"],
        "polling_url": result["polling_url"]  # 🔥 KLUCZOWE
    }


# @router.post("/ai/result")
# def get_result(polling_url: str):

#     res = requests.get(
#         polling_url,
#         headers={
#             "accept": "application/json",
#             "x-key": BFL_API_KEY,
#         }
#     )

#     data = res.json()

#     return data


class PollRequest(BaseModel):
    polling_url: str

@router.post("/ai/result")
def get_result(data: PollRequest):
    res = requests.get(
        data.polling_url,
        headers={
            "accept": "application/json",
            "x-key": BFL_API_KEY,
        }
    )
    return res.json()





import base64
import requests
from pydantic import BaseModel

class EditRequest(BaseModel):
    prompt: str
    image: str  # base64 (bez "data:image/png;base64,")

@router.post("/ai/edit")
def edit_image(data: EditRequest):

    payload = {
        "prompt": data.prompt,
        "input_image": data.image  # 🔥 BFL wymaga base64
    }

    res = requests.post(
        "https://api.bfl.ai/v1/flux-kontext-pro",
        headers={
            "accept": "application/json",
            "x-key": BFL_API_KEY,
            "Content-Type": "application/json",
        },
        json=payload
    )

    if res.status_code != 200:
        return {"error": res.text}

    result = res.json()

    return {
        "id": result["id"],
        "polling_url": result["polling_url"]
    }