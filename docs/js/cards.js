import { attachModalFunctionality } from './modal.js';
import { getDecks, addCardToDeck } from './decks_storage.js';

let currentCardForModal = null;

// Fetch all cards and favorites
async function fetchCards() {
    try {
        const cards = await $.getJSON('http://localhost:3000/cards');
        const favorites = await $.getJSON('http://localhost:3000/favorites');

        // mark cards as favorite if they exist in favorites table
        const favoriteIds = new Set(favorites.map(f => Number(f.card_id)));
        cards.forEach(c => c.isFavorite = favoriteIds.has(c.id));

        displayCards(cards);
    } catch (err) {
        console.error('Error fetching cards:', err);
    }
}

// Open modal to add card to deck
function openDeckModalForCard(cardId) {
    currentCardForModal = Number(cardId);
    $('#modal').prop('checked', true);
    populateDecksInModal();
}

// Populate decks modal
function populateDecksInModal() {
    const $list = $('#decks-list');
    if (!$list.length) return;
    $list.empty();

    const decks = getDecks();
    if (!decks.length) {
        $list.html('<div class="text-gray-400">No decks yet. Create one in Decks page.</div>');
        return;
    }

    decks.forEach(d => {
        const existingEntry = (d.card_entries || []).find(e => Number(e.card_id) === currentCardForModal);
        const $row = $('<div class="flex items-center justify-between gap-3 mb-2"></div>');

        if (existingEntry) {
            $row.append(`
                <div class="flex-1 text-white">${d.name}</div>
                <div class="text-sm text-gray-300">Already on Deck (Qty: ${existingEntry.qty})</div>
            `);
        } else {
            $row.append(`
                <div class="flex-1 text-white">${d.name}</div>
                <div class="flex gap-2">
                    <button class="qty-btn px-2 py-1 bg-gray-700 text-sm rounded text-white hover:bg-gray-600" data-deck-id="${d.id}" data-qty="1">+1</button>
                    <button class="qty-btn px-2 py-1 bg-gray-700 text-sm rounded text-white hover:bg-gray-600" data-deck-id="${d.id}" data-qty="2">+2</button>
                    <button class="qty-btn px-2 py-1 bg-gray-700 text-sm rounded text-white hover:bg-gray-600" data-deck-id="${d.id}" data-qty="3">+3</button>
                    <button class="qty-btn px-2 py-1 bg-gray-700 text-sm rounded text-white hover:bg-gray-600" data-deck-id="${d.id}" data-qty="4">+4</button>
                </div>
            `);
        }

        $list.append($row);
    });

    $list.off('click.qty').on('click.qty', '.qty-btn', function (e) {
        e.stopPropagation();
        if (currentCardForModal == null) return;

        const deckId = Number($(this).data('deck-id'));
        const qty = Number($(this).data('qty'));
        try {
            addCardToDeck(deckId, currentCardForModal, qty);
            const original = $(this).text();
            $(this).text(`${original} ✓`);
            setTimeout(() => populateDecksInModal(), 300);
        } catch (err) {
            console.error(err);
        }
    });
}

// Display cards
function displayCards(cards) {
    const $container = $('#cards-container');
    $container.empty();

    cards.forEach(card => {
        const $card = $(`
            <div class="p-2 card">
                <div class="relative group w-60 h-[360px] overflow-hidden rounded-lg shadow-lg transition-transform duration-300 hover:scale-[1.02] cursor-pointer">
                    <input id="show-${card.id}" type="checkbox" class="hidden peer" />
                    <img src="${card.img_url || ''}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 pointer-events-none
                                group-hover:opacity-100 group-hover:pointer-events-auto
                                peer-checked:opacity-100 peer-checked:pointer-events-auto">
                        <div class="relative z-30 flex gap-3">
                            <button class="action add-to-deck bg-white/10 text-white px-3 py-2 rounded-md text-sm font-semibold backdrop-blur-sm hover:bg-white/20" data-card-id="${card.id}">
                                + Add to Deck
                            </button>
                            <button class="action favorite-btn bg-white/10 text-white px-3 py-2 rounded-md text-sm font-semibold backdrop-blur-sm hover:bg-white/20 ${card.isFavorite ? 'saved' : ''}" data-card-id="${card.id}">
                                ${card.isFavorite ? '★ Saved' : '☆ Favorite'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        $container.append($card);

        // Add to Deck button
        $card.find('.add-to-deck').on('click', e => {
            e.stopPropagation();           // prevent card click
            openDeckModalForCard(card.id); // only open modal here
        });

        // Favorite button (save in favorites table)
        $card.find('.favorite-btn').on('click', async e => {
            e.stopPropagation();
            try {
                if (card.isFavorite) {
                    // Remove from favorites
                    const favorites = await $.getJSON(`http://localhost:3000/favorites?card_id=${card.id}`);
                    if (favorites.length) {
                        await fetch(`http://localhost:3000/favorites/${favorites[0].id}`, { method: 'DELETE' });
                        card.isFavorite = false;
                    }
                } else {
                    // Add to favorites
                    await fetch('http://localhost:3000/favorites', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ card_id: card.id })
                    });
                    card.isFavorite = true;
                }

                // update button UI
                $(e.currentTarget)
                    .text(card.isFavorite ? '★ Saved' : '☆ Favorite')
                    .toggleClass('saved', card.isFavorite);

            } catch (err) {
                console.error('Error toggling favorite:', err);
                alert('Could not update favorite.');
            }
        });
    });

    // Attach modal functionality
    if (typeof attachModalFunctionality === 'function') {
        attachModalFunctionality();
    }
}

$(document).ready(fetchCards);
