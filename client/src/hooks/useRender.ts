import { useState } from 'react';

export const useRender = () => {
    const [render, setRender] = useState<number>(0);
    return { isRendered: render, render: () => setRender((c) => c + 1) };
};
