<div align="center">

![Version](https://img.shields.io/badge/version-1.0.7-blue)
![Python](https://img.shields.io/badge/python-3.13+-green)
![React](https://img.shields.io/badge/react-19.2-61DAFB)
![License](https://img.shields.io/badge/license-MIT-blue)

# 🗺️ ГИС «КООРДИНАТОР»

**Модульная защищенная экосистема для оперативного взаимодействия, электронного документооборота и управления задачами**

</div>

---

## 📋 Оглавление

- [О проекте](#-о-проекте)
- [Ключевые возможности](#-ключевые-возможности)
- [Технологический стек](#-технологический-стек)
- [Архитектура](#-архитектура)
- [Быстрый старт](#-быстрый-старт)
- [Конфигурация](#-конфигурация)
- [Разработка](#-разработка)
- [Деплой](#-деплой)
- [Безопасность](#-безопасность)
- [Вклад](#-вклад)

---

## 🎯 О проекте

**ГИС «КООРДИНАТОР»** — это современная защищенная система, построенная на архитектуре модульного монолита. Она предназначена для оперативного взаимодействия в закрытых ведомственных сетях с поддержкой:

- 🔐 Защищенного обмена данными
- 📊 Автоматизации бизнес-процессов
- 📱 Кроссплатформенности (Web + Desktop)
- 🔄 Работы в автономном режиме

Система полностью локализована (русский/английский) и оптимизирована для работы в изолированных сетевых средах.

---

## ✨ Ключевые возможности

### 💬 Коммуникации
- **Защищенные чаты**: Личные и групповые каналы с WebSocket для мгновенной доставки
- **Реакции и треды**: Современные инструменты для структурированного обсуждения
- **Обмен файлами**: Передача документов с предпросмотром и валидацией
- **Онлайн-статус**: Отслеживание присутствия пользователей в реальном времени
- **Управление уведомлениями**: Браузер, звук, email — гибкая настройка

### 📂 Управление документами
- **Электронная доска**: Персональное и общее пространство для официальной корреспонденции
- **Ведомственный архив**: Иерархическое хранилище с Drag-and-Drop
- **Отправка документов**: Интеграция с чатами и архивом
- **Предпросмотр файлов**: PDF, DOCX, изображения, Excel

### 📋 Управление задачами
- **Постановка указаний**: Создание задач с исполнителями и сроками
- **Контроль исполнения**: Статусы (В работе, На проверке, Выполнено, Просрочено)
- **Отчетность**: Создание отчетов о выполнении
- **Возврат на доработку**: Циклический процесс контроля качества

### 📧 Email-клиент
- **Внутренняя почта**: Интеграция с SMTP сервером
- **Адресная книга**: Управление контактами
- **Папки и фильтры**: Организация почтового потока
- **Вложения**: Безопасная работа с файлами

### 🛠 Администрирование
- **Информативная панель**: Статистика активности, хранилища, здоровья системы
- **Управление пользователями**: Создание, редактирование, деактивация
- **Управление подразделениями**: Иерархическая структура организации
- **Журнал аудита**: Полная история действий пользователей
- **Мониторинг сессий**: Активные пользователи и длительность работы

### 📦 Специализированные модули
- **ZSSPD**: Работа с Заявками на предоставление услуг

### 💻 Desktop-приложение
- **Нативные уведомления**: Системные уведомления ОС
- **Горячие клавиши**: Глобальные сокращения
- **Автозапуск**: Интеграция с системой

---

## 🛠 Технологический стек

### Backend
```
Python 3.13+
├── FastAPI (Async)
├── SQLAlchemy 2.0 (Async ORM)
├── aiosqlite / aiomysql (Database Drivers)
├── python-jose (JWT Authentication)
├── passlib[bcrypt] (Password Hashing)
├── websockets (Real-time Communication)
├── aiosmtlpd / aiosmtpd (Email)
├── Redis (Optional - Caching & Pub/Sub)
├── Alembic (Database Migrations)
└── Celery (Optional - Background Tasks)
```

### Frontend
```
TypeScript + React 19
├── Vite (Build Tool)
├── Tailwind CSS v4 (Styling)
├── Zustand (State Management)
├── TanStack Query v5 (Server State)
├── React Router v7 (Routing)
├── Lucide React (Icons)
├── Recharts (Charts & Visualizations)
├── emoji-picker-react (Emoji Support)
├── DOMPurify (XSS Protection)
├── i18next (Internationalization)
└── Electron (Desktop Shell)
```

### Базы данных
- **SQLite** (по умолчанию) - идеально для деплоя в одну папку
- **MySQL** (поддерживается) - для масштабируемых инсталляций
- **PostgreSQL** (планируется)

---

## 🏗 Архитектура

Проект реализует архитектуру **Модульного монолита**, что обеспечивает баланс между простотой разработки и масштабируемостью.

```
┌─────────────────────────────────────────────────────────────┐
│                     DESKTOP (Electron)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   Native    │  │   Global    │  │   Local     │  │
│  │  Notifs     │  │  Hotkeys   │  │   Files     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
└─────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼──────────┐
│         │                  │                  │          │
│    ┌──▼───────────────────▼──────────────────▼──┐    │
│    │              FRONTEND (React 19)            │    │
│    │  ┌───────────────────────────────────────┐   │    │
│    │  │   Feature Modules                    │   │    │
│    │  │   ├── Auth (Login, Register)        │   │    │
│    │  │   ├── Chat (WebSocket UI)           │   │    │
│    │  │   ├── Email (SMTP Client)           │   │    │
│    │  │   ├── Tasks (Kanban/List)           │   │    │
│    │  │   ├── Board (Documents)             │   │    │
│    │  │   ├── Archive (File Storage)        │   │    │
│    │  │   ├── Admin (Dashboard)            │   │    │
│    │  │   └── ZSSPD (Custom Module)       │   │    │
│    │  └───────────────────────────────────────┘   │    │
│    │  ┌───────────────────────────────────────┐   │    │
│    │  │   Shared Layer                      │   │    │
│    │  │   ├── API Client (Axios)            │   │    │
│    │  │   ├── State (Zustand)              │   │    │
│    │  │   ├── Server State (TanStack Query)  │   │    │
│    │  │   ├── Design System (Tailwind)       │   │    │
│    │  │   └── Hooks & Utils               │   │    │
│    │  └───────────────────────────────────────┘   │    │
│    └───────────────────┬───────────────────────────┘    │
│                      │ HTTP/HTTPS + WebSocket          │
│    ┌───────────────────▼───────────────────────────┐    │
│    │              BACKEND (FastAPI)               │    │
│    │  ┌───────────────────────────────────────┐   │    │
│    │  │   Core Layer                        │   │    │
│    │  │   ├── Database (SQLAlchemy 2.0)      │   │    │
│    │  │   ├── Security (JWT, CSRF)           │   │    │
│    │  │   ├── WebSocket Manager               │   │    │
│    │  │   ├── File Security & Validation      │   │    │
│    │  │   ├── Rate Limiting                   │   │    │
│    │  │   ├── Error Handling                 │   │    │
│    │  │   └── Config Service                 │   │    │
│    │  └───────────────────────────────────────┘   │    │
│    │  ┌───────────────────────────────────────┐   │    │
│    │  │   Business Modules                   │   │    │
│    │  │   ├── Auth (Users, Units, Roles)     │   │    │
│    │  │   ├── Chat (Channels, Messages, WS)  │   │    │
│    │  │   ├── Email (Accounts, Messages)      │   │    │
│    │  │   ├── Tasks (Tasks, Reports)          │   │    │
│    │  │   ├── Board (Documents, Shares)      │   │    │
│    │  │   ├── Archive (Files, Folders)        │   │    │
│    │  │   ├── Admin (Audit, Stats)           │   │    │
│    │  │   └── ZSSPD (Packages, Logs)        │   │    │
│    │  └───────────────────────────────────────┘   │    │
│    └───────────────────┬───────────────────────────┘    │
│                       │                              │
└───────────────────────┼──────────────────────────────┘
                        │
            ┌───────────▼───────────┐
            │    Data Storage       │
            │  ┌───────────────┐   │
            │  │   SQLite     │   │
            │  │   MySQL      │   │
            │  │   (Optional) │   │
            │  └───────────────┘   │
            └───────────────────────┘
```

### Структура проекта

```
koordinator/
├── backend/                    # FastAPI сервер
│   ├── app/
│   │   ├── core/             # Общий функционал
│   │   │   ├── database.py   # SQLAlchemy async setup
│   │   │   ├── security.py   # JWT, password hashing
│   │   │   ├── websocket_manager.py
│   │   │   ├── errors.py
│   │   │   └── config.py    # Pydantic Settings
│   │   └── modules/          # Предметные модули
│   │       ├── auth/         # Аутентификация
│   │       ├── chat/         # Чаты и WebSocket
│   │       ├── email/        # Email клиент
│   │       ├── tasks/        # Задачи
│   │       ├── board/        # Доска документов
│   │       ├── archive/      # Ведомственный архив
│   │       ├── admin/        # Администрирование
│   │       └── zsspd/        # ZSSPD модуль
│   ├── migrations/           # Alembic миграции
│   ├── scripts/             # Утилиты и сиды
│   └── requirements.txt      # Python зависимости
│
├── frontend/                   # React приложение
│   ├── src/
│   │   ├── features/        # Фичи по модулям
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── email/
│   │   │   ├── tasks/
│   │   │   ├── board/
│   │   │   ├── archive/
│   │   │   ├── admin/
│   │   │   └── zsspd/
│   │   ├── design-system/    # UI компоненты
│   │   ├── api/             # API клиент
│   │   ├── hooks/           # Custom hooks
│   │   ├── store/           # Zustand stores
│   │   ├── utils/           # Утилиты
│   │   ├── i18n.ts          # i18next конфиг
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── electron/                   # Desktop обертка
│   └── main.cjs
│
├── docs/                      # Документация
│   ├── python-conventions.md
│   ├── typescript-conventions.md
│   ├── testing.md
│   ├── security.md
│   ├── project-structure.md
│   └── common-patterns.md
│
└── README.md
```

---

## 🚀 Быстрый старт

### Требования

- **Python**: 3.13+
- **Node.js**: 18+
- **npm**: 9+ или **yarn**: 1.22+

### Установка

1. **Клонируйте репозиторий**
   ```bash
   git clone https://github.com/tonojkeee/koordinator_app.git
   cd koordinator_app
   ```

2. **Backend настройка**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend настройка**
   ```bash
   cd frontend
   npm install
   ```

### Конфигурация

Создайте `.env` файл в `backend/`:

```env
# Application
DEBUG=False
SECRET_KEY=your-secret-key-min-32-chars-long

# Database (SQLite по умолчанию)
DATABASE_URL=sqlite+aiosqlite:///./teamchat.db

# Или MySQL для продакшена
# DATABASE_URL=mysql+aiomysql://user:password@localhost:3306/koordinator

# CORS (разделите запятыми)
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com

# Redis (опционально)
REDIS_URL=redis://localhost:6379

# Admin пользователя (при первом запуске)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-strong-password
```

### Запуск

**Backend** (порт 5100):
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 5100
```

**Frontend** (порт 5173):
```bash
cd frontend
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

### Миграции базы данных

```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

### Desktop-приложение (опционально)

```bash
cd frontend
npm run electron:dev
```

---

## ⚙️ Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию | Обязательно |
|------------|-----------|---------------|-------------|
| `SECRET_KEY` | JWT секретный ключ | - | ✅ Да |
| `DEBUG` | Режим отладки | `False` | Нет |
| `DATABASE_URL` | Строка подключения к БД | `sqlite+aiosqlite://` | Нет |
| `CORS_ORIGINS` | Разрешенные origins | - | ✅ В prod |
| `REDIS_URL` | Redis для кэширования | - | Нет |
| `ADMIN_USERNAME` | Логин админа | `admin` | Нет |
| `ADMIN_EMAIL` | Email админа | `admin@sentinel.com` | Нет |
| `ADMIN_PASSWORD` | Пароль админа | `admin` | Нет |

### Генерация секретных ключей

```bash
# SECRET_KEY (минимум 32 символа)
openssl rand -hex 32

# Для MySQL пароля
openssl rand -base64 32
```

---

## 🧪 Разработка

### Тестирование

**Backend:**
```bash
cd backend
# Все тесты
python -m pytest tests/ -v

# Один файл
python -m pytest tests/test_module.py -v

# Конкретный тест
python -m pytest tests/test_module.py::test_function_name -v

# С покрытием
python -m pytest --cov=app tests/
```

**Frontend:**
```bash
cd frontend
npm run lint
npx tsc --noEmit
```

### Код-стайл

**Python:**
```bash
cd backend
black app/ tests/
```

**TypeScript:**
```bash
cd frontend
npm run lint
```

### API документация

После запуска backend доступны:
- **Swagger UI**: http://localhost:5100/docs
- **ReDoc**: http://localhost:5100/redoc

---

## 📦 Деплой

### Backend (Production)

1. **Создайте файл .env** с настройками продакшена
2. **Установите зависимости**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Запустите миграции**:
   ```bash
   alembic upgrade head
   ```
4. **Запустите сервер** (с Gunicorn для продакшена):
   ```bash
   gunicorn app.main:app --workers 4 --bind 0.0.0.0:5100
   ```
   Или с uvicorn:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 5100 --workers 4
   ```

### Frontend (Production)

```bash
cd frontend
npm run build
```

Статические файлы будут в `frontend/dist/`. Разместите их на веб-сервере (Nginx/Apache).

### Desktop-приложение

```bash
cd frontend
npm run electron:build
```

Инсталляторы будут в `frontend/dist-electron/`:
- Windows: `.exe` (NSIS)
- Linux: `.AppImage`
- macOS: `.dmg`

---

## 🔒 Безопасность

### Реализованные меры

- ✅ **JWT Authentication** с refresh токенами
- ✅ **Password Hashing** (bcrypt)
- ✅ **CSRF Protection** на state-changing endpoints
- ✅ **Rate Limiting** для предотвращения DDoS
- ✅ **Input Validation** с Pydantic
- ✅ **XSS Protection** (DOMPurify на frontend)
- ✅ **File Upload Validation** (тип, размер, контент)
- ✅ **CORS Control** (запрет wildcard в prod)
- ✅ **Secret Rotation** (рекомендованный цикл 90 дней)
- ✅ **Audit Logging** всех действий

### Рекомендации

1. **Смена SECRET_KEY** минимум каждые 90 дней
2. **Используйте сильные пароли** (минимум 12 символов)
3. **Включите HTTPS** в продакшене
4. **Настройте CORS** только для нужных доменов
5. **Регулярно обновляйте зависимости**
6. **Используйте отдельную базу для каждого окружения**

### Уязвимости

Сообщайте об уязвимостях:
- Email: security@yourdomain.com
- Создайте issue с меткой `[security]`

---

## 📚 Документация

- [Python Conventions](docs/python-conventions.md) - Рекомендации по бэкенду
- [TypeScript Conventions](docs/typescript-conventions.md) - Рекомендации по фронтенду
- [Testing Guidelines](docs/testing.md) - Как писать тесты
- [Security Requirements](docs/security.md) - Требования к безопасности
- [Project Structure](docs/project-structure.md) - Организация кода
- [Common Patterns](docs/common-patterns.md) - Паттерны кода

---

## 🤝 Вклад

Мы рады вкладу! Пожалуйста:

1. **Форкните репозиторий**
2. **Создайте ветку** (`git checkout -b feature/amazing-feature`)
3. **Сделайте коммит** (`git commit -m 'Add amazing feature'`)
4. **Запушьте** (`git push origin feature/amazing-feature`)
5. **Создайте Pull Request**

### Code Style

Следуйте соглашениям, описанным в [AGENTS.md](AGENTS.md) и документации в `docs/`.

---

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE) для деталей

---

## 👥 Авторы

- **tonojkeee** - Основной разработчик

---

## 🙏 Благодарности

- [FastAPI](https://fastapi.tiangolo.com/) - Современный веб-фреймворк
- [React](https://react.dev/) - UI библиотека
- [Tailwind CSS](https://tailwindcss.com/) - Утилиты для стилей
- [Lucide](https://lucide.dev/) - Иконки

---

<div align="center">

**[⬆ Вернуться к оглавлению](#-оглавление)**

Made with ❤️ by [tonojkeee](https://github.com/tonojkeee)

</div>
