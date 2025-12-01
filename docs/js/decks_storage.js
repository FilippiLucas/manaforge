const KEY = 'manaforge_decks';

// Get decks
export function getDecks() {
    try {
        return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch (e) {
        return [];
    }
}

// Save decks
export function setDecks(decks) {
    localStorage.setItem(KEY, JSON.stringify(decks));

    // jQuery event dispatch
    $(window).trigger('decks-updated', [decks]);
}

// Create a new deck
export function createDeck({ name, type = 'other', cover = '' }) {
    const decks = getDecks();

    const nextId = (decks.reduce((m, d) => Math.max(m, d.id || 0), 0) || 0) + 1;

    const deck = {
        id: nextId,
        name,
        type,
        cover,
        card_entries: []
    };

    decks.push(deck);
    setDecks(decks);
    return deck;
}

// Add card to deck
export function addCardToDeck(deckId, cardId, qty = 1) {
    const decks = getDecks();
    const d = decks.find(x => x.id === Number(deckId));
    if (!d) throw new Error('Deck not found');

    if (!d.card_entries) d.card_entries = [];

    const cid = Number(cardId);
    const q = Number(qty) || 1;

    const entry = d.card_entries.find(e => e.card_id === cid);

    if (entry) {
        entry.qty = (entry.qty || 0) + q;
    } else {
        d.card_entries.push({ card_id: cid, qty: q });
    }

    setDecks(decks);
    return true;
}

// Remove card from deck
export function removeCardFromDeck(deckId, cardId, qty = null) {
    const decks = getDecks();
    const d = decks.find(x => x.id === Number(deckId));

    if (!d || !d.card_entries) return false;

    const cid = Number(cardId);
    const entryIndex = d.card_entries.findIndex(e => e.card_id === cid);

    if (entryIndex === -1) return false;

    if (qty == null) {
        // remove item entirely
        d.card_entries.splice(entryIndex, 1);
    } else {
        // decrease qty
        d.card_entries[entryIndex].qty -= Number(qty);
        if (d.card_entries[entryIndex].qty <= 0) {
            d.card_entries.splice(entryIndex, 1);
        }
    }

    setDecks(decks);
    return true;
}

// Get deck by id
export function getDeckById(id) {
    return getDecks().find(d => d.id === Number(id)) || null;
}

// Delete deck
export function deleteDeck(deckId) {
    const decks = JSON.parse(localStorage.getItem(KEY) || "[]");
    const updated = decks.filter(d => d.id !== Number(deckId));
    localStorage.setItem(KEY, JSON.stringify(updated));
}
