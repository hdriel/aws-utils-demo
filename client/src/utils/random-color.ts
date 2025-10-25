import color from 'color';
import { darken } from '@mui/material';

const ratio = 0.618033988749895;
let hue = Math.random();

function randomColor(saturation: number | undefined = undefined, value: number | undefined = undefined) {
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

export default randomColor();

export const randomColorDirectory = (coefficient: number = 0.35) => darken(randomColor(), coefficient);
