import React, { useEffect, useState } from 'react';
import { useChannels } from './useChannels';
import ChannelCard from './ChannelCard';

function ChannelList() {
    // Активні та відкладені теги (за назвою, бо бекенд очікує name)
    const [activeTags, setActiveTags] = useState([]);
    const [pendingTags, setPendingTags] = useState([]);

    const { channels, tags, loading, error } = useChannels(activeTags); 
    
    // Синхронізуємо чекбокси з активними тегами при перезавантаженні
    useEffect(() => {
        setPendingTags(activeTags);
    }, [activeTags]);

    const handlePendingTagChange = (tagName) => {
        setPendingTags(prevTags => 
            prevTags.includes(tagName) 
                ? prevTags.filter(t => t !== tagName)
                : [...prevTags, tagName]
        );
    };

    const applyFilters = () => {
        setActiveTags(pendingTags); 
    };

    const clearFilters = () => {
        setPendingTags([]);
        setActiveTags([]);
    };

    if (loading) return <div className="loading-error">Завантаження каналів...</div>;
    if (error) return <div className="loading-error">Помилка: {error}</div>;

    return (
        <div className="panel">
            <div className="main-layout">
                
                {/* 1. БІЧНА ПАНЕЛЬ ФІЛЬТРІВ */}
                <div className="filters-sidebar">
                    <h3>Фільтрація за тегами</h3>
                    <div className="tag-checkbox-group">
                        {tags.length === 0 ? (
                            <p>Теги відсутні.</p>
                        ) : (
                            tags.map(tag => {
                                const tagName = (tag.name || '').toLowerCase();
                                return (
                                <label key={tag.id || tag.name}> 
                                    <input
                                        type="checkbox"
                                        value={tagName} 
                                        checked={pendingTags.includes(tagName)} 
                                        onChange={() => handlePendingTagChange(tagName)}
                                    />
                                    {tag.name}
                                </label>
                            )})
                        )}
                    </div>
                    
                    <div className="filter-actions">
                        <button 
                            onClick={applyFilters}
                            className="apply-button"
                        >
                            Застосувати
                        </button>
                        <button
                            onClick={clearFilters}
                            className="clear-button"
                        >
                            Очистити
                        </button>
                    </div>
                </div>

                {/* 2. ГРИД КАНАЛІВ */}
                <div className="channel-grid">
                    {channels.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', width: '100%' }}>
                            <p>Каналів за вибраними фільтрами не знайдено.</p>
                        </div>
                    ) : (
                        channels.map(channel => (
                            <ChannelCard key={channel.id} channel={channel} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChannelList;