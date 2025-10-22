import { useEffect, useRef } from 'react';

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface UseFetchingListProps {
    directory: string;
    listItemSelector: string;
    cb: (page: number) => Promise<number | undefined>;
    isListEmpty: boolean;
    timeout?: number;
    mountedTimeout?: number;
    reset?: number;
    deps?: any[];
}

export const useFetchingList = ({
    listItemSelector,
    cb,
    directory,
    isListEmpty,
    timeout,
    deps,
    reset,
    mountedTimeout = 1000,
}: UseFetchingListProps) => {
    const pageSelectorsRef = useRef<Record<string, { page: number; hasNext: boolean }>>({});
    const cbRef = useRef(cb);
    const selector = listItemSelector ? `${listItemSelector}:last-child` : '';

    useEffect(() => {
        cbRef.current = cb;
    }, [cb]);

    // Separate effect: set up IntersectionObserver ONLY after lastItem is detected
    useEffect(() => {
        if (!selector) return;
        let lastInnerText: string = '';

        const observer = new IntersectionObserver(async (entries) => {
            const entry = entries[0];

            if (entry.isIntersecting) {
                console.log('🔴 Intersecting detected!', entry.target);
                const page = pageSelectorsRef.current[selector].page++;
                const totalFetchItems = await cbRef.current(page);
                observer.unobserve(entries[0].target);

                if (!totalFetchItems) {
                    pageSelectorsRef.current[selector].hasNext = false;
                    return;
                }

                const effect = () => {
                    const newLastItem = document.querySelector(selector) as HTMLElement | null;

                    if (newLastItem && newLastItem.innerText !== lastInnerText) {
                        lastInnerText = newLastItem.innerText;
                        observer.observe(newLastItem);
                    }
                };

                if (timeout) await sleep(timeout);
                effect();
            }
        });

        const effect = () => {
            const lastItem = document.querySelector(selector) as HTMLElement | null;
            pageSelectorsRef.current[selector] ||= { page: 1, hasNext: true };

            if (!lastItem) {
                console.log('⚠️ No item to observe or no more pages');
                return;
            }

            console.log('🔵 Initial setup - Found Last item:', lastItem);

            lastInnerText = lastItem.innerText;
            observer.observe(lastItem);
            console.log('🔵 Started observing:', lastItem);
        };

        if (timeout) {
            setTimeout(effect, mountedTimeout);
        } else {
            effect();
        }

        return () => {
            observer.disconnect();
        };
    }, [directory, listItemSelector, isListEmpty, selector, ...(deps ?? [])]);

    useEffect(() => {
        pageSelectorsRef.current = {};
    }, [reset]);

    return null;
};
