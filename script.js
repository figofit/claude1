document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.toggle("is-open");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { links.classList.remove("is-open"); });
    });
  }

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var form = document.getElementById("poptavkaForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      // TODO: napojit na skutečné odeslání (e-mail / Formspree / vlastní backend).
      form.innerHTML = "<p style=\"color:#2f7a4d;font-weight:600;\">Děkujeme! Ozveme se vám do 24 hodin.</p>";
    });
  }
});
