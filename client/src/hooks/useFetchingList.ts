import { useEffect, useRef } from 'react';

interface UseFetchingListProps {
    directory: string;
    listItemSelector: string;
    cb: (page: number) => Promise<void>;
    isListEmpty: boolean;
    timeout?: number;
    deps: any[];
}

export const useFetchingList = ({
    listItemSelector,
    cb,
    directory,
    isListEmpty,
    timeout,
    deps = [],
}: UseFetchingListProps) => {
    const pageNumberRef = useRef(1);
    const selector = `${listItemSelector}:last-child`;

    // Separate effect: set up IntersectionObserver ONLY after lastItem is detected
    useEffect(() => {
        if (isListEmpty || !listItemSelector) return;
        let lastInnerText: string = '';

        const observer = new IntersectionObserver(async (entries) => {
            const entry = entries[0];

            if (entry.isIntersecting) {
                await cb(pageNumberRef.current++);
                observer.unobserve(entries[0].target);

                const effect = () => {
                    const newLastItem = document.querySelector(selector) as HTMLElement | null;
                    if (newLastItem && newLastItem.innerText !== lastInnerText) {
                        lastInnerText = newLastItem.innerText;
                        observer.observe(newLastItem);
                    }
                };
                if (timeout) {
                    setTimeout(effect, timeout);
                } else {
                    effect();
                }
            }
        });

        const effect = () => {
            const lastItem = document.querySelector(selector) as HTMLElement | null;
            if (!lastItem) return;
            lastInnerText = lastItem.innerText;
            observer.observe(lastItem);
        };

        if (timeout) {
            setTimeout(effect, timeout);
        } else {
            effect();
        }

        return () => {
            observer.disconnect();
        };
    }, [directory, listItemSelector, isListEmpty, selector, ...deps]);

    useEffect(() => {
        return () => {
            pageNumberRef.current = 1;
        };
    }, [directory, listItemSelector, isListEmpty, selector]);

    return null;
};
