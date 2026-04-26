const aiPromptInput = document.getElementById("aiPrompt");
const aiGenerateBtn = document.getElementById("aiGenerate");
const aiStatus = document.getElementById("aiStatus");

const aiAspect = document.getElementById("aiAspect");
const aiWidth = document.getElementById("aiWidth");
const aiHeight = document.getElementById("aiHeight");

const aspectMap = {
    "1:1": [1024, 1024],
    "16:9": [1344, 768],
    "9:16": [768, 1344],
    "4:3": [1152, 864],
    "3:2": [1216, 832],
};

aiAspect.addEventListener("change", () => {
    const val = aiAspect.value;

    if (val === "custom") return;

    const [w, h] = aspectMap[val];
    aiWidth.value = w;
    aiHeight.value = h;
});

// aiGenerateBtn.onclick = async () => {
//     const prompt = aiPromptInput.value.trim();
//     if (!prompt) return;

//     aiGenerateBtn.disabled = true;
//     aiGenerateBtn.textContent = "Generating...";
//     aiStatus.textContent = "Generating...";

//     if (aiGenerateBtn.disabled) return;

//     try {
//         // 🔥 NAJPIERW GENERATE
//         const res = await fetch("/ai/generate", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({ prompt })
//         });

//         const data = await res.json();

//         if (data.error) {
//             console.error(data.error);
//             aiStatus.textContent = "Error";
//             return;
//         }

//         if (!data.polling_url) {
//             throw new Error("No polling_url returned");
//         }

//         // 🔥 DOPIERO TERAZ polling
//         pollResult(data.polling_url);

//     } catch (err) {
//         console.error(err);
//         aiStatus.textContent = "Error";
//     }
// };


aiGenerateBtn.onclick = async () => {
    const prompt = aiPromptInput.value.trim();
    if (!prompt) return;

    const width = parseInt(aiWidth.value) || 1024;
    const height = parseInt(aiHeight.value) || 1024;
    const aspect_ratio = aiAspect.value || "1:1";

    aiGenerateBtn.disabled = true;
    aiStatus.textContent = "Generating...";

    const res = await fetch("/ai/generate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            prompt,
            width,
            height,
            aspect_ratio
        })
    });

    const { polling_url } = await res.json();
    pollResult(polling_url);
};


async function pollResult(pollingUrl) {
    let tries = 0;

    while (tries < 100) {
        await new Promise(r => setTimeout(r, 1000));
        tries++;

        const res = await fetch("/ai/result", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ polling_url: pollingUrl })
        });

        const data = await res.json();

        if (data.error) {
            console.error(data.error);
            aiStatus.textContent = "Error";
            return;
        }

        console.log("BFL STATUS:", data); // 🔥 DEBUG

        const status = data.status;

        if (status === "Ready") {
            const imageUrl = `/ai/image?url=${encodeURIComponent(data.result.sample)}`;

            addAIImageFromURL(imageUrl);

            aiGenerateBtn.disabled = false;
            aiGenerateBtn.textContent = "Generate";
            aiStatus.textContent = "Ready";
            return;
        }

        if (status === "Error" || status === "Failed") {
            alert("AI failed");
            aiStatus.textContent = "Failed";
            return;
        }

        // 🔥 KLUCZOWE
        if (status === "Queued" || status === "Processing") {
            aiStatus.textContent = status;
            continue;
        }
    }

    aiGenerateBtn.disabled = false;
    aiGenerateBtn.textContent = "Generate";
    aiStatus.textContent = "Timeout";
}


// function addAIImageFromURL(url) {
//     const img = new Image();
//     // img.crossOrigin = "anonymous";

//     img.onload = () => {
//         const image = images[currentImageIndex];

//         if (!image) {
//             alert("No active image");
//             return;
//         }

//         const newLayer = createEmptyLayer(
//             "AI Layer",
//             img.width,
//             img.height,
//             img
//         );

//         const c = document.createElement("canvas");
//         c.width = img.width;
//         c.height = img.height;

//         const ctx = c.getContext("2d");
//         ctx.drawImage(img, 0, 0);

//         newLayer.canvas = c;

//         gl.bindTexture(gl.TEXTURE_2D, newLayer.tex);
//         setTextureDefaults(gl);

//         gl.texImage2D(
//             gl.TEXTURE_2D,
//             0,
//             gl.RGBA,
//             gl.RGBA,
//             gl.UNSIGNED_BYTE,
//             c
//         );

