import numpy as np

def rgb_to_hsl_pixel(r, g, b):
    maxc = max(r, g, b)
    minc = min(r, g, b)
    l = (maxc + minc) / 2

    if maxc == minc:
        return 0.0, 0.0, l

    d = maxc - minc
    s = d / (2 - maxc - minc) if l > 0.5 else d / (maxc + minc)

    if maxc == r:
        h = (g - b) / d + (6 if g < b else 0)
    elif maxc == g:
        h = (b - r) / d + 2
    else:
        h = (r - g) / d + 4

    return h / 6, s, l


def hsl_to_rgb_pixel(h, s, l):
    if s == 0:
        return l, l, l

    def hue_to_rgb(p, q, t):
        if t < 0: t += 1
        if t > 1: t -= 1
        if t < 1/6: return p + (q - p) * 6 * t
        if t < 1/2: return q
        if t < 2/3: return p + (q - p) * (2/3 - t) * 6
        return p

    q = l * (1 + s) if l < 0.5 else l + s - l * s
    p = 2 * l - q

    r = hue_to_rgb(p, q, h + 1/3)
    g = hue_to_rgb(p, q, h)
    b = hue_to_rgb(p, q, h - 1/3)

    return r, g, b


def apply_hsl_adjustment(arr, hue_shift, sat_scale, light_scale):
    h, w, ch = arr.shape
    out = np.zeros_like(arr)

    for y in range(h):
        for x in range(w):
            r0 = arr[y, x, 0] / 255.0
            g0 = arr[y, x, 1] / 255.0
            b0 = arr[y, x, 2] / 255.0

            h0, s0, l0 = rgb_to_hsl_pixel(r0, g0, b0)

            h0 = (h0 + hue_shift / 360.0) % 1.0
            s0 = np.clip(s0 * sat_scale, 0.0, 1.0)
            l0 = np.clip(l0 * light_scale, 0.0, 1.0)

            rr, gg, bb = hsl_to_rgb_pixel(h0, s0, l0)

            out[y, x, 0] = int(rr * 255)
            out[y, x, 1] = int(gg * 255)
            out[y, x, 2] = int(bb * 255)

            if ch == 4:
                out[y, x, 3] = arr[y, x, 3]

    return out
