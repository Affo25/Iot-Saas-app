// Import jQuery and set it globally
import $ from 'jquery';
window.jQuery = $;
window.$ = $;

// Import DataTables and its extensions
import 'datatables.net-bs4/js/dataTables.bootstrap4.min.js';
import 'datatables.net-responsive/js/dataTables.responsive.min.js';
import 'datatables.net-responsive-bs4/js/responsive.bootstrap4.min.js';

// Import Bootstrap
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Import Nioapp
import '../vendors/nioapp/nioapp.min.js';

// Import Simplebar
import 'simplebar/dist/simplebar.min.js';

// Import Select2
import 'select2/dist/js/select2.full.min.js';

// Import SweetAlert2
import Swal from 'sweetalert2';

// Import Toastr
import toastr from 'toastr';

// Import jQuery Validation
import 'jquery-validation/dist/jquery.validate.min.js';

// Import Slick Carousel
import 'slick-carousel/slick/slick.min.js';

// Import ClipboardJS
import ClipboardJS from 'clipboard';

// Import Chart.js
import Chart from 'chart.js/auto';

// Import noUiSlider
import noUiSlider from 'nouislider';

// Import Dropzone
import Dropzone from 'dropzone';

// Import Bootstrap Datepicker
import 'bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js';

// Import jQuery Timepicker
import 'jquery-timepicker/jquery.timepicker.js';

// Import jQuery Knob
import '../vendors/knob/jquery.knob.min.js';

// Import Code Prettify
import '../vendors/prettify.js';

// Initialize libraries if needed
$(document).ready(function () {
  // Initialize Select2
  $('.select2').select2();

  // Initialize SweetAlert2
  window.Swal = Swal;

  // Initialize Toastr
  toastr.options = {
    closeButton: true,
    progressBar: true,
  };
  window.toastr = toastr;

  // Initialize ClipboardJS
  new ClipboardJS('.btn-clipboard');

  // Initialize DataTables
  $('.data-table').DataTable();

  // Initialize Dropzone
  Dropzone.autoDiscover = false;
  new Dropzone('#my-dropzone', {
    // Dropzone options
  });

  // Initialize Datepicker
  $('.datepicker').datepicker();

  // Initialize Timepicker
  $('.timepicker').timepicker();

  // Initialize jQuery Knob
  $('.knob').knob();

  // Initialize Code Prettify
  PR.prettyPrint();
});