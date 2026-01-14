@echo off
REM Скрипт установки CyberShield клиента на удалённый ПК
REM Использование: setup_client_ru.bat <IP_центрального_сервера>
REM Пример: setup_client_ru.bat 192.168.1.100

setlocal enabledelayedexpansion

echo.
echo ====================================
echo   Установка CyberShield клиента
echo ====================================
echo.

REM Проверка параметра IP сервера
if "%1"=="" (
    echo Использование: setup_client_ru.bat ^<IP_сервера^>
    echo.
    echo Пример: setup_client_ru.bat 192.168.1.100
    echo.
    pause
    exit /b 1
)

set SERVER_IP=%1
set SERVER_URL=http://%SERVER_IP%:5000

echo Настройка для сервера: %SERVER_URL%
echo.

REM Проверка наличия Python
echo Проверка наличия Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: Python не установлен или отсутствует в PATH
    echo Пожалуйста, установите Python 3.8+ с сайта python.org
    pause
    exit /b 1
)

echo Python найден.
echo.

REM Установка требуемых пакетов
echo Установка необходимых пакетов Python...
pip install requests psutil --quiet

if errorlevel 1 (
    echo ВНИМАНИЕ: Некоторые пакеты не установились
    echo Пожалуйста, убедитесь, что pip работает правильно
)

echo.

REM Создание файла конфигурации
echo Создание файла конфигурации...
(
    echo # Конфигурация CyberShield клиента
    echo SERVER_URL=%SERVER_URL%
    echo UPDATE_INTERVAL=5
) > cybershield_client.conf

echo Конфигурация сохранена в: cybershield_client.conf
echo.

REM Создание скрипта запуска
echo Создание скрипта запуска...
(
    echo @echo off
    echo cd /d "%%~dp0"
    echo python agent_client.py %SERVER_URL%
    echo pause
) > start_client.bat

echo Скрипт запуска создан: start_client.bat
echo.

REM Предложение создать Windows задачу
echo.
echo Опционально: Хотите создать Windows задачу для автозапуска?
echo (Требуются права администратора)
echo.
set /p CREATE_TASK="Создать задачу? (y/n): "

if /i "%CREATE_TASK%"=="y" (
    echo Создание Windows задачи...
    
    REM Получить полный путь к скрипту запуска
    set SCRIPT_PATH=%cd%\start_client.bat
    
    REM Создать задачу (требует админ)
    taskkill /f /im pythonw.exe /fi "WINDOWTITLE eq CyberShield*" >nul 2>&1
    
    echo Создание запланированной задачи...
    powershell -Command "Start-Process powershell -ArgumentList 'schtasks /create /tn CyberShieldClient /tr \"!SCRIPT_PATH!\" /sc onstart /rl highest /f' -Verb RunAs -Wait" >nul 2>&1
    
    if errorlevel 0 (
        echo Задача создана успешно. Клиент будет запускаться автоматически при загрузке.
    ) else (
        echo Не удалось создать задачу. Вы можете запустить start_client.bat вручную.
    )
) else (
    echo Создание задачи пропущено.
)

echo.
echo ====================================
echo   Установка завершена!
echo ====================================
echo.
echo Для запуска клиента вручную используйте:
echo   start_client.bat
echo.
echo Клиент будет подключаться к: %SERVER_URL%
echo.
echo Нажмите любую клавишу для выхода...
pause >nul
