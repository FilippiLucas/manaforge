const $ = window.$;

// Function to attach modal functionality
export function attachModalFunctionality() {
    const $modal = $('#modal');

    // Escape closes overlays
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') closeAllCards();
    });

    // Click anywhere outside cards → close all overlays
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.card').length) {
            closeAllCards();
        }
    });

    // Card click toggles overlay only (do NOT auto-open modal)
    $('.card').each(function () {
        const $card = $(this);
        const $checkbox = $card.find('input[type="checkbox"]');
        if ($checkbox.length === 0) return;

        $card.on('click', function (e) {
            if ($(e.target).closest('.action').length) return; // ignore button clicks
            const wasChecked = $checkbox.prop('checked');
            closeAllCards();
            $checkbox.prop('checked', !wasChecked);
            e.stopPropagation();
        });
    });
}

// Close all card overlays
function closeAllCards() {
    $('.card input[type="checkbox"]').prop('checked', false);
}
