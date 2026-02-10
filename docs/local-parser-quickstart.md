# Локальный парсер YouTube для MyTube (быстрый старт)

Если нужен импорт по кнопке «Импорт по URL» с просмотрами, лайками и первыми 100 комментариями, используйте локальный сервер из этого репозитория.

## 1) Запуск

```bash
node tools/local-youtube-parser.js
```

По умолчанию поднимется адрес:
- `http://127.0.0.1:8787/health`
- `http://127.0.0.1:8787/youtube?url=...`

## 2) Подключение к MyTube

Ничего дополнительно настраивать не нужно: в приложении по умолчанию уже используется локальный endpoint `http://127.0.0.1:8787/youtube`.

Если хотите другой адрес/порт, откройте **Профиль** и укажите свой URL парсера.

## 3) Что парсер возвращает

JSON формата:

```json
{
  "sourceVideoId": "...",
  "title": "...",
  "channelName": "...",
  "thumbnail": "...",
  "stats": {
    "views": 123,
    "likes": 456,
    "dislikes": null,
    "comments": 100
  },
  "comments": [
    {
      "id": "...",
      "author": "Никнейм",
      "text": "Текст комментария",
      "likes": 42,
      "dislikes": 0,
      "replyCount": 2,
      "replies": [],
      "order": 0
    }
  ],
  "meta": {
    "parser": "youtube-data-api-v3",
    "commentsLimit": 100
  }
}
```

## 4) Важно

- Это **локальный** сервер (запущен на вашем ПК), запросы идут через ваш компьютер.
- По умолчанию парсер использует встроенный API key для YouTube Data API v3.
- При необходимости ключ можно переопределить через переменную окружения.
- Если API временно недоступен, сервер попробует fallback-парсинг HTML страницы видео.

## 5) Переменные окружения (опционально)

- `MYTUBE_PARSER_HOST` (по умолчанию `127.0.0.1`)
- `MYTUBE_PARSER_PORT` (по умолчанию `8787`)
- `MYTUBE_YOUTUBE_API_KEY` (ключ YouTube Data API v3)

Пример:

```bash
MYTUBE_PARSER_PORT=8899 MYTUBE_YOUTUBE_API_KEY=your_key node tools/local-youtube-parser.js
```
