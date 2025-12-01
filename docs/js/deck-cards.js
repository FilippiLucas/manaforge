import { 
    getDeckById, 
    removeCardFromDeck, 
    addCardToDeck, 
    deleteDeck 
} from './decks_storage.js';

let pendingRemoveCardId = null;

async function renderDeck() {
    const params = new URLSearchParams(location.search);
    const deckId = params.get('id') || params.get('name');

    // Load deck from JSON Server
    const deck = await getDeckById(deckId);

    if (!deck) {
        $('#deck-title').text('Deck not found');
        return;
    }

    $('#deck-title').text(deck.name || 'Deck');

    // Load cards from JSON Server
    let cardData = [];
    try {
        const res = await fetch('http://localhost:3000/cards'); // JSON Server endpoint
        cardData = await res.json();
    } catch (err) {
        console.error('Error fetching cards:', err);
    }

    const cardsById = new Map(cardData.map(c => [c.id, c]));

    const $list = $('#card-list').empty();

    (deck.card_entries || []).forEach(entry => {
        const card = cardsById.get(Number(entry.card_id));
        if (!card) return;

        const qty = Number(entry.qty);

        const addDisabled = qty >= 4 ? 'disabled opacity-50 cursor-not-allowed' : '';
        const subDisabled = qty <= 1 ? 'disabled opacity-50 cursor-not-allowed' : '';

        const $li = $(`
            <li class="group relative bg-gray-800 rounded p-3 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div>
                        <div class="text-sm font-semibold">${escapeHtml(card.name)}</div>
                        <div class="text-xs text-gray-300">
                            Quantity: <span class="card-qty">${qty}</span>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                    <div class="flex gap-2 w-full sm:w-auto">
                        <button
                            class="qty-btn add-btn px-3 py-2 text-xs bg-green-600 rounded hover:bg-green-500 flex-1 sm:flex-none"
                            data-card-id="${card.id}"
                            data-action="add"
                            ${addDisabled}>
                            +1
                        </button>

                        <button
                            class="qty-btn sub-btn px-3 py-2 text-xs bg-yellow-600 rounded hover:bg-yellow-500 flex-1 sm:flex-none"
                            data-card-id="${card.id}"
                            data-action="sub"
                            ${subDisabled}>
                            -1
                        </button>
                    </div>

                    <button
                        class="remove-btn px-4 py-2 text-xs bg-red-600 rounded hover:bg-red-500 w-full sm:w-auto"
                        data-card-id="${card.id}">
                        Remove
                    </button>
                </div>
            </li>
        `);

        $li.data('card-img', card.img_url || '');
        $list.append($li);
    });

    /* ---------- CARD PREVIEW ---------- */
    $list.off('click.preview').on('click.preview', 'li', function (e) {
        if ($(e.target).closest('button').length) return;
        const src = $(this).data('card-img');
        if (src) {
            $('#card-preview-img').attr('src', src);
            $('#card-preview').removeClass('hidden').addClass('flex');
        }
    });

    $('#card-preview-close').on('click', () => {
        $('#card-preview').addClass('hidden').removeClass('flex');
    });

    $('#card-preview').on('click', function (e) {
        if (e.target === this) {
            $('#card-preview').addClass('hidden').removeClass('flex');
        }
    });

    /* ---------- REMOVE BUTTON → OPEN MODAL ---------- */
    $list.off('click.remove').on('click.remove', '.remove-btn', function () {
        pendingRemoveCardId = Number($(this).data('card-id'));
        $('#remove-modal').removeClass('hidden').addClass('flex');
    });

    /* ---------- QTY BUTTONS ---------- */
    $list.off('click.qty').on('click.qty', '.qty-btn', async function () {
        if ($(this).is(':disabled')) return;

        const action = $(this).data('action');
        const cardId = Number($(this).data('card-id'));

        if (action === 'add') {
            await addCardToDeck(deck.id, cardId, 1);
        } else if (action === 'sub') {
            await removeCardFromDeck(deck.id, cardId, 1);
        }

        renderDeck();
    });

    /* ---------- DELETE DECK ---------- */
    $('#delete-deck-btn').off().on('click', () => {
        $('#delete-deck-modal').removeClass('hidden').addClass('flex');
    });
}

/* ---------- MODAL: CANCEL REMOVE ---------- */
$('#cancel-remove').on('click', () => {
    pendingRemoveCardId = null;
    $('#remove-modal').addClass('hidden').removeClass('flex');
});

/* ---------- MODAL: CONFIRM REMOVE ---------- */
$('#confirm-remove').on('click', async () => {
    if (pendingRemoveCardId !== null) {
        const params = new URLSearchParams(location.search);
        const deckId = params.get('id');

        await removeCardFromDeck(deckId, pendingRemoveCardId);

        pendingRemoveCardId = null;
        renderDeck();
    }

    $('#remove-modal').addClass('hidden').removeClass('flex');
});

/* ---------- DELETE DECK MODAL ---------- */
$('#cancel-delete-deck').on('click', () => {
    $('#delete-deck-modal').addClass('hidden').removeClass('flex');
});

$('#confirm-delete-deck').on('click', async () => {
    const params = new URLSearchParams(location.search);
    const deckId = params.get('id');

    await deleteDeck(deckId);

    $('#delete-deck-modal').addClass('hidden').removeClass('flex');
    window.location.href = "decks.html";
});

/* ---------- UTIL ---------- */
function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}

$(document).ready(renderDeck);
