# Transfornation - Краудфандинговая Платформа

Современная краудфандинговая платформа с PostgreSQL и Netlify Functions.

## 🚀 Технологии

- **Frontend**: React + TypeScript + Vite
- **Backend**: Netlify Functions (Serverless)
- **Database**: PostgreSQL
- **Deployment**: Netlify

## 📦 Установка

```bash
npm install
```

## 🗄️ База данных

### Настройка PostgreSQL

1. Создайте PostgreSQL базу данных (например, на Railway.app)
2. Запустите миграции:

```bash
node scripts/migrate.js
```

3. Импортируйте данные из CSV:

```bash
node scripts/importCSV.js
```

### Переменные окружения для Netlify

Добавьте в Netlify Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:port/database
```

## 🎯 Разработка

```bash
npm run dev
```

## 🌐 Деплой на Netlify

1. Подключите репозиторий к Netlify
2. Добавьте переменную окружения `DATABASE_URL`
3. Netlify автоматически соберёт и задеплоит приложение

### Netlify Functions

API автоматически доступен по адресу:
- `GET /api/projects` - Получить все проекты
- `GET /api/projects/:id` - Получить проект по ID
- `POST /api/projects` - Создать проект

## 📁 Структура проекта

```
├── components/          # React компоненты
├── services/           # API сервисы
├── netlify/
│   └── functions/      # Serverless функции
├── scripts/            # Миграции и импорт данных
└── types.ts            # TypeScript типы
```

## 🔧 Скрипты

- `npm run dev` - Запуск dev сервера
- `npm run build` - Сборка для production
- `npm run preview` - Предпросмотр production сборки
- `node scripts/migrate.js` - Запуск миграций БД
- `node scripts/importCSV.js` - Импорт данных из CSV

## 📝 Лицензия

MIT
