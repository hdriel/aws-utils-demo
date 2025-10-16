import { useEffect, useRef, useState } from 'react';

interface UseFetchingListProps {
    directory: string;
    listItemSelector: string;
    cb: (page: number) => Promise<void>;
    isListEmpty: boolean;
}

export const useFetchingList = ({ listItemSelector, cb, directory, isListEmpty }: UseFetchingListProps) => {
    const pageNumberRef = useRef(1);
    const selector = `${listItemSelector}:last-child`;

    const [loading, setLoading] = useState(true);
    const element = listItemSelector ? (document.querySelector(selector) as HTMLElement) : null;
    useEffect(() => {
        if (element) {
            setLoading(false);
        } else {
            setLoading(true);
        }
    }, [element]);

    useEffect(() => {
        if (loading || isListEmpty) return;

        console.log(selector);
        const lastItem = listItemSelector ? (document.querySelector(selector) as HTMLElement) : null;
        let lastId = lastItem?.innerHTML;

        const observer = new IntersectionObserver(async (entries) => {
            console.log('useFetchingList.IntersectionObserver', entries[0], pageNumberRef.current);
            const entry = entries[0];
            if (entry.isIntersecting) {
                await cb(pageNumberRef.current++);
                observer.unobserve(entries[0].target);

                const newLastItem = listItemSelector && document.querySelector(selector);
                if (newLastItem && newLastItem.innerHTML !== lastId) {
                    lastId = newLastItem.innerHTML;
                    observer.observe(newLastItem);
                }
            }
        });

        if (lastItem) {
            console.log('useFetchingList', directory, listItemSelector, pageNumberRef.current);
            observer.observe(lastItem);
        }

        return () => {
            observer.disconnect();
            pageNumberRef.current = 0;
        };
    }, [loading, directory, listItemSelector, isListEmpty]);
};
