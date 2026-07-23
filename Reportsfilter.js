/* =====================================================================
   REPORTS FILTER — clicking a chip shows only cards whose
   data-category matches; "All Reports" shows everything.
   The existing "View all reports" button/popup is untouched —
   this only filters the 3 cards already visible in the section.
   ===================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  var row = document.getElementById('reports-filter-row');
  var grid = document.getElementById('reports-grid');
  if (!row || !grid) return;

  var chips = Array.prototype.slice.call(row.querySelectorAll('.filter-chip'));
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');

      var filter = chip.getAttribute('data-filter');
      cards.forEach(function (card) {
        var match = filter === 'all' || card.getAttribute('data-category') === filter;
        card.style.display = match ? '' : 'none';
      });
    });
  });
});