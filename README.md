# taspastore

Новогодний гид подарков ручной работы от мастеров Алматы. Статичный сайт, без сборки.

- Сайт: https://softorture.github.io/taspastore/
- Мастера и настройки сезона: `data/makers.json` (поле `listed: true` показывает мастера на сайте, `photos` пути к фото в `img/makers/`)
- Срок последнего заказа: `orderDeadline`, счётчик дней на первом экране считает от него
- Гид не продаёт сам: кнопки ведут в Instagram или WhatsApp мастера
- Ссылка на карточку мастера для рекламы и постов: `https://softorture.github.io/taspastore/#maker-<id>`, где `id` из `data/makers.json` (пример: `#maker-brutalchain`). Страница сама прокрутит к карточке и подсветит её
- Служебные файлы: `robots.txt`, `sitemap.xml`, `404.html`

Мастер попадает в гид только с его согласия.
