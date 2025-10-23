import { useEffect, useRef } from 'react';
import { useRender } from './useRender.ts';

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
    const { render, isRendered } = useRender();
    const pageSelectorsRef = useRef<Record<string, { page: number }>>({});
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
                console.debug('🔴 Intersecting detected!', entry.target);
                pageSelectorsRef.current[directory] ||= { page: 1 };
                const page = pageSelectorsRef.current[directory].page++;
                await cbRef.current(page);
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
            pageSelectorsRef.current[directory] ||= { page: 1 };

            if (!lastItem) {
                console.debug('⚠️ No item to observe or no more pages');
                return;
            }

            console.debug('🔵 Initial setup - Found Last item:', lastItem);

            lastInnerText = lastItem.innerText;
            observer.observe(lastItem);
            console.debug('🔵 Started observing:', lastItem);
        };

        if (timeout) {
            setTimeout(effect, mountedTimeout);
        } else {
            effect();
        }

        return () => {
            observer.disconnect();
        };
    }, [directory, listItemSelector, isListEmpty, selector, isRendered, ...(deps ?? [])]);

    useEffect(() => {
        pageSelectorsRef.current = {};
    }, [reset]);

    return {
        resetPagination: (directory: string = '') => {
            pageSelectorsRef.current[directory] ||= { page: 1 };
            pageSelectorsRef.current[directory].page = 1;
            render();
        },
    };
};
