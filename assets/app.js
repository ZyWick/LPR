$(document).ready(function() {
  var table = $('#plateLog').DataTable({
    responsive: true,
    fixedHeader: true,
    dom: 
      // Toolbar row: left filters + right search box
      "<'dt-toolbar'<'dt-filters'><'dt-search'f>>" +
      // Table body
      "tr" +
      // Info + Pagination row
      "<'dt-footer'<'dt-info'i><'dt-pagination'p>>" +
      // Buttons row (export, etc.)
      "B",
    buttons: ['copy', 'csv', 'excel', 'pdf',],
    initComplete: function() {
      var api = this.api();

      // Inject custom filter controls into the left side of toolbar
      var filterContainer = $('.dt-filters');

      filterContainer.append(
        '<label>Date: <input type="date" id="dateFilter"></label>'
      );
      filterContainer.append(
        '<label>Gate: ' +
          '<select id="gateFilter">' +
            '<option value="">All</option>' +
            '<option value="North Gate">North Gate</option>' +
            '<option value="South Gate">South Gate</option>' +
            '<option value="East Gate">East Gate</option>' +
          '</select>' +
        '</label>'
      );

      // Restrict global search to license plate column only
      $('#plateLog_filter input')
        .off()
        .on('keyup', function() {
          api.column(0).search(this.value).draw();
        });

      // Date filter
      $('#dateFilter').on('change', function() {
        var date = this.value;
        if (date) {
          api.column(1).search('^' + date + '$', true, false).draw();
        } else {
          api.column(1).search('').draw();
        }
      });

      // Gate filter
      $('#gateFilter').on('change', function() {
        var gate = this.value;
        if (gate) {
          api.column(3).search('^' + gate + '$', true, false).draw();
        } else {
          api.column(3).search('').draw();
        }
      });
    }
  });
});
