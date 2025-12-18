import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

// Базова URL бекенду
const BASE_URL = 'http://127.0.0.1:8000/api/v1'; 

function AdminArea({ adminToken }) { 
    
    // --- СТАНИ ДЛЯ КЕРУВАННЯ КАНАЛАМИ ---
    const [telegramUrl, setTelegramUrl] = useState('');
    const [tagSelection, setTagSelection] = useState([]);
    const [status, setStatus] = useState('');

    const [deleteId, setDeleteId] = useState('');
    const [deleteStatus, setDeleteStatus] = useState('');

    const [editId, setEditId] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editTagInput, setEditTagInput] = useState('');
    const [editStatus, setEditStatus] = useState('');

    // --- СТАНИ ДЛЯ КЕРУВАННЯ ТЕГАМИ ---
    const [newTagName, setNewTagName] = useState('');
    const [tagStatus, setTagStatus] = useState('');
    const [tagIdToDelete, setTagIdToDelete] = useState('');
    const [deleteTagStatus, setDeleteTagStatus] = useState('');
    const [tagOptions, setTagOptions] = useState([]);

    const loadTags = useCallback(async () => {
        try {
            const res = await axios.get(`${BASE_URL}/tags`);
            setTagOptions(res.data || []);
        } catch (error) {
            console.error('Помилка завантаження тегів:', error);
        }
    }, []);

    useEffect(() => {
        loadTags();
    }, [loadTags]);
    

    const handleAddChannel = async (e) => {
        e.preventDefault();
        setStatus('Додавання...');

        if (!tagSelection.length) {
            setStatus('Помилка: Необхідно додати хоча б один тег.');
            return;
        }

        try {
            const response = await axios.post(
                `${BASE_URL}/admin/channels`, 
                {
                    telegram_url: telegramUrl,
                    tags: tagSelection
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Token': adminToken 
                    }
                }
            );

            setStatus(`Успіх! Канал "${response.data.title}" додано`);
            setTelegramUrl('');
            setTagSelection([]);

        } catch (error) {
            console.error('Помилка при додаванні каналу:', error.response ? error.response.data : error.message);
            setStatus(`Помилка: ${error.response ? error.response.data.detail : error.message}.`);
        }
    };


    const handleEditChannel = async (e) => {
        e.preventDefault();
        setEditStatus('Редагування...');

        if (!editId || isNaN(editId)) {
            setEditStatus('Помилка: ID каналу має бути числом.');
            return;
        }

        const tagsArray = editTagInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        
        const payload = {};
        if (editTitle.trim()) payload.title = editTitle.trim();
        if (editDescription.trim()) payload.description = editDescription.trim();
        if (tagsArray.length > 0) payload.tags = tagsArray; 

        if (Object.keys(payload).length === 0) {
            setEditStatus('Помилка: Немає даних для оновлення. Заповніть хоча б одне поле.');
            return;
        }

        try {
            const response = await axios.patch(
                `${BASE_URL}/admin/channels/${editId}`, 
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Token': adminToken 
                    }
                }
            );

            setEditStatus(`Успіх! Канал ID: ${editId} оновлено. Нова назва: "${response.data.title}"`);
            setEditId('');
            setEditTitle('');
            setEditDescription('');
            setEditTagInput('');

        } catch (error) {
            console.error('Помилка при редагуванні каналу:', error.response ? error.response.data : error.message);
            setEditStatus(`Помилка редагування: ${error.response ? error.response.data.detail : error.message}.`);
        }
    };
    

    const handleDeleteChannel = async (e) => {
        e.preventDefault();
        setDeleteStatus('Видалення...');

        if (!deleteId || isNaN(deleteId)) {
            setDeleteStatus('Помилка: ID каналу має бути числом.');
            return;
        }

        try {
            await axios.delete(
                `${BASE_URL}/admin/channels/${deleteId}`,
                {
                    headers: {
                        'X-Admin-Token': adminToken 
                    }
                }
            );

            setDeleteStatus(`Успіх! Канал з ID: ${deleteId} видалено.`);
            setDeleteId('');
        } catch (error) {
            console.error('Помилка при видаленні каналу:', error.response ? error.response.data : error.message);
            setDeleteStatus(`Помилка видалення: ${error.response ? error.response.data.detail : error.message}.`);
        }
    };


    const handleAddTag = async (e) => {
        e.preventDefault();
        const tag = newTagName.trim().toLowerCase();
        setTagStatus('Додавання тега...');

        if (!tag) {
            setTagStatus('Помилка: Назва тега не може бути порожньою.');
            return;
        }

        try {
            await axios.post(
                `${BASE_URL}/tags`, 
                { name: tag },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Token': adminToken 
                    }
                }
            );

            setTagStatus(`Успіх! Тег "${tag}" додано.`);
            setNewTagName('');
            loadTags();

        } catch (error) {
            console.error('Помилка при додаванні тега:', error.response ? error.response.data : error.message);
            setTagStatus(`Помилка: ${error.response ? error.response.data.detail : error.message}.`);
        }
    };


    const handleDeleteTag = async (e) => {
        e.preventDefault();
        
        const tagId = tagIdToDelete.trim();
        setDeleteTagStatus('Видалення тега...');

        if (!tagId || isNaN(tagId)) {
            setDeleteTagStatus('Помилка: ID тега має бути числом.');
            return;
        }

        try {
            await axios.delete(
                `${BASE_URL}/tags/${tagId}`, 
                {
                    headers: {
                        'X-Admin-Token': adminToken 
                    }
                }
            );

            setDeleteTagStatus(`Успіх! Тег з ID: ${tagId} видалено.`);
            setTagIdToDelete('');

        } catch (error) {
            console.error('Помилка при видаленні тега:', error.response ? error.response.data : error.message);
            setDeleteTagStatus(`Помилка: ${error.response ? error.response.data.detail : error.message}. Можливо, тег не існує.`);
        }
    };

    const toggleTagChoice = (tagName) => {
        const normalized = (tagName || '').toLowerCase();
        setTagSelection((prev) =>
            prev.includes(normalized)
                ? prev.filter((t) => t !== normalized)
                : [...prev, normalized]
        );
    };


    return (
        <div className="admin-panel">
            <div className="admin-heading">
                <h2>Адмін-панель: Керування каталогом</h2>
                <span className="token-active">🔑 Admin Token активний</span>
            </div>
            
            <details className="admin-accordion" open>
                <summary>🟢 Додати (Create)</summary>
                <div className="body">
                    <div className="admin-subsection">
                        <h4>Канал</h4>
                        <form className="admin-form" onSubmit={handleAddChannel}>
                            <div className="field">
                                <label>Посилання на Telegram (тільки public):</label>
                                <input type="url" value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} placeholder="https://t.me/some_channel" required />
                            </div>
                            <div className="field">
                                <label>Теги:</label>
                                <div className="tag-select-grid">
                                    {tagOptions.length === 0 ? (
                                        <p style={{ margin: 0, color: '#94a3b8' }}>Теги ще не створені.</p>
                                    ) : (
                                        tagOptions.map((tag) => {
                                            const tagName = (tag.name || '').toLowerCase();
                                            return (
                                                <label key={tag.id || tag.name} className="tag-option">
                                                    <input
                                                        type="checkbox"
                                                        checked={tagSelection.includes(tagName)}
                                                        onChange={() => toggleTagChoice(tagName)}
                                                    />
                                                    <span>{tag.name}</span>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                            <div className="admin-actions">
                                <button type="submit" className="pill-btn primary">Додати канал</button>
                            </div>
                            {status && <p className="status">Статус: {status}</p>}
                        </form>
                    </div>

                    <div className="admin-subsection">
                        <h4>Тег</h4>
                        <form className="admin-form" onSubmit={handleAddTag}>
                            <div className="field">
                                <label>Назва тега:</label>
                                <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="Напр. tech" required />
                            </div>
                            <div className="admin-actions">
                                <button type="submit" className="pill-btn primary">Додати тег</button>
                            </div>
                            {tagStatus && <p className="status">{tagStatus}</p>}
                        </form>
                    </div>
                </div>
            </details>
            
            <details className="admin-accordion">
                <summary>🟡 Редагувати (Update)</summary>
                <div className="body">
                    <div className="admin-subsection">
                        <h4>Канал</h4>
                        <form className="admin-form" onSubmit={handleEditChannel}>
                            <div className="field">
                                <label>ID каналу для редагування:</label>
                                <input type="number" value={editId} onChange={(e) => setEditId(e.target.value)} placeholder="ID" required />
                            </div>
                            <div className="field">
                                <label>Нова Назва:</label>
                                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Нова назва каналу" />
                            </div>
                            <div className="field">
                                <label>Новий Опис:</label>
                                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Новий опис" />
                            </div>
                            <div className="field">
                                <label>Теги (повна заміна, через кому, опційно):</label>
                                <input type="text" value={editTagInput} onChange={(e) => setEditTagInput(e.target.value)} placeholder="tech1, tech2" />
                            </div>
                            <div className="admin-actions">
                                <button type="submit" className="pill-btn warning">Оновити канал</button>
                            </div>
                            {editStatus && <p className="status">Статус редагування: {editStatus}</p>}
                        </form>
                    </div>
                </div>
            </details>


            <details className="admin-accordion">
                <summary>🔴 Видалити (Delete)</summary>
                <div className="body">
                    <div className="admin-subsection">
                        <h4>Канал</h4>
                        <form className="admin-form" onSubmit={handleDeleteChannel}>
                            <div className="field">
                                <label>ID каналу для видалення:</label>
                                <input type="number" value={deleteId} onChange={(e) => setDeleteId(e.target.value)} placeholder="ID" required />
                            </div>
                            <div className="admin-actions">
                                <button type="submit" className="pill-btn danger">Видалити канал</button>
                            </div>
                            {deleteStatus && <p className="status">Статус видалення: {deleteStatus}</p>}
                        </form>
                    </div>

                    <div className="admin-subsection">
                        <h4>Тег</h4>
                        <form className="admin-form" onSubmit={handleDeleteTag}>
                            <div className="field">
                                <label>ID тега для видалення:</label>
                                <input 
                                    type="number" 
                                    value={tagIdToDelete} 
                                    onChange={(e) => setTagIdToDelete(e.target.value)} 
                                    placeholder="ID" 
                                    required 
                                />
                            </div>
                            <div className="admin-actions">
                                <button type="submit" className="pill-btn danger">Видалити тег</button>
                            </div>
                            {deleteTagStatus && <p className="status">{deleteTagStatus}</p>}
                        </form>
                    </div>
                </div>
            </details>

        </div>
    );
}

export default AdminArea;