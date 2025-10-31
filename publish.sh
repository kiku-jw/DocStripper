#!/bin/bash
# Скрипт для публикации DocStripper на GitHub

echo "🚀 DocStripper - Скрипт публикации"
echo "=================================="
echo ""

# Проверка Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Ошибка: Git репозиторий не инициализирован"
    exit 1
fi

echo "✅ Git репозиторий найден"
echo ""

# Проверка наличия remote
if git remote get-url origin > /dev/null 2>&1; then
    REMOTE_URL=$(git remote get-url origin)
    echo "📦 Удаленный репозиторий уже настроен: $REMOTE_URL"
    echo ""
    read -p "Хотите добавить новый remote? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Пропускаем настройку remote..."
    else
        git remote remove origin
    fi
fi

# Получение данных от пользователя
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "Введите данные для подключения к GitHub:"
    read -p "GitHub username: " GITHUB_USERNAME
    read -p "Название репозитория [DocStripper]: " REPO_NAME
    REPO_NAME=${REPO_NAME:-DocStripper}
    
    echo ""
    echo "Выберите метод подключения:"
    echo "1) HTTPS (рекомендуется)"
    echo "2) SSH"
    read -p "Выбор [1]: " METHOD
    METHOD=${METHOD:-1}
    
    if [ "$METHOD" = "1" ]; then
        REMOTE_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    else
        REMOTE_URL="git@github.com:$GITHUB_USERNAME/$REPO_NAME.git"
    fi
    
    echo ""
    echo "Добавляем remote: $REMOTE_URL"
    git remote add origin "$REMOTE_URL"
fi

# Переименование ветки в main если нужно
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "Переименовываем ветку $CURRENT_BRANCH в main..."
    git branch -M main
fi

# Проверка статуса
echo ""
echo "📊 Текущий статус:"
git status --short

echo ""
echo "Готовы к публикации? Будут выполнены следующие команды:"
echo "  git push -u origin main"
echo ""
read -p "Продолжить? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Отправляем код на GitHub..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Успешно опубликовано!"
        echo ""
        REMOTE_URL=$(git remote get-url origin)
        REPO_URL=$(echo "$REMOTE_URL" | sed 's/\.git$//')
        echo "🔗 Откройте репозиторий: $REPO_URL"
        echo ""
        echo "Следующий шаг: создайте релиз v1.0.0 на GitHub"
        echo "  Перейдите: $REPO_URL/releases/new"
    else
        echo ""
        echo "❌ Ошибка при публикации. Проверьте настройки и попробуйте снова."
        exit 1
    fi
else
    echo "Отменено."
fi

