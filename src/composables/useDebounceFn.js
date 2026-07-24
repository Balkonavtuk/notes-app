import { ref } from 'vue';

export function useDebounceFn(fn, delay = 250) {
    let timeoutId = null;

    const debouncedFn = (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            fn(...args);
        }, delay);
    };

    return debouncedFn;
}