import { useEffect, useRef } from 'react';

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface UseFetchingListProps {
    directory: string;
    listItemSelector: string;
    cb: (page: number) => Promise<number | undefined>;
    isListEmpty: boolean;
    timeout?: number;
    mountedTimeout?: number;
    deps?: any[];
}

export const useFetchingList = ({
    listItemSelector,
    cb,
    directory,
    isListEmpty,
    timeout,
    deps,
    mountedTimeout = 1000,
}: UseFetchingListProps) => {
    const pageSelectorsRef = useRef<Record<string, { page: number; hasNext: boolean }>>({});
    const cbRef = useRef(cb);
    const selector = `${listItemSelector}:last-child`;

    useEffect(() => {
        cbRef.current = cb;
    }, [cb]);

    // Separate effect: set up IntersectionObserver ONLY after lastItem is detected
    useEffect(() => {
        if (isListEmpty || !listItemSelector) return;
        let lastInnerText: string = '';

        const observer = new IntersectionObserver(async (entries) => {
            const entry = entries[0];

            if (entry.isIntersecting) {
                const page = pageSelectorsRef.current[selector].page++;
                const totalFetchItems = await cbRef.current(page);
                if (!totalFetchItems) {
                    pageSelectorsRef.current[selector].hasNext = false;
                }
                observer.unobserve(entries[0].target);

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

            if (!lastItem || !pageSelectorsRef.current[selector].hasNext) return;

            lastInnerText = lastItem.innerText;
            observer.observe(lastItem);
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

    return null;
};
