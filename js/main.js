/* taspastore: deadline counter, maker cards from data/makers.json, category and price filters. */
(function () {
  "use strict";
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var nf = new Intl.NumberFormat("ru-RU");
  var months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }

  function setDeadline(iso) {
    var d = new Date(iso + "T23:59:59+05:00");
    var days = Math.ceil((d - new Date()) / 86400000);
    var label = d.getDate() + " " + months[d.getMonth()];
    $$("[data-deadline-text]").forEach(function (t) { t.textContent = label; });
    var n = $("[data-days]"), l = $("[data-days-label]");
    if (!n || !l) return;
    if (days > 0) {
      n.textContent = days;
      l.textContent = plural(days, "день", "дня", "дней") + " до последнего заказа";
    } else {
      n.textContent = "0";
      l.textContent = "Заказы к празднику закрыты. Мастера принимают заказы после праздников";
    }
  }

  /* #maker-<id> in the URL (links from ads and posts): scroll to that card once it exists and mark it */
  function focusHash() {
    var id = decodeURIComponent(location.hash || "").slice(1);
    if (!/^maker-/.test(id)) return;
    var li = document.getElementById(id);
    if (!li) return;
    li.classList.add("is-target");
    li.setAttribute("tabindex", "-1");
    li.scrollIntoView({ block: "center" });
    li.focus({ preventScroll: true });
  }

  function price(m) {
    if (m.priceFrom && m.priceTo && m.priceFrom !== m.priceTo) return nf.format(m.priceFrom) + "…" + nf.format(m.priceTo) + " ₸";
    if (m.priceFrom) return "от " + nf.format(m.priceFrom) + " ₸";
    return "Цена по запросу";
  }

  function btn(href, label, cls) {
    var a = document.createElement("a");
    a.className = "btn " + cls;
    a.href = href; a.target = "_blank"; a.rel = "noopener";
    a.textContent = label;
    return a;
  }

  function render(data) {
    var cats = {}; data.categories.forEach(function (c) { cats[c.id] = c.name; });
    var grid = $("[data-grid]"), tpl = $("#card");
    var makers = data.makers.filter(function (m) { return m.listed; });

    makers.forEach(function (m) {
      var li = tpl.content.firstElementChild.cloneNode(true);
      li.id = "maker-" + m.id;
      li.dataset.category = m.category;
      li.dataset.from = m.priceFrom || 0;
      li.dataset.to = m.priceTo || m.priceFrom || 0;
      var ph = $(".card-photo", li);
      if (m.photos && m.photos.length) {
        var img = document.createElement("img");
        img.src = m.photos[0]; img.alt = m.what + ", " + m.name; img.loading = "lazy"; img.width = 800; img.height = 1000;
        ph.appendChild(img);
      } else {
        ph.classList.add("no-photo");
        var mono = document.createElement("span"); mono.className = "mono"; mono.textContent = m.name; ph.appendChild(mono);
      }
      $(".card-cat", li).textContent = cats[m.category] || "";
      $(".card-name", li).textContent = m.name;
      $(".card-what", li).textContent = m.what;
      $(".m-materials", li).textContent = m.materials || "Уточняйте у мастера";
      $(".m-lead", li).textContent = m.leadTime || "Уточняйте у мастера";
      $(".card-price", li).textContent = price(m);
      var act = $(".card-actions", li);
      if (m.instagram) act.appendChild(btn("https://instagram.com/" + m.instagram, "Написать в Instagram", "btn-ink"));
      if (m.whatsapp) act.appendChild(btn("https://wa.me/" + m.whatsapp.replace(/\D/g, ""), "WhatsApp", "btn-line"));
      grid.appendChild(li);
    });

    /* invite slot: the guide is filling up, makers can apply */
    var inv = tpl.content.firstElementChild.cloneNode(true);
    inv.classList.add("card-invite");
    inv.dataset.category = "invite";
    var m2 = document.createElement("span"); m2.className = "mono"; m2.textContent = "Здесь может быть ваша мастерская";
    $(".card-photo", inv).appendChild(m2);
    $(".card-cat", inv).textContent = "Первый сезон гида";
    $(".card-name", inv).textContent = "Ищем мастеров";
    $(".card-what", inv).textContent = "Керамика, свечи, кожа, текстиль, принты. Ручная работа из Алматы, которую вы успеете сделать к празднику.";
    $(".card-meta", inv).remove();
    $(".card-price", inv).remove();
    var ja = document.createElement("a"); ja.className = "btn btn-line"; ja.href = "#join"; ja.textContent = "Как попасть в гид";
    $(".card-actions", inv).appendChild(ja);
    grid.appendChild(inv);

    /* category chips with counts, only categories that have makers plus "all" */
    var box = $('[data-filter="category"]');
    var counts = {}; makers.forEach(function (m) { counts[m.category] = (counts[m.category] || 0) + 1; });
    var mk = function (value, label, n, on) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.dataset.value = value; b.setAttribute("aria-pressed", on ? "true" : "false");
      b.textContent = label;
      if (n !== null) { var s = document.createElement("span"); s.className = "n"; s.textContent = n; b.appendChild(s); }
      box.appendChild(b);
    };
    mk("all", "Все", makers.length, true);
    data.categories.forEach(function (c) { if (counts[c.id]) mk(c.id, c.name, counts[c.id], false); });

    var state = { category: "all", price: "all" };
    var apply = function () {
      var shown = 0;
      $$(".card", grid).forEach(function (li) {
        if (li.dataset.category === "invite") return;
        var okC = state.category === "all" || li.dataset.category === state.category;
        var okP = true;
        if (state.price !== "all") {
          var r = state.price.split("-").map(Number), from = +li.dataset.from, to = +li.dataset.to;
          okP = from <= r[1] && to >= r[0];
        }
        li.hidden = !(okC && okP);
        if (!li.hidden) shown++;
      });
      $("[data-empty]").hidden = shown > 0;
    };
    $$("[data-filter]").forEach(function (group) {
      group.addEventListener("click", function (e) {
        var b = e.target.closest(".chip"); if (!b) return;
        $$(".chip", group).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        state[group.dataset.filter] = b.dataset.value;
        apply();
      });
    });
  }

  fetch("data/makers.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      setDeadline(data.orderDeadline);
      if (data.contactTelegram) $$("[data-tg]").forEach(function (a) { a.href = "https://t.me/" + data.contactTelegram; });
      render(data);
      focusHash();
    })
    .catch(function () {
      setDeadline("2026-12-15");
      var e = $("[data-empty]"); e.hidden = false;
      e.textContent = "Не удалось загрузить список мастеров. Обновите страницу.";
    });
})();
