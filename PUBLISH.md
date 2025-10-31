# ИНСТРУКЦИЯ ПО ПУБЛИКАЦИИ

## Шаги для публикации на GitHub:

1. **Создайте новый репозиторий на GitHub:**
   - Перейдите на https://github.com/new
   - Название репозитория: `DocStripper`
   - Описание: "Batch document cleaner — удаляет мусор из текстовых документов"
   - Выберите Public
   - НЕ добавляйте README, .gitignore или лицензию (они уже есть)
   - Нажмите "Create repository"

2. **Подключите локальный репозиторий к GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/DocStripper.git
   git branch -M main
   git push -u origin main
   ```
   (Замените YOUR_USERNAME на ваш GitHub username)

3. **Создайте релиз v1.0.0:**
   - Перейдите в раздел Releases на GitHub
   - Нажмите "Create a new release"
   - Tag: `v1.0.0`
   - Release title: `DocStripper — Batch document cleaner`
   - Описание:
     ```
     ## DocStripper v1.0.0
     
     Первый релиз DocStripper — утилиты для массовой очистки текстовых документов.
     
     ### Основные возможности:
     - Удаление повторяющихся строк
     - Удаление номеров страниц
     - Удаление заголовков и подвалов
     - Удаление пустых строк
     - Поддержка .txt, .docx, .pdf файлов
     - Режим dry-run
     - Откат изменений
     
     ### Технические детали:
     - Python 3.9+
     - Только стандартная библиотека
     - Кросс-платформенная поддержка
     
     См. README.md для инструкций по установке и использованию.
     ```
   - Нажмите "Publish release"

4. **Проверьте, что всё работает:**
   ```bash
   python tool.py --help
   ```

## Структура проекта:

```
DocStripper/
├── tool.py              # Основной файл утилиты
├── README.md            # Документация с примерами
├── CHANGELOG.md         # История изменений
├── LICENSE.txt          # MIT License
├── SELF_TESTS.md        # Тестовые случаи
├── RELEASE_LEDGER.json  # Регистр релизов
├── .gitignore          # Git ignore файл
└── examples/
    └── before_after.txt # Демонстрация работы
```

## Проверка готовности:

✅ Все файлы созданы
✅ Git репозиторий инициализирован
✅ tool.py работает корректно
✅ README содержит 6 примеров использования
✅ Готово к публикации!

