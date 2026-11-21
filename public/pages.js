/* Shared behaviour for the Work content: each paper row opens and closes its abstract and links.
   Used by work.html on its own and by the landing page, where the same list hangs on the left wall. */
(function () {
  function setOpen(li, open) {
    var btn = li.querySelector('.pg-row'), panel = li.querySelector('.pg-panel');
    li.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
  }
  function wire(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('.pg-paper'), function (li) {
      if (li.dataset.wired) return;
      li.dataset.wired = '1';
      li.querySelector('.pg-row').addEventListener('click', function () { setOpen(li, !li.classList.contains('open')); });
    });
  }
  window.pgPapers = { wire: wire, setOpen: setOpen };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { wire(); });
  else wire();
})();
