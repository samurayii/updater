# Updater

## Информация.

Программа для сбора локальной версии docker сервисов и переноса на другую машину.

## Установка и использование.

Updater это программа написанная на nodejs версии 8 или выше. Работает на ОС linux и Windows 7 или выше.

установка: `npm install updater -g`

### Таблица ключей запуска:
Ключ | Режим |Описание
--- | --- | ---
--version | | Вывести номер версии приложения
--help | | Вызвать справку по ключам запуска
--config | | Включить режим настройки
--prepare | | Включить режим подготовки
--check | | Включить режим проверки
--unpack | | Включить режим распаковки
--update | | Включить режим обновления
--package | все режимы | имя версии
--show | режим настройки | Показать текущие  настройки
--packages | режим настройки | Путь к папке с версиями
--env | режим настройки | Путь к файлу переменных
--mode | режим настройки | Режим настроек (socket|windows|tcp)
--version | режим настройки | Версия docker (v1.38)
--wport | режим настройки | Порт для настройки ОС windows
--spath | режим настройки | Путь к сокету для настройки socket
--tport | режим настройки | Порт для настройки tcp
--tprotocol | режим настройки | Протокол для настройки tcp
--thost | режим настройки | Хост для настройки tcp
--tca | режим настройки | CA для настройки tcp
--tcert | режим настройки | CERT для настройки tcp
--tkey | режим настройки | KEY для настройки tcp

### Файлы обновлений.

Updater использует папку для обновлений заданную в ключе настроек `packages`, каждая подпапка воспринимается как отдельное обновление.
Каждое обновление должно содержать файл схемы обновления `version.json` и tar файлы каждого образа необходимого для данного обновления.
Подготовить обновление можно командой `prepare`, также при обновлении используется файл `env.json` c переменными которые можно использовать в файле `version.json` указав имя переменой в скобках `{{}}`.

#### Пример version.json:
```js
{
    "services": [       // массив сервисов
        {
            "Domainname": "demo-service1",      // доменное имя внутри сети docker (обязательное поле)
            "Name": "demo-service1",            // Имя сервиса (обязательное поле)
            "Image": "demo-service1:0.0.1",     // образ для сервиса (обязательное поле)
            "Hostname": "demo-service1",        // Имя хоста (обязательное поле)
            "Env": [
                "URL={{service1_target}}",
                "SERVICE={{service1_name}}"
            ]
        },
        {
            "Domainname": "demo-service2",
            "Name": "demo-service2",
            "Image": "demo-service2:0.0.1",
            "Hostname": "demo-service2",
            "Env": [
                "URL={{service2_target}}",
                "SERVICE={{service2_name}}"
            ]
        }
    ]
}
```

#### Пример env.json:
```js
{
    "service1_name": "service1",
    "service1_target": "http://demo-service2:3000/",
    "service2_name": "service2",
    "service2_target": "http://demo-service1:3000/"
}
```


### Примеры приминения.

подготовка обновления: `updater --prepare --packages .\secret\packages --package v1`
проверка обновления: `updater --check --packages .\secret\packages --package v1`
распаковка обновления: `updater --unpack --packages .\secret\packages --package v1`
запуск обновления: `updater --update --packages .\secret\packages --package v1`