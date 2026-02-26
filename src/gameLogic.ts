import { CardData, GameState, Rank, Suit } from './types';

const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export const createDeck = (): CardData[] => {
  const deck: CardData[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        faceUp: false,
      });
    }
  }
  return deck;
};

export const shuffle = (deck: CardData[]): CardData[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const dealGame = (): GameState => {
  // Instead of completely random dealing which often results in unsolvable games,
  // we'll use a standard random deal but ensure it's a valid Klondike starting state.
  // Note: Standard Klondike is only ~80% solvable. This is a true random deal.
  const deck = shuffle(createDeck());
  const tableau: CardData[][] = Array.from({ length: 7 }, () => []);
  
  for (let i = 0; i < 7; i++) {
    for (let j = i; j < 7; j++) {
      const card = deck.pop()!;
      if (i === j) {
        card.faceUp = true;
      }
      tableau[j].push(card);
    }
  }

  return {
    stock: deck,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
  };
};

export const isRed = (suit: Suit) => suit === 'hearts' || suit === 'diamonds';

export const canMoveToTableau = (card: CardData, targetTopCard?: CardData) => {
  if (!targetTopCard) {
    return true; // EASY MODE: Allow ANY card on an empty space (originally card.rank === 13)
  }
  return targetTopCard.faceUp && 
         isRed(card.suit) !== isRed(targetTopCard.suit) && 
         card.rank === targetTopCard.rank - 1;
};

export const canMoveToFoundation = (card: CardData, targetTopCard?: CardData) => {
  if (!targetTopCard) {
    return card.rank === 1; // Only Ace on empty foundation
  }
  return card.suit === targetTopCard.suit && card.rank === targetTopCard.rank + 1;
};
