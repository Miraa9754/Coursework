import { useState, useEffect } from 'react';
import axios from 'axios';

// Базова URL вашого бекенду (з префіксом API)
// Використовуйте localhost, якщо це працює з вашими CORS-налаштуваннями,
// інакше змініть на 127.0.0.1
const BASE_URL = 'http://localhost:8000/api/v1'; 

export function useChannels(activeTags = []) {
    const [channels, setChannels] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- 1. Отримання ТЕГІВ при першому завантаженні ---
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/tags`);
                // Оскільки бекенд повертає масив тегів, зберігаємо його
                setTags(response.data);
            } catch (err) {
                console.error("Помилка завантаження тегів:", err.message);
                // Тут ми не ставимо setError, оскільки відсутність тегів не блокує каталог
            }
        };
        fetchTags();
    }, []); // Порожній масив означає, що ефект запускається лише один раз (при монтуванні)


    // --- 2. Отримання КАНАЛІВ при зміні активних фільтрів ---
    useEffect(() => {
        // Скидаємо помилки та встановлюємо завантаження
        setLoading(true);
        setError(null);
        
        const fetchData = async () => {
            
            // Формування URL для запиту
            let url = `${BASE_URL}/channels?limit=50`;
            
            if (activeTags.length > 0) {
                // Формуємо query параметри: tags=ua&tags=news
                const tagParams = activeTags.map(tag => `tags=${tag}`).join('&');
                
                // Додаємо теги та логіку співпадіння (match=all або match=any)
                url += `&${tagParams}&match=all`; 
            }

            try {
                const response = await axios.get(url);
                setChannels(response.data);
                
            } catch (err) {
                // Обробка мережевих помилок (CORS, сервер не працює)
                console.error("Помилка завантаження каналів:", err.message);
                // Повідомлення для користувача
                setError(`Не вдалося підключитися до API або отримати дані. Перевірте, чи запущено бекенд. Деталі: ${err.message}`);
                
            } finally {
                // Знімаємо індикатор завантаження незалежно від результату
                setLoading(false);
            }
        };

        fetchData();
        
    }, [activeTags]); // Залежність від activeTags: хук перезапускається, коли користувач натискає "Застосувати"

    // Повертаємо стани для використання в компонентах
    return { channels, tags, loading, error };
}