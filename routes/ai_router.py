import os
from users.config import settings

BFL_API_KEY = settings.bfl_api_key
BFL_DEV_URL = "https://api.bfl.ai/v1/flux-dev"
# BFL_URL = "https://api.bfl.ai/v1/flux-2-pro-preview"
BFL_URL = "https://api.bfl.ai/v1/flux-2-klein-9b"


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