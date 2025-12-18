import React from 'react';

// Це має відповідати BASE_URL у useChannels.js
const MEDIA_BASE_URL = 'http://127.0.0.1:8000'; 

function ChannelCard({ channel }) {
    // Формуємо шляхи
    // Якщо у вас Telegram username, то шлях має бути таким:
    const avatarPath = channel.username ? `/media/channels/${channel.username}/avatar.jpg` : '';
    const avatarUrl = MEDIA_BASE_URL + avatarPath;
    
    // Посилання для редіректу 
    const goUrl = `${MEDIA_BASE_URL}/api/v1/channels/${channel.id}/go`; 

    // Обробка відсутніх даних
    const displayTitle = channel.title || 'Канал без назви';
    const displayDescription = channel.description || 'Опис відсутній.';
    const displaySubscribers = channel.subscriber_count ? 
        channel.subscriber_count.toLocaleString('uk-UA') : 'N/A';

    return (
        <div className="channel-card">
            
            <div className="card-header">
                {/* Аватар. Використовуємо channel.username для шляху. */}
                <img 
                    src={avatarUrl} 
                    alt={displayTitle} 
                    className="channel-avatar" 
                    // Якщо зображення не завантажиться, можна показати заглушку
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/60"; }}
                />
                <div className="card-title-group">
                    <h4>{displayTitle}</h4>
                    <p>@{channel.username}</p>
                </div>
            </div>
            
            <p className="channel-description">
                {displayDescription}
            </p>
            
            <div className="tags">
                {channel.tags && channel.tags.map(tag => (
                    <span key={tag.id || tag.name} className="tag-pill">{tag.name}</span>
                ))}
            </div>

            <div className="card-footer">
                <span className="subscriber-count">
                    ⚡️ {displaySubscribers} підписників
                </span>
                <a 
                    href={goUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="go-button"
                >
                    Перейти в Telegram
                </a>
            </div>
        </div>
    );
}

export default ChannelCard;