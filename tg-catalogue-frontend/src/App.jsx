import React, { useState } from 'react';
import ChannelList from './ChannelList';
import AdminArea from './AdminArea';
import './App.css';
import axios from 'axios';

// Базова URL бекенду
const BASE_URL = 'http://localhost:8000/api/v1';
const LOCK_ICON = '🔑';
const UNLOCK_ICON = '🔓';

function App() {
    // Стан для зберігання токену, якщо він успішно пройшов перевірку на бекенді
    const [adminToken, setAdminToken] = useState(null);
    // Стан для значення в полі вводу
    const [inputValue, setInputValue] = useState('');
    // Стан для повідомлення про помилку
    const [authError, setAuthError] = useState('');

    const handleLogin = async () => {
        setAuthError('Перевірка токена...');
        const tokenToCheck = inputValue.trim(); 

        if (!tokenToCheck) {
            setAuthError('Будь ласка, введіть токен.');
            return;
        }

        try {
            // Якщо токен невірний, бекенд поверне 401 Unauthorized, що викличе блок catch
            await axios.get(
                 `${BASE_URL}/admin/channels/auth-check`,
                {
                    headers: {
                        'X-Admin-Token': tokenToCheck
                    }
                }
            );

            // Якщо запит успішний (статус 200), токен вірний
            setAdminToken(tokenToCheck);
            setAuthError('');
      

        } catch (error) {
            // Обробка помилок (401 або мережева помилка)
            console.error('Помилка валідації токена:', error);
            setAuthError('Невірний пароль доступу. Вхід заборонено');
        }
    };

    const AdminLogin = () => (
        <div className="auth-card panel">
            <h3>🔐 Вхід до адмін-панелі</h3>
            <p>Введіть Admin пароль:</p>
            <input
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="input"
            />
            <button
                onClick={handleLogin}
                className="primary-btn"
            >
                Увійти
            </button>
            {authError && <p className="status error">{authError}</p>}
        </div>
    );

    return (
        <div className="app-shell">
            <header className="hero-header">
                <div className="hero-inner">
                    <div className="brand">
                        <div className="brand-mark">TG</div>
                        <div>
                            <p className="eyebrow">Каталог каналів</p>
                            <h1>Знаходьте Telegram-канали за кілька кліків</h1>
                        </div>
                    </div>

                    <div className="header-actions">
                        {adminToken ? (
                            <button onClick={() => setAdminToken(null)} className="ghost-btn">
                                {UNLOCK_ICON} Вийти з адмін-режиму
                            </button>
                        ) : (
                            <button onClick={() => setAdminToken('prompt')} className="primary-btn">
                                {LOCK_ICON} Увійти до адмін-панелі
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="content-area">
                {adminToken === 'prompt' ? (
                    AdminLogin()
                ) : adminToken ? (
                    <AdminArea adminToken={adminToken} />
                ) : (
                    <ChannelList />
                )}
            </main>
        </div>
    );
    
}

export default App;