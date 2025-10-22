import color from 'color';

const ratio = 0.618033988749895;
let hue = Math.random();

export default function (saturation: number | undefined = undefined, value: number | undefined = undefined) {
    hue += ratio;
    hue %= 1;

    if (typeof saturation !== 'number') {
        saturation = 0.5;
    }

    if (typeof value !== 'number') {
        value = 0.95;
    }

    return color({
        h: hue * 360,
        s: saturation * 100,
        v: value * 100,
    }).hex();
}
