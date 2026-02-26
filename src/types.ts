export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface CardData {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export interface GameState {
  stock: CardData[];
  waste: CardData[];
  foundations: CardData[][];
  tableau: CardData[][];
}
