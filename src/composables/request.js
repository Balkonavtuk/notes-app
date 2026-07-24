import { ref } from 'vue';

export function useRequest(url, { method = 'GET', headers = {}, query = null, body = null } = {}) {
    // Реактивные состояния
    const data = ref(null);
    const error = ref(null);
    const isInit = ref(true);
    const isLoading = ref(false);
    const isLoaded = ref(false);
    const isError = ref(false);

    // Асинхронная функция запроса
    const request = async () => {
        // Обновляем статусы перед началом запроса
        isInit.value = false;
        isLoading.value = true;
        isLoaded.value = false;
        isError.value = false;
        error.value = null;

        try {
            // Формируем итоговый URL с учетом query-параметров
            let finalUrl = url;
            if (query) {
                const params = new URLSearchParams(query);
                const queryString = params.toString();
                if (queryString) {
                    finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
                }
            }

            // Настраиваем параметры запроса
            const options = {
                method,
                headers: { ...headers }
            };

            // Обрабатываем тело запроса (body)
            if (body) {
                if (typeof body === 'object' && !(body instanceof FormData)) {
                    options.body = JSON.stringify(body);
                    if (!options.headers['Content-Type']) {
                        options.headers['Content-Type'] = 'application/json';
                    }
                } else {
                    options.body = body;
                }
            }

            // Выполняем запрос
            const response = await fetch(finalUrl, options);

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
            }

            // Пытаемся получить JSON, иначе забираем как текст
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data.value = await response.json();
            } else {
                data.value = await response.text();
            }

            // Запрос успешно завершен
            isLoaded.value = true;
        } catch (e) {
            // Запрос завершился с ошибкой
            isError.value = true;
            error.value = e.message || 'Произошла неизвестная ошибка при выполнении запроса';
        } finally {
            // Запрос завершен (успешно или нет)
            isLoading.value = false;
        }
    };

    return {
        request,
        data,
        error,
        isInit,
        isLoading,
        isLoaded,
        isError
    };
}