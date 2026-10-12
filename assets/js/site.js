(function () {
  "use strict";

  // Меню на телефоне
  var burger = document.querySelector(".burger");
  var nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Новости на приколотом листке
  document.querySelectorAll("[data-slider]").forEach(function (box) {
    var slides = box.querySelectorAll("[data-slide]");
    var dots = box.querySelectorAll("[data-dot]");
    var current = 0;
    var timer = null;
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function show(n) {
      current = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var on = i === current;
        s.classList.toggle("is-on", on);
        if (on) {
          s.removeAttribute("tabindex");
          s.removeAttribute("aria-hidden");
        } else {
          s.setAttribute("tabindex", "-1");
          s.setAttribute("aria-hidden", "true");
        }
      });
      dots.forEach(function (d, i) {
        if (i === current) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
    }
    function stop() {
      clearInterval(timer);
      timer = null;
    }
    function play() {
      if (still || timer || slides.length < 2) return;
      timer = setInterval(function () {
        show(current + 1);
      }, 5000);
    }
    dots.forEach(function (d) {
      d.addEventListener("click", function () {
        stop();
        show(Number(d.getAttribute("data-dot")));
        play();
      });
    });
    box.addEventListener("mouseenter", stop);
    box.addEventListener("mouseleave", play);
    box.addEventListener("focusin", stop);
    box.addEventListener("focusout", play);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else play();
    });
    play();
  });

  // Переход с новости на главной раскрывает нужное событие
  function openTarget() {
    var el = location.hash && document.getElementById(location.hash.slice(1));
    var d = el && el.querySelector("details");
    if (d) d.open = true;
  }
  window.addEventListener("hashchange", openTarget);
  openTarget();

  // Отсчёт до поста
  document.querySelectorAll("[data-countdown]").forEach(function (box) {
    var target = new Date(box.getAttribute("data-countdown")).getTime();
    var cells = {};
    box.querySelectorAll("[data-unit]").forEach(function (c) {
      cells[c.getAttribute("data-unit")] = c;
    });
    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }
    function tick() {
      var left = Math.max(0, target - Date.now());
      var s = Math.floor(left / 1000);
      cells.d.textContent = pad(Math.floor(s / 86400));
      cells.h.textContent = pad(Math.floor((s % 86400) / 3600));
      cells.m.textContent = pad(Math.floor((s % 3600) / 60));
      cells.s.textContent = pad(s % 60);
      if (left === 0) {
        var h = box.querySelector("h2");
        if (h) h.textContent = box.getAttribute("data-live");
        clearInterval(timer);
      }
    }
    var timer = setInterval(tick, 1000);
    tick();
  });

  // Молитвенная карта: отметка сохраняется в браузере посетителя
  var form = document.querySelector("[data-join]");
  var map = document.querySelector("[data-map]");
  if (form && map) {
    var dims = map.getAttribute("data-map").split(",").map(Number);
    var layer = map.querySelector("[data-mine]");
    var msg = form.querySelector(".join-msg");
    var KEY = "prayercall-join";

    function place(lat, lon, label) {
      var x = ((lon + 180) / 360) * dims[0];
      var y = ((dims[2] - lat) / (dims[2] - dims[3])) * dims[1];
      var ns = "http://www.w3.org/2000/svg";
      var c = document.createElementNS(ns, "circle");
      c.setAttribute("class", "pin");
      c.setAttribute("cx", x.toFixed(1));
      c.setAttribute("cy", y.toFixed(1));
      c.setAttribute("r", "8");
      var t = document.createElementNS(ns, "title");
      t.textContent = label;
      c.appendChild(t);
      layer.textContent = "";
      layer.appendChild(c);
    }
    function restore() {
      try {
        var saved = JSON.parse(localStorage.getItem(KEY) || "null");
        if (saved) {
          place(saved.lat, saved.lon, saved.label);
          msg.textContent = msg.getAttribute("data-done") + " " + saved.label;
        }
      } catch (e) {}
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var select = form.elements.country;
      if (!select.value) {
        msg.textContent = msg.getAttribute("data-need");
        select.focus();
        return;
      }
      var parts = select.value.split(",").map(Number);
      var city = form.elements.city.value.trim();
      var country = select.options[select.selectedIndex].text;
      var label = city ? city + ", " + country : country;
      place(parts[0], parts[1], label);
      msg.textContent = msg.getAttribute("data-done") + " " + label;
      try {
        localStorage.setItem(KEY, JSON.stringify({ lat: parts[0], lon: parts[1], label: label }));
      } catch (err) {}
    });
    restore();
  }
})();
