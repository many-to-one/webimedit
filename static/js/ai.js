// const aiPromptInput = document.getElementById("aiPrompt");
// const aiGenerateBtn = document.getElementById("aiGenerate");

// aiGenerateBtn.onclick = async () => {
//     const prompt = aiPromptInput.value.trim();
//     if (!prompt) return;

//     aiGenerateBtn.disabled = true;
//     aiGenerateBtn.textContent = "Generating...";

//     try {
//         const res = await fetch("/ai/generate", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ prompt })
//         });

//         const { taskId } = await res.json();

//         pollResult(taskId);
//     } catch (err) {
//         console.error(err);
//         alert("AI error");
//     }
// };



// async function pollResult(taskId) {
//     let tries = 0;
//     const maxTries = 60;

//     while (tries < maxTries) {
//         await new Promise(r => setTimeout(r, 1500));
//         tries++;

//         const res = await fetch(`/ai/result/${taskId}`);
//         const data = await res.json();

//         const status = data.data?.status;

//         if (status === "SUCCESS") {
//             const imageUrl = data.data.images[0];

//             addAIImageFromURL(imageUrl);

//             aiGenerateBtn.disabled = false;
//             aiGenerateBtn.textContent = "Generate";

//             return;
//         }

//         if (status === "FAILED") {
//             alert("AI generation failed");
//             break;
//         }
//     }

//     aiGenerateBtn.disabled = false;
//     aiGenerateBtn.textContent = "Generate";
// }


// function addAIImageFromURL(url) {
//     const img = new Image();
//     img.crossOrigin = "anonymous";

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


// async function uploadLayer(layer) {
//     const blob = await new Promise(resolve =>
//         layer.canvas.toBlob(resolve, "image/png")
//     );

//     const formData = new FormData();
//     formData.append("file", blob);

//     const res = await fetch("/ai/upload", {
//         method: "POST",
//         body: formData
//     });

//     const data = await res.json();
//     return data.url;
// }


// async function editCurrentLayer(prompt) {
//     const image = images[currentImageIndex];
//     const layer = image.layers[image.activeLayer];

//     const imageUrl = await uploadLayer(layer);

//     fetch("/ai/edit", {
//         method: "POST",
//         body: JSON.stringify({
//             prompt,
//             inputImage: imageUrl
//         })
//     });

//     const { taskId } = await res.json();

//     pollResult(taskId);
// }



const aiPromptInput = document.getElementById("aiPrompt");
const aiGenerateBtn = document.getElementById("aiGenerate");
const aiStatus = document.getElementById("aiStatus");

aiGenerateBtn.onclick = async () => {
    const prompt = aiPromptInput.value.trim();
    if (!prompt) return;

    aiGenerateBtn.disabled = true;
    aiGenerateBtn.textContent = "Generating...";
    aiStatus.textContent = "Generating...";

    if (aiGenerateBtn.disabled) return;

    try {
        // 🔥 NAJPIERW GENERATE
        const res = await fetch("/ai/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt })
        });

        const data = await res.json();

        if (!data.polling_url) {
            throw new Error("No polling_url returned");
        }

        // 🔥 DOPIERO TERAZ polling
        pollResult(data.polling_url);

    } catch (err) {
        console.error(err);
        aiStatus.textContent = "Error";
    }
};


async function pollResult(pollingUrl) {
    let tries = 0;

    while (tries < 100) {
        await new Promise(r => setTimeout(r, 700));
        tries++;

        const res = await fetch("/ai/result", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ polling_url: pollingUrl })
        });

        const data = await res.json();

        const status = data.status;

        if (status === "Ready") {
            const imageUrl = data.result.sample;

            addAIImageFromURL(imageUrl);

            aiGenerateBtn.disabled = false;
            aiGenerateBtn.textContent = "Generate";
            aiStatus.textContent = "Ready";
            return;
        }

        if (status === "Error" || status === "Failed") {
            alert("AI failed");
            break;
        }
    }

    aiGenerateBtn.disabled = false;
    aiGenerateBtn.textContent = "Generate";
    aiStatus.textContent = "Failed";
}


function addAIImageFromURL(url) {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
        const image = images[currentImageIndex];

        if (!image) {
            alert("No active image");
            return;
        }

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
        alert("Failed to load AI image (CORS?)");
    };

    img.src = url;
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
    return data.url;
}


async function editCurrentLayer(prompt) {
    const image = images[currentImageIndex];
    const layer = image.layers[image.activeLayer];

    if (!layer.canvas) {
        alert("Layer has no canvas");
        return;
    }

    // 🔥 konwersja do base64 (BEZ PREFIXU)
    const base64 = layer.canvas
        .toDataURL("image/png")
        .split(",")[1];

    const res = await fetch("/ai/edit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            prompt,
            image: base64
        })
    });

    const { polling_url } = await res.json();

    pollResult(polling_url);
}