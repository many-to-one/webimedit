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
    width: int = 1024
    height: int = 1024
    aspect_ratio: str = "1:1"


@router.post("/ai/generate")
def generate_image(data: GenerateRequest):

    print('Received AI generation request:*************', data)

    res = requests.post(
        BFL_URL,
        headers={
            "accept": "application/json",
            "x-key": BFL_API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "prompt": data.prompt,
            "width": data.width if hasattr(data, 'width') else 1024,
            "height": data.height if hasattr(data, 'height') else 1024,
            "aspect_ratio": data.aspect_ratio if hasattr(data, 'aspect_ratio') else "1:1",
            "batch_size": 1,
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



from fastapi.responses import StreamingResponse

@router.get("/ai/image")
def proxy_image(url: str):
    try:
        res = requests.get(url, stream=True, timeout=10)
        res.raise_for_status()
    except Exception as e:
        print("Proxy error:", e)
        return Response(status_code=500)

    return StreamingResponse(
        res.raw,
        media_type=res.headers.get("Content-Type", "image/jpeg")
    )


class PollRequest(BaseModel):
    polling_url: str

@router.post("/ai/result")
def get_result(data: PollRequest):
    try:
        res = requests.get(
            data.polling_url,
            headers={
                "accept": "application/json",
                "x-key": BFL_API_KEY,
            },
            timeout=10
        )
        res.raise_for_status()
    except Exception as e:
        return {"status": "Error", "error": str(e)}

    return res.json()





import base64
import requests
from pydantic import BaseModel

class EditRequest(BaseModel):
    prompt: str
    width: int = 1024
    height: int = 1024
    aspect_ratio: str = "1:1"
    # image: str  # base64 (bez "data:image/png;base64,")
    images: list[str]  # 🔥 lista base64

# @router.post("/ai/edit")
# def edit_image(data: EditRequest):

#     payload = {
#         "prompt": data.prompt,
#         "width": 1024,
#         "height": 1024,
#         "aspect_ratio": "1:1",
#         "batch_size": 1,
#         "input_image": data.image  # 🔥 BFL wymaga base64
#     }

#     res = requests.post(
#         BFL_URL,
#         headers={
#             "accept": "application/json",
#             "x-key": BFL_API_KEY,
#             "Content-Type": "application/json",
#         },
#         json=payload
#     )

#     if res.status_code != 200:
#         return {"error": res.text}

#     result = res.json()

#     return {
#         "id": result["id"],
#         "polling_url": result["polling_url"]
#     }


@router.post("/ai/edit")
def edit_image(data: EditRequest):

    payload = {
        "prompt": data.prompt,
        "width": data.width,
        "height": data.height,
        "aspect_ratio": data.aspect_ratio,
        "batch_size": 1,
    }

    # 🔥 dynamiczne dodanie obrazów
    for i, img in enumerate(data.images):
        if i == 0:
            payload["input_image"] = img
        else:
            payload[f"input_image_{i+1}"] = img

    print("Edit payload***********:", payload["prompt"], payload["width"], payload["height"], payload["aspect_ratio"], len(data.images))

    res = requests.post(
        BFL_URL,
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
    print('BFL edit result:**************', result)

    return {
        "id": result["id"],
        "polling_url": result["polling_url"]
    }