//         image.layers.unshift(newLayer);
//         image.activeLayer = 0;

//         activeTransformLayer = newLayer;

//         updateLayerUI();
//         draw();
//     };

//     img.onerror = () => {
//         alert("Failed to load AI image (CORS?)");
//     };

//     img.src = url;
// }


async function addAIImageFromURL(url, width = 1024, height = 1024) {

    const img = new Image();

    img.onload = () => {

        let image = images[currentImageIndex];

        // 🔥 jeśli nie ma obrazu → stwórz pusty
        if (!image) {
            image = createEmptyBaseImage(width, height);
        }

        // 🔥 TWORZENIE LAYERA (TAK SAMO JAK EDIT)
        const newLayer = createEmptyLayer(
            "AI Layer",
            img.width,
            img.height,
            img
        );

        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;

        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);

        newLayer.canvas = c;

        gl.bindTexture(gl.TEXTURE_2D, newLayer.tex);
        setTextureDefaults(gl);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            c
        );

        image.layers.unshift(newLayer);
        image.activeLayer = 0;

        activeTransformLayer = newLayer;

        updateLayerUI();
        draw();
    };

    img.onerror = () => {
        alert("Failed to load AI image");
    };

    img.src = url;
}


function createEmptyBaseImage(width, height) {

    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = width;
    baseCanvas.height = height;

    const ctx = baseCanvas.getContext("2d");

    // 🔥 możesz zmienić na transparent jeśli chcesz:
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const baseTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, baseTex);
    setTextureDefaults(gl);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        baseCanvas
    );

    const image = {
        name: "Empty",
        bmp: baseCanvas,
        layers: [
            {
                id: ++window.layerIdCounter,
                name: "Base",
                visible: true,
                canvas: baseCanvas,
                tex: baseTex,
                transform: {
                    x: 0,
                    y: 0,
                    scale: 1,
                    rotation: 0
                },
                settings: {
                    basic: { ...defaultBasicValues },
                    calibration: { ...defaultCalibrationValues },
                    hsl: Array(8).fill().map(() => ({ hue: 0, sat: 1, lig: 1 }))
                }
            }
        ],
        activeLayer: 0
    };

    images.push(image);
    currentImageIndex = images.length - 1;

    addToGallery(currentImageIndex);
    selectImage(currentImageIndex);

    return image;
}



async function uploadLayer(layer) {
    const blob = await new Promise(resolve =>
        layer.canvas.toBlob(resolve, "image/png")
    );

    const formData = new FormData();
    formData.append("file", blob);

    const res = await fetch("/ai/upload", {
        method: "POST",
        body: formData
    });

    const data = await res.json();

    if (data.error) {
            console.error(data.error);
            aiStatus.textContent = "Error";
            return;
        }

    return data.url;
}


// async function editCurrentLayer(prompt) {
//     const image = images[currentImageIndex];
//     const layer = image.layers[image.activeLayer];
//     // const layers = []

//     console.log("Images:", images);
//     // console.log("Image:", image);
//     // console.log("Layer:", layer);

//     if (!layer.canvas) {
//         alert("Layer has no canvas");
//         return;
//     }

//     // 🔥 konwersja do base64 (BEZ PREFIXU)
//     const base64 = layer.canvas
//         .toDataURL("image/png")
//         .split(",")[1];

//     const res = await fetch("/ai/edit", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//             prompt,
//             image: base64
//         })
//     });

//     const { polling_url } = await res.json();

//     pollResult(polling_url);
// }


async function editCurrentLayer(prompt) {
    const imagesPayload = [];

    const width = parseInt(aiWidth.value) || 1024;
    const height = parseInt(aiHeight.value) || 1024;
    const aspect_ratio = aiAspect.value || "1:1";

    console.log("Images:", images);

    for (const img of images) {
        for (const layer of img.layers) {

            if (!layer.canvas) continue;

            const base64 = layer.canvas
                .toDataURL("image/png")
                .split(",")[1];

            imagesPayload.push(base64);
        }
    }

    if (imagesPayload.length === 0) {
        alert("No layers to send");
        aiStatus.textContent = "Error...";
        return;
    }

    aiStatus.textContent = "Generating...";

    const res = await fetch("/ai/edit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            prompt,
            images: imagesPayload,
            width,
            height,
            aspect_ratio
        })
    });

    const { polling_url } = await res.json();

    pollResult(polling_url);
}