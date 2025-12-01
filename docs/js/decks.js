const $ = window.$;

import { getDecks, createDeck } from './decks_storage.js';

const GRID_ID = '#decks-grid';
const FORM_ID = '#new-deck-form';
const MODAL_CHECKBOX_ID = '#new-deck-modal';

// Convert a file to Data URL
function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(file);
    });
}

// Escape HTML special characters
function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, (m) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
    );
}

// Render all decks
function renderDecks() {
    const $grid = $(GRID_ID);
    if ($grid.length === 0) return;

    const decks = getDecks();
    $grid.empty();

    // New Deck placeholder
    const $newDeck = $(`
        <label for="new-deck-modal"
               class="w-full aspect-video bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg
                      flex flex-col justify-center items-center text-gray-400 hover:border-gray-400 cursor-pointer
                      transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                 stroke-width="1.5" stroke="currentColor" class="w-8 h-8 mb-2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <h3 class="font-semibold mt-1">New Deck</h3>
        </label>
    `);
    $grid.append($newDeck);

    // Render existing decks
    decks.forEach(d => {
        const cover = d.cover || 'https://res.cloudinary.com/dqnrpauzk/image/upload/v1763919969/GoodBoy_jn8ebx.webp';
        const $deck = $(`
            <div class="w-full aspect-video overflow-hidden rounded-lg shadow-lg bg-gray-800">
                <a href="deck-cards.html?id=${d.id}" class="relative block w-full h-full group">
                    <img src="${cover}" alt="${escapeHtml(d.name)}"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                    <div class="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300
                                flex flex-col justify-end p-4">
                        <h3 class="text-white text-lg sm:text-base font-bold">${escapeHtml(d.name)}</h3>
                        <p class="text-gray-200 text-sm">${escapeHtml(d.type || '')}</p>
                    </div>
                </a>
            </div>
        `);
        $grid.append($deck);
    });
}

// Handle new deck form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    const $form = $(e.target);

    const name = $form.find('#deck-name').val().trim();
    const type = $form.find('#deck-type').val();
    const fileInput = $form.find('#deck-image')[0];

    if (!name) return alert('Please provide a deck name');

    let cover = '';
    const file = fileInput?.files?.[0];
    try {
        cover = await readFileAsDataUrl(file);
    } catch {
        console.warn('cover read failed');
    }

    createDeck({ name, type, cover });

    // Reset form and close modal
    $form[0].reset();
    $(MODAL_CHECKBOX_ID).prop('checked', false);

    // Re-render decks
    renderDecks();
}

// jQuery DOM Ready
$(document).ready(() => {
    renderDecks();
    $(FORM_ID).on('submit', handleFormSubmit);

    // Re-render when decks are updated from other pages
    $(window).on('decks-updated', renderDecks);
});
