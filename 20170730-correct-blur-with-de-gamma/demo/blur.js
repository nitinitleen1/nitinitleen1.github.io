// @ts-check

/** @type CanvasRenderingContext2D */
const ctx = $canvas.getContext('2d')
const image = new Image()

let taskTimer

let iterations
let gamma
let radius

image.onload = render

$radiusInput.oninput = render
$gammaInput.oninput = render
$iterationsInput.oninput = render

$imageInput.onchange = e => {
    image.src = URL.createObjectURL(e.target.files[0])
}

$defaultImage.onclick = async e => {
    e.preventDefault()

    const res = await fetch('./test.jpg')
    image.src = URL.createObjectURL(await res.blob())
}

render()

async function blur() {
    const W = image.naturalWidth
    const H = image.naturalHeight
    const R = radius

    const N = W * H * 4
    const D = 2 * R + 1

    const imageData = ctx.getImageData(0, 0, W, H)

    const bufPixels1 = new Float64Array(N)
    const bufPixels2 = new Float64Array(N)

    for (let i = 0; i < N; i++) {
        bufPixels1[i] = imageData.data[i] ** gamma
    }

    let progress = 0

    for (let _ = 0; _ < iterations; _++) {
        for (let c = 0; c < 3; c++) {
            for (let y = 0; y < H; y++) {
                const x0 = c + 4 * W * y

                let value = (R + 1) * bufPixels1[x0]
                for (let x = 0; x < R; x++) {
                    value += bufPixels1[x0 + 4 * x]
                }

                for (let x = 0; x < W; x++) {
                    const xL = Math.max(x - R - 1, 0)
                    const xR = Math.min(x + R, W - 1)

                    value +=
                        bufPixels1[x0 + 4 * xR] - bufPixels1[x0 + 4 * xL]

                    bufPixels2[x0 + 4 * x] = value / D
                }
            }

            progress += H * (100 / (3 * iterations * (W + H)))

            await renderProgress(progress)

            for (let x = 0; x < W; x++) {
                const y0 = c + 4 * x

                let value = (R + 1) * bufPixels2[y0]
                for (let y = 0; y < R; y++) {
                    value += bufPixels2[y0 + 4 * W * y]
                }

                for (let y = 0; y < H; y++) {
                    const yT = Math.max(y - R - 1, 0)
                    const yB = Math.min(y + R, H - 1)

                    value +=
                        bufPixels2[y0 + 4 * W * yB] -
                        bufPixels2[y0 + 4 * W * yT]

                    bufPixels1[y0 + 4 * W * y] = value / D
                }
            }

            progress += W * (100 / (3 * iterations * (W + H)))

            await renderProgress(progress)
        }
    }

    for (let i = 0; i < N; i++) {
        imageData.data[i] = Math.round(bufPixels1[i] ** (1 / gamma))
    }

    ctx.putImageData(imageData, 0, 0)

    await renderProgress(0)
}

async function render() {
    iterations = Number($iterationsInput.value)
    radius = Number($radiusInput.value)
    gamma = Number($gammaInput.value)

    renderForm()

    if (image.src !== '') {
        renderImage()

        clearTimeout(taskTimer)
        taskTimer = setTimeout(blur, 1000)
    }
}

function renderForm() {
    $iterationsInputValue.innerText = String(iterations).padEnd(3, ' ')
    $radiusInputValue.innerText = String(radius).padEnd(3, ' ')
    $gammaInputValue.innerText = gamma.toFixed(1).padStart(3, ' ')
}

function renderImage() {
    $canvas.width = image.naturalWidth
    $canvas.height = image.naturalHeight
    ctx.drawImage(image, 0, 0)
}

/**
 * @param {number} progress
 */
async function renderProgress(progress) {
    await new Promise(res => {
        $progress.style.display = progress === 0 ? 'none' : 'block'

        $progress.value = progress

        requestAnimationFrame(() => {
            res()
        })
    })
}
