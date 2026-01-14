<div align="center">
<h1>🛡️ School CyberShield</h1>
<p>Автоматизированная система аудита информационной безопасности для образовательных учреждений</p>

![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/Python-3.8+-green)
![Node.js](https://img.shields.io/badge/Node.js-16+-blue)
![React](https://img.shields.io/badge/React-19+-61DAFB)
</div>

## 📋 Описание

**School CyberShield** — это полнофункциональная система для аудита безопасности школьных сетей. Она объединяет веб-интерфейс на React с локальным Python-агентом для сбора данных о безопасности и анализом через Google Gemini API.

### Основные возможности

✅ **Сетевое сканирование** — Обнаружение устройств в локальной сети через ARP-пакеты  
✅ **Определение производителей** — Идентификация устройств по MAC-адресам (OUI базе)  
✅ **Мониторинг системы** — Real-time мониторинг CPU, RAM, Disk, температуры  
✅ **Статус безопасности** — Проверка Firewall и Antivirus  
✅ **AI Анализ** — Анализ уязвимостей через Google Gemini  
✅ **Визуализация** — Профессиональный dashboard с графиками и индикаторами  
✅ **Сетевая нагрузка** — Мониторинг входящего/исходящего трафика  

## 🏗️ Архитектура

```
┌─────────────────────┐         ┌──────────────────────┐
│   React Frontend    │◄─────►  │  Python Flask Agent  │
│   (Port 5173)       │  HTTP   │   (Port 5000)        │
│                     │  CORS   │                      │
└─────────────────────┘         └──────────────────────┘
        │                               │
        │                    ┌──────────┼──────────┐
        │                    │          │          │
        │              ┌─────▼──┐  ┌───▼───┐  ┌──▼────┐
        │              │  ARP   │  │ psutil│  │ OS    │
        │              │Scanner │  │Monitor│  │Status │
        │              └────────┘  └───────┘  └───────┘
        │
    ┌───▼─────────────┐
    │  Google Gemini  │
    │  (AI Analysis)  │
    └─────────────────┘
```

## 🚀 Быстрый старт

### 1. Требования

- **Python** 3.8+
- **Node.js** 16+
- **Administrator rights** (для ARP сканирования на Windows)

### 2. Установка и запуск

#### Windows (Easiest)
```bash
# В директории проекта
start.bat
```

#### Linux / Mac
```bash
chmod +x start.sh
./start.sh
```

#### Ручной запуск

**Terminal 1 - Python Backend:**
```bash
pip install -r requirements.txt
python agent.py
```

**Terminal 2 - React Frontend:**
```bash
npm install
npm run dev
```

Откройте http://localhost:5173 в браузере.

## 📦 Стек технологий

### Frontend
- **React 19** — UI фреймворк
- **TypeScript** — Типизированный JavaScript
- **Tailwind CSS** — Утилит-первый CSS фреймворк
- **Recharts** — Графики и диаграммы
- **Lucide React** — SVG иконки
- **Vite** — Быстрый сборщик

### Backend
- **Flask** — Микрофреймворк Python
- **Flask-CORS** — CORS поддержка
- **Scapy** — Обработка сетевых пакетов (ARP)
- **psutil** — Системный мониторинг
- **Python 3.8+** — Основной язык

### AI Integration
- **Google Gemini API** — Анализ уязвимостей
- **gemini-3-pro-preview** — Основная модель
- **gemini-3-flash-preview** — Быстрая модель

## 🔌 API Endpoints

### System Statistics
```
GET /api/system
```
Возвращает метрики системы: CPU, RAM, Disk, Temperature, Firewall, AV статус

### Network Scan
```
GET/POST /api/scan
```
Выполняет ARP сканирование локальной сети, определяет производителей

### Health Check
```
GET /api/health
```
Проверяет доступность агента

## 📊 Компоненты

| Компонент | Описание |
|-----------|---------|
| **Dashboard** | Главная страница с метриками, графиками активности и нагрузкой на сеть |
| **NetworkScanner** | Список обнаруженных устройств с IP, MAC, производителем |
| **DeviceMonitor** | Мониторинг CPU/RAM/Disk с индикаторами сетевой нагрузки |
| **VulnerabilityReport** | AI-анализ уязвимостей с рекомендациями |
| **WifiAnalyzer** | Анализ беспроводных сетей |

## 🔐 Особенности безопасности

✅ **Безопасное сканирование** — Использует только ARP, без агрессивных методов  
✅ **CORS изолировано** — Коммуникация ограничена localhost  
✅ **Локальное хранение** — Все данные остаются внутри сети  
✅ **Школьный контекст** — Рекомендации учитывают образовательную среду  

## 📁 Структура проекта

```
school-cybershield/
├── agent.py                 # Flask backend агент
├── requirements.txt         # Python зависимости
├── start.bat               # Windows скрипт запуска
├── start.sh                # Linux/Mac скрипт запуска
├── index.html              # HTML точка входа
├── index.tsx               # React приложение
├── App.tsx                 # Главный компонент
├── types.ts                # TypeScript типы
├── vite.config.ts          # Vite конфигурация
├── tsconfig.json           # TypeScript конфигурация
├── package.json            # Node.js зависимости
├── components/
│   ├── Dashboard.tsx       # Главный дашборд
│   ├── NetworkScanner.tsx  # Сканер сети
│   ├── DeviceMonitor.tsx   # Монитор устройств
│   ├── VulnerabilityReport.tsx  # Отчет об уязвимостях
│   └── WifiAnalyzer.tsx    # Анализатор Wi-Fi
├── services/
│   └── geminiService.ts    # Google Gemini интеграция
├── INSTALL.md              # Подробная инструкция
└── README.md               # Этот файл
```

## ⚙️ Конфигурация

### Google Gemini API

Для использования AI анализа, установите переменную окружения:

```bash
# Windows PowerShell
$env:API_KEY = "your-api-key"

# Windows CMD
set API_KEY=your-api-key

# Linux/Mac
export API_KEY=your-api-key
```

Получить ключ: https://ai.google.dev

### Порты

- Frontend: `5173` (по умолчанию, может отличаться в Vite)
- Backend: `5000` (настраивается в `agent.py`)

## 🐛 Решение проблем

### Port уже в использовании
```bash
# Найти процесс
netstat -ano | findstr :5000

# Завершить процесс
taskkill /PID <PID> /F
```

### ARP сканирование не работает
- Запустите от администратора (Windows)
- На Ubuntu/Linux может потребоваться: `sudo python agent.py`

### Нет данных от агента
- Проверьте, что оба сервиса запущены
- Проверьте консоль браузера на ошибки CORS
- Убедитесь в локальном подключении 127.0.0.1

## 📝 Лицензия

MIT License - свободен для образовательного и коммерческого использования

## 👨‍💻 Разработка

Внесение вклада приветствуется! Пожалуйста:

1. Fork репозиторий
2. Создайте feature branch
3. Commit изменений
4. Push в branch
5. Откройте Pull Request

## 📞 Поддержка

Для вопросов и проблем используйте Issues на GitHub.

---

<div align="center">
<strong>School CyberShield - Защита сетей образовательных учреждений</strong>

Made with ❤️ for cybersecurity in schools
</div>
