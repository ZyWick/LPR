$(function () {
  const $table = $('#plateLog');
  const $dateFilter = $('#dateFilter');
  const $gateFilter = $('#gateFilter');

  // Utility: debounce
  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  const table = $table.DataTable({
    processing: true,
    serverSide: true,
    pageLength: 25,
    order: [],
    ajax: {
      url: "/logs",
      type: "POST",
      data: d => { 
        d.date = $('#dateFilter').val(); 
        d.gate = $('#gateFilter').val(); 
      }
    },
    columns: [
      { data: "entry_display", className: "dt-left" },
      { data: "license_plate", className: "dt-left editable" },
      { data: "gate_entry", className: "dt-left editable" },
      {
        data: "image_link",
        render: data =>
          data
            ? `<div class="view-cell" data-src="${data}">
                 <img src="/static/img/eye.svg" alt="View" />
               </div>`
            : "",
        className: "dt-center",
        orderable: false
      }
    ],
    dom:
      "<'dt-toolbar'<'dt-filters'><'dt-search'f>>" +
      "tr" +
      "<'dt-footer'<'dt-info'i><'dt-pagination'p>>",
    initComplete: function () {
      const $filterContainer = $('.dt-filters');
      $filterContainer.append(`
        <label>Date: <input type="date" id="dateFilter"></label>
      `);
      $filterContainer.append(`
        <label>Gate:
          <select id="gateFilter">
            <option value="">All</option>
            <option value="Gate 1">Gate 1</option>
            <option value="Gate 2">Gate 2</option>
            <option value="Gate 3">Gate 3</option>
          </select>
        </label>
      `);

      $('.dt-search input').attr('placeholder', 'Search plate no.');

      // Reload on filter change
      $(document).on('change', '#dateFilter, #gateFilter', () => table.ajax.reload());

      // Debounced search
      const debouncedSearch = debounce(() => table.ajax.reload(), 800);
      $(document).on('keyup', '#plateLog_filter input', debouncedSearch);

      // Inline editing
      $table.on('click', 'td.editable', function () {
        const cell = table.cell(this);
        const originalValue = cell.data();
        if ($(this).find('input, select').length > 0) return; // already editing

        const columnName = table.column(cell.index().column).dataSrc();
        let $input;

        if (columnName === 'gate_entry') {
          $input = $(`
            <select class="inline-editor">
              <option value="Gate 1">Gate 1</option>
              <option value="Gate 2">Gate 2</option>
              <option value="Gate 3">Gate 3</option>
            </select>
          `).val(originalValue);
        } else {
          $input = $(`<input type="text" class="inline-editor">`).val(originalValue);
        }

        $(this).html($input);
        $input.trigger('focus');

        $input.on('blur keyup', function (e) {
          if (e.type === 'blur' || e.key === 'Enter') {
            const newValue = $input.val();
            if (newValue === originalValue) {
              cell.data(originalValue).draw();
              return;
            }

            $input.prop('disabled', true); // prevent multiple submits
            $.post('/update-log', {
              id: table.row(cell.index().row).data().id,
              field: columnName,
              value: newValue
            })
              .done(() => cell.data(newValue).draw())
              .fail(() => {
                alert('Update failed!');
                cell.data(originalValue).draw();
              });
          }
        });
      });

      $table.on('click', '.view-cell', function () {
        const src = $(this).data('src');
        $('#modalImg').attr('src', src);
        $('#imgModal').addClass('show').attr('aria-hidden', 'false');
      });

      $('#imgModal').on('click', function () {
        $(this).removeClass('show').attr('aria-hidden', 'true');
      });

      $('#imgModal img').on('click', function (e) {
        e.stopPropagation(); // prevent closing when clicking the image
      });

    }
  });
});
