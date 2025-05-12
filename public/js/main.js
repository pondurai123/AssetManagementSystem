document.addEventListener('DOMContentLoaded', function() {
    // Initialize any tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    });
  
    // Handle confirmation dialogs
    document.querySelectorAll('.confirm-action').forEach(button => {
      button.addEventListener('click', function(e) {
        if (!confirm(this.dataset.confirmMessage || 'Are you sure you want to perform this action?')) {
          e.preventDefault();
          return false;
        }
      });
    });

    const assetSelect = document.getElementById('assetId');
    if (assetSelect) {
      assetSelect.addEventListener('change', function() {
        // You could implement AJAX to fetch asset details here
        console.log('Asset selected:', this.value);
      });
    }
  
    // Format currency inputs
    document.querySelectorAll('input[type="number"][step="0.01"]').forEach(input => {
      input.addEventListener('blur', function() {
        if (this.value) {
          this.value = parseFloat(this.value).toFixed(2);
        }
      });
    });
  });