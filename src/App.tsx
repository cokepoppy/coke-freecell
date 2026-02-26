import React, { useState, useEffect, useRef } from 'react';
import { Star, Check, Music, VolumeX, Award, Layers, Lightbulb, Undo2 } from 'lucide-react';
import { motion } from 'motion/react';
import { CardData, GameState } from './types';
import { dealGame, canMoveToTableau, canMoveToFoundation, isRed } from './gameLogic';
import { playCardMove, playCardFlip, playButtonClick, playVictory, toggleBackgroundMusic } from './sounds';

type Selection = {
  source: 'waste' | 'foundation' | 'tableau';
  pileIndex?: number;
  cardIndex?: number;
} | null;

const CardBack = ({ card, isHinted }: { card?: CardData, isHinted?: boolean }) => {
  const isRedCard = card ? isRed(card.suit) : false;
  const color = isRedCard ? 'text-[#ffaaaa]' : 'text-[#cccccc]';
  const suitSymbol = card ? { spades: '♠', hearts: '♥', clubs: '♣', diamonds: '♦' }[card.suit] : '';
  const rankStr = card ? ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[card.rank] || card.rank) : '';

  return (
    <div className={`w-full h-full rounded bg-white p-[3px] shadow-[0_1px_3px_rgba(0,0,0,0.4)] border border-gray-300 ${isHinted ? 'ring-4 ring-blue-400 animate-pulse z-50' : ''}`}>
      <div className="w-full h-full rounded-sm bg-[#0a1b9c] relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #1d35d4 0, #1d35d4 3px, transparent 3px, transparent 7px), repeating-linear-gradient(-45deg, #1d35d4 0, #1d35d4 3px, transparent 3px, transparent 7px)'
        }}></div>
        {card && (
          <div className={`z-10 text-xl font-bold opacity-50 ${color} mix-blend-screen pointer-events-none`}>
            {rankStr}{suitSymbol}
          </div>
        )}
      </div>
    </div>
  );
};

const CardFront = ({ card, isSelected, isHinted, draggable, onDragStart }: { card: CardData, isSelected?: boolean, isHinted?: boolean, draggable?: boolean, onDragStart?: (e: React.DragEvent) => void }) => {
  const isRedCard = isRed(card.suit);
  const color = isRedCard ? 'text-[#d32f2f]' : 'text-[#1a1a1a]';
  const suitSymbol = { spades: '♠', hearts: '♥', clubs: '♣', diamonds: '♦' }[card.suit];
  const rankStr = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[card.rank] || card.rank;

  return (
    <div 
      draggable={draggable}
      onDragStart={onDragStart}
      className={`w-full aspect-[2/3] rounded bg-[#fdfbf7] shadow-[0_1px_3px_rgba(0,0,0,0.4)] flex flex-col relative border border-gray-300 overflow-hidden ${isSelected ? 'ring-2 ring-yellow-400 z-50' : ''} ${isHinted ? 'ring-4 ring-blue-400 animate-pulse z-50' : ''} ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className={`absolute top-1 left-1.5 flex flex-row items-baseline gap-[2px] ${color}`}>
        <span className="text-[clamp(16px,4.5vw,22px)] font-serif font-bold leading-none">{rankStr}</span>
        <span className="text-[clamp(14px,4vw,18px)] leading-none">{suitSymbol}</span>
      </div>
      
      <div className={`absolute inset-0 flex items-center justify-center ${color} pt-6 pointer-events-none`}>
        {card.rank > 10 ? (
          <div className="w-[70%] h-[60%] border-[1.5px] border-current rounded-sm flex items-center justify-center overflow-hidden relative">
             <div className="absolute inset-0 opacity-10 bg-current"></div>
             <div className="w-full h-full flex flex-col items-center justify-center bg-white/50">
                <span className="text-[clamp(30px,8vw,40px)]">{card.rank === 11 ? '🫅' : card.rank === 12 ? '👸' : '🤴'}</span>
             </div>
          </div>
        ) : (
          <span className="text-[clamp(45px,12vw,65px)]">{suitSymbol}</span>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(dealGame());
  const [history, setHistory] = useState<GameState[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hint, setHint] = useState<{ source: 'waste' | 'foundation' | 'tableau' | 'stock', pileIndex?: number, cardIndex?: number } | null>(null);
  const [hasWon, setHasWon] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [animatingCards, setAnimatingCards] = useState<string[]>([]);

  const isWon = gameState.foundations.every(f => f.length === 13);

  useEffect(() => {
    if (animatingCards.length > 0) {
      const timer = setTimeout(() => setAnimatingCards([]), 500);
      return () => clearTimeout(timer);
    }
  }, [animatingCards]);

  useEffect(() => {
    if (isWon && !hasWon) {
      setHasWon(true);
      playVictory();
    } else if (!isWon && hasWon) {
      setHasWon(false);
    }
  }, [isWon, hasWon]);

  useEffect(() => {
    setHint(null);
  }, [gameState, selection]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && !isWon) {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    } else if (isWon) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isWon]);

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  const saveHistory = () => setHistory(h => [...h, gameState]);

  const handleUndo = () => {
    playButtonClick();
    if (history.length > 0) {
      setGameState(history[history.length - 1]);
      setHistory(h => h.slice(0, -1));
      setMoves(m => Math.max(0, m - 1));
      setSelection(null);
    }
  };

  const handleNewGame = () => {
    playButtonClick();
    setGameState(dealGame());
    setHistory([]);
    setMoves(0);
    setScore(0);
    setTime(0);
    setIsPlaying(true);
    setHasWon(false);
  };

  const toggleMusic = () => {
    playButtonClick();
    const nextState = !isMusicPlaying;
    setIsMusicPlaying(nextState);
    toggleBackgroundMusic(nextState);
  };

  const handleHint = () => {
    playButtonClick();
    if (gameState.waste.length > 0) {
      const card = gameState.waste[gameState.waste.length - 1];
      for (let i = 0; i < 4; i++) {
        const targetPile = gameState.foundations[i];
        const targetTop = targetPile.length > 0 ? targetPile[targetPile.length - 1] : undefined;
        if (canMoveToFoundation(card, targetTop)) return setHint({ source: 'waste' });
      }
    }
    for (let i = 0; i < 7; i++) {
      const col = gameState.tableau[i];
      if (col.length === 0) continue;
      const card = col[col.length - 1];
      for (let j = 0; j < 4; j++) {
        const targetPile = gameState.foundations[j];
        const targetTop = targetPile.length > 0 ? targetPile[targetPile.length - 1] : undefined;
        if (canMoveToFoundation(card, targetTop)) return setHint({ source: 'tableau', pileIndex: i, cardIndex: col.length - 1 });
      }
    }
    for (let i = 0; i < 7; i++) {
      const col = gameState.tableau[i];
      if (col.length === 0) continue;
      let firstFaceUpIndex = col.findIndex(c => c.faceUp);
      if (firstFaceUpIndex === -1) continue;
      const card = col[firstFaceUpIndex];
      if (card.rank === 13 && firstFaceUpIndex === 0) continue;
      for (let j = 0; j < 7; j++) {
        if (i === j) continue;
        const targetCol = gameState.tableau[j];
        const targetTop = targetCol.length > 0 ? targetCol[targetCol.length - 1] : undefined;
        if (canMoveToTableau(card, targetTop)) return setHint({ source: 'tableau', pileIndex: i, cardIndex: firstFaceUpIndex });
      }
    }
    if (gameState.waste.length > 0) {
      const card = gameState.waste[gameState.waste.length - 1];
      for (let i = 0; i < 7; i++) {
        const targetCol = gameState.tableau[i];
        const targetTop = targetCol.length > 0 ? targetCol[targetCol.length - 1] : undefined;
        if (canMoveToTableau(card, targetTop)) return setHint({ source: 'waste' });
      }
    }
    if (gameState.stock.length > 0 || gameState.waste.length > 0) {
      setHint({ source: 'stock' });
    }
  };

  const executeMove = (
    sourceData: { source: 'waste' | 'foundation' | 'tableau', pileIndex?: number, cardIndex?: number },
    targetData: { target: 'tableau' | 'foundation', pileIndex: number }
  ) => {
    let cardsToMove: CardData[] = [];
    let bottomCard: CardData | null = null;

    if (sourceData.source === 'waste') {
      if (gameState.waste.length === 0) return;
      bottomCard = gameState.waste[gameState.waste.length - 1];
      cardsToMove = [bottomCard];
    } else if (sourceData.source === 'foundation') {
      const pile = gameState.foundations[sourceData.pileIndex!];
      if (pile.length === 0) return;
      bottomCard = pile[pile.length - 1];
      cardsToMove = [bottomCard];
    } else if (sourceData.source === 'tableau') {
      const pile = gameState.tableau[sourceData.pileIndex!];
      cardsToMove = pile.slice(sourceData.cardIndex!);
      if (cardsToMove.length === 0) return;
      bottomCard = cardsToMove[0];
    }

    if (!bottomCard) return;

    if (targetData.target === 'tableau') {
      const targetCol = gameState.tableau[targetData.pileIndex];
      const targetTopCard = targetCol.length > 0 ? targetCol[targetCol.length - 1] : undefined;

      if (canMoveToTableau(bottomCard, targetTopCard)) {
        setAnimatingCards(prev => [...prev, ...cardsToMove.map(c => c.id)]);
        saveHistory();
        const newState = { ...gameState, waste: [...gameState.waste], tableau: [...gameState.tableau], foundations: [...gameState.foundations] };
        
        if (sourceData.source === 'waste') newState.waste.pop();
        else if (sourceData.source === 'foundation') {
          const sourcePile = [...newState.foundations[sourceData.pileIndex!]];
          sourcePile.pop();
          newState.foundations[sourceData.pileIndex!] = sourcePile;
        } else if (sourceData.source === 'tableau') {
          const sourceCol = [...newState.tableau[sourceData.pileIndex!]];
          sourceCol.splice(sourceData.cardIndex!);
          if (sourceCol.length > 0 && !sourceCol[sourceCol.length - 1].faceUp) {
            sourceCol[sourceCol.length - 1] = { ...sourceCol[sourceCol.length - 1], faceUp: true };
          }
          newState.tableau[sourceData.pileIndex!] = sourceCol;
        }

        newState.tableau[targetData.pileIndex] = [...targetCol, ...cardsToMove];
        setGameState(newState);
        setMoves(m => m + 1);
        setSelection(null);
        playCardMove();
      }
    } else if (targetData.target === 'foundation') {
      if (cardsToMove.length > 1) return;
      const targetPile = gameState.foundations[targetData.pileIndex];
      const targetTopCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : undefined;

      if (canMoveToFoundation(bottomCard, targetTopCard)) {
        setAnimatingCards(prev => [...prev, ...cardsToMove.map(c => c.id)]);
        saveHistory();
        const newState = { ...gameState, waste: [...gameState.waste], tableau: [...gameState.tableau], foundations: [...gameState.foundations] };
        
        if (sourceData.source === 'waste') newState.waste.pop();
        else if (sourceData.source === 'tableau') {
          const sourceCol = [...newState.tableau[sourceData.pileIndex!]];
          sourceCol.pop();
          if (sourceCol.length > 0 && !sourceCol[sourceCol.length - 1].faceUp) {
            sourceCol[sourceCol.length - 1] = { ...sourceCol[sourceCol.length - 1], faceUp: true };
          }
          newState.tableau[sourceData.pileIndex!] = sourceCol;
        }

        newState.foundations[targetData.pileIndex] = [...targetPile, bottomCard];
        setGameState(newState);
        setMoves(m => m + 1);
        setScore(s => s + 10);
        setSelection(null);
        playCardMove();
      }
    }
  };

  const handleStockClick = () => {
    setSelection(null);
    saveHistory();
    const newState = { ...gameState, stock: [...gameState.stock], waste: [...gameState.waste] };
    if (newState.stock.length === 0) {
      if (newState.waste.length === 0) return;
      newState.stock = [...newState.waste].reverse().map(c => ({ ...c, faceUp: false }));
      newState.waste = [];
      setAnimatingCards(prev => [...prev, ...newState.stock.map(c => c.id)]);
      playCardMove();
    } else {
      const card = newState.stock.pop()!;
      card.faceUp = true;
      newState.waste.push(card);
      setAnimatingCards(prev => [...prev, card.id]);
      playCardFlip();
    }
    setGameState(newState);
    setMoves(m => m + 1);
  };

  const handleWasteClick = () => {
    if (gameState.waste.length > 0) setSelection({ source: 'waste' });
  };

  const handleFoundationClick = (pileIndex: number) => {
    if (!selection) {
      if (gameState.foundations[pileIndex].length > 0) setSelection({ source: 'foundation', pileIndex });
      return;
    }
    executeMove(selection, { target: 'foundation', pileIndex });
  };

  const handleTableauClick = (colIndex: number, cardIndex: number) => {
    const card = gameState.tableau[colIndex][cardIndex];
    if (!selection) {
      if (card && card.faceUp) setSelection({ source: 'tableau', pileIndex: colIndex, cardIndex });
      return;
    }
    executeMove(selection, { target: 'tableau', pileIndex: colIndex });
  };

  const handleEmptyTableauClick = (colIndex: number) => {
    if (selection) executeMove(selection, { target: 'tableau', pileIndex: colIndex });
  };

  const handleTableauDoubleClick = (colIndex: number, cardIndex: number) => {
    const col = gameState.tableau[colIndex];
    if (cardIndex !== col.length - 1) return;
    const card = col[cardIndex];
    if (!card.faceUp) return;
    for (let i = 0; i < 4; i++) {
      const targetPile = gameState.foundations[i];
      const targetTopCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : undefined;
      if (canMoveToFoundation(card, targetTopCard)) {
        executeMove({ source: 'tableau', pileIndex: colIndex, cardIndex }, { target: 'foundation', pileIndex: i });
        return;
      }
    }
  };

  const handleWasteDoubleClick = () => {
    if (gameState.waste.length === 0) return;
    const card = gameState.waste[gameState.waste.length - 1];
    for (let i = 0; i < 4; i++) {
      const targetPile = gameState.foundations[i];
      const targetTopCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : undefined;
      if (canMoveToFoundation(card, targetTopCard)) {
        executeMove({ source: 'waste' }, { target: 'foundation', pileIndex: i });
        return;
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, source: 'waste' | 'foundation' | 'tableau', pileIndex?: number, cardIndex?: number) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ source, pileIndex, cardIndex }));
    e.dataTransfer.effectAllowed = 'move';
    setSelection({ source, pileIndex, cardIndex });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnTableau = (e: React.DragEvent, targetColIndex: number) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      executeMove(data, { target: 'tableau', pileIndex: targetColIndex });
    } catch (err) {}
  };

  const handleDropOnFoundation = (e: React.DragEvent, targetPileIndex: number) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      executeMove(data, { target: 'foundation', pileIndex: targetPileIndex });
    } catch (err) {}
  };

  const getTopOffset = (col: CardData[], index: number) => {
    let offset = 0;
    for (let i = 0; i < index; i++) offset += col[i].faceUp ? 32 : 12;
    return offset;
  };

  // Auto-complete logic
  useEffect(() => {
    if (isWon) return;

    const isAutoCompletable = 
      gameState.stock.length === 0 && 
      gameState.waste.length === 0 && 
      gameState.tableau.every(col => col.every(card => card.faceUp));

    if (isAutoCompletable) {
      const timer = setTimeout(() => {
        for (let i = 0; i < 7; i++) {
          const col = gameState.tableau[i];
          if (col.length === 0) continue;
          const card = col[col.length - 1];
          for (let j = 0; j < 4; j++) {
            const targetPile = gameState.foundations[j];
            const targetTop = targetPile.length > 0 ? targetPile[targetPile.length - 1] : undefined;
            if (canMoveToFoundation(card, targetTop)) {
              executeMove({ source: 'tableau', pileIndex: i, cardIndex: col.length - 1 }, { target: 'foundation', pileIndex: j });
              return;
            }
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [gameState, isWon]);

  return (
    <div className="max-w-md mx-auto h-screen bg-[#165a22] flex flex-col relative overflow-hidden font-sans select-none">
      <div className="flex justify-between items-center px-4 py-3 text-white">
        <Star className="text-yellow-400 fill-current" size={28} />
        <div className="flex space-x-8 text-center">
          <div className="flex flex-col items-center">
            <div className="text-[11px] text-[#a5d6a7] mb-0.5">分数:</div>
            <div className="text-xl font-bold leading-none">{score}</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-[11px] text-[#a5d6a7] mb-0.5">用时:</div>
            <div className="text-xl font-bold leading-none">{formatTime(time)}</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-[11px] text-[#a5d6a7] mb-0.5">移牌次数:</div>
            <div className="text-xl font-bold leading-none">{moves}</div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#2a7d3c] flex items-center justify-center border-2 border-[#439655]">
          <Check className="text-white" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 px-2 mt-2">
        {gameState.foundations.map((pile, i) => (
          <div 
            key={`foundation-${i}`} 
            className="relative w-full aspect-[2/3]" 
            onClick={() => handleFoundationClick(i)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnFoundation(e, i)}
          >
            <div className="absolute inset-0 rounded border-2 border-[#439655] flex items-center justify-center bg-[#2a7d3c]">
               <span className="text-4xl text-[#439655] font-serif opacity-50">A</span>
            </div>
            {pile.map((card, j) => (
               <motion.div 
                 key={card.id} 
                 layoutId={card.id} 
                 className="absolute inset-0"
                 style={{ zIndex: animatingCards.includes(card.id) ? 100 + j : (selection?.cardIndex === j && selection?.pileIndex === i && selection?.source === 'foundation' ? 50 : j) }}
               >
                 <CardFront 
                   card={card} 
                   isSelected={selection?.source === 'foundation' && selection.pileIndex === i && j === pile.length - 1} 
                   isHinted={hint?.source === 'foundation' && hint.pileIndex === i && j === pile.length - 1}
                   draggable={j === pile.length - 1}
                   onDragStart={(e) => handleDragStart(e, 'foundation', i)}
                 />
               </motion.div>
            ))}
          </div>
        ))}
        <div></div>
        <div className="relative w-full aspect-[2/3]" onClick={handleWasteClick} onDoubleClick={handleWasteDoubleClick}>
          {gameState.waste.map((card, i, arr) => {
            const isTop3 = i >= arr.length - 3;
            const offsetIndex = isTop3 ? arr.length - 1 - i : 2;
            return (
              <motion.div 
                key={card.id} 
                layoutId={card.id} 
                className="absolute top-0 w-full aspect-[2/3]" 
                style={{ 
                  right: `${offsetIndex * 20}px`, 
                  zIndex: animatingCards.includes(card.id) ? 100 + i : (selection?.source === 'waste' && i === arr.length - 1 ? 50 : i), 
                  opacity: isTop3 ? 1 : 0, 
                  pointerEvents: isTop3 ? 'auto' : 'none' 
                }}
              >
                <CardFront 
                  card={card} 
                  isSelected={selection?.source === 'waste' && i === arr.length - 1} 
                  isHinted={hint?.source === 'waste' && i === arr.length - 1}
                  draggable={i === arr.length - 1}
                  onDragStart={(e) => handleDragStart(e, 'waste')}
                />
              </motion.div>
            );
          })}
        </div>
        <div className="relative w-full aspect-[2/3]" onClick={handleStockClick}>
          {gameState.stock.length === 0 && (
            <div className={`absolute inset-0 rounded border-2 border-[#439655] flex items-center justify-center bg-[#2a7d3c] ${hint?.source === 'stock' ? 'ring-4 ring-blue-400 animate-pulse' : ''}`}>
              <div className="w-8 h-8 rounded-full border-4 border-[#439655] opacity-50"></div>
            </div>
          )}
          {gameState.stock.map((card, i) => (
            <motion.div key={card.id} layoutId={card.id} className="absolute inset-0" style={{ zIndex: animatingCards.includes(card.id) ? 100 + i : i }}>
              <CardBack isHinted={i === gameState.stock.length - 1 && hint?.source === 'stock'} />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 px-2 mt-4 flex-1 relative">
        {gameState.tableau.map((col, i) => (
          <div 
            key={`tableau-${i}`} 
            className="relative w-full h-full" 
            onClick={() => col.length === 0 && handleEmptyTableauClick(i)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnTableau(e, i)}
          >
            {col.length === 0 ? (
              <div className="w-full aspect-[2/3] rounded border-2 border-white/30"></div>
            ) : (
              col.map((card, j) => {
                const isCardSelected = selection?.source === 'tableau' && selection.pileIndex === i && j >= selection.cardIndex!;
                return (
                  <motion.div 
                    key={card.id} 
                    layoutId={card.id}
                    className="absolute w-full aspect-[2/3]" 
                    style={{ 
                      top: `${getTopOffset(col, j)}px`, 
                      zIndex: animatingCards.includes(card.id) ? 100 + j : (isCardSelected ? 50 + j : j) 
                    }}
                    onClick={(e) => { e.stopPropagation(); handleTableauClick(i, j); }}
                    onDoubleClick={(e) => { e.stopPropagation(); handleTableauDoubleClick(i, j); }}
                  >
                    {card.faceUp ? (
                      <CardFront 
                        card={card} 
                        isSelected={isCardSelected} 
                        isHinted={hint?.source === 'tableau' && hint.pileIndex === i && hint.cardIndex === j}
                        draggable={true}
                        onDragStart={(e) => {
                          e.stopPropagation();
                          handleDragStart(e, 'tableau', i, j);
                        }}
                      />
                    ) : <CardBack card={card} />}
                  </motion.div>
                );
              })
            )}
          </div>
        ))}
      </div>

      <div className="absolute bottom-24 left-4 flex flex-col items-center z-10">
        <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-orange-300 shadow-lg">
          <img src="https://picsum.photos/seed/landscape/100/100" alt="event" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full mt-[-8px] z-10 whitespace-nowrap">
          2天 3小时
        </div>
      </div>

      <div className="bg-[#0b3d14] text-white flex justify-around items-center pt-3 pb-6 px-2 w-full z-20">
        <div className="flex flex-col items-center opacity-80 hover:opacity-100 cursor-pointer" onClick={toggleMusic}>
          {isMusicPlaying ? <Music size={26} /> : <VolumeX size={26} />}
          <span className="text-xs mt-1">{isMusicPlaying ? '音乐开' : '音乐关'}</span>
        </div>
        <div className="flex flex-col items-center relative cursor-pointer">
          <Award size={26} />
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">1</span>
          <span className="text-xs mt-1">游戏</span>
        </div>
        <div className="flex flex-col items-center cursor-pointer opacity-80 hover:opacity-100" onClick={handleNewGame}>
          <div className="w-8 h-8 rounded bg-blue-600 border border-white flex items-center justify-center relative overflow-hidden">
             <Layers size={20} className="text-white" />
          </div>
          <span className="text-xs mt-1">新局</span>
        </div>
        <div className="flex flex-col items-center opacity-80 hover:opacity-100 cursor-pointer text-yellow-400" onClick={handleHint}>
          <Lightbulb size={26} />
          <span className="text-xs mt-1 text-white">提示</span>
        </div>
        <div className="flex flex-col items-center opacity-80 hover:opacity-100 cursor-pointer text-red-400" onClick={handleUndo}>
          <Undo2 size={26} />
          <span className="text-xs mt-1 text-white">还原</span>
        </div>
      </div>

      {isWon && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-4xl font-bold mb-4 text-yellow-400 font-serif">恭喜通关！</h2>
          <div className="bg-white/10 rounded-2xl p-6 mb-8 w-64 text-center border border-white/20">
            <div className="mb-4">
              <div className="text-sm text-gray-300 mb-1">最终得分</div>
              <div className="text-4xl font-bold text-white">{score}</div>
            </div>
            <div className="flex justify-between text-sm text-gray-300 border-t border-white/20 pt-4">
              <div>用时: <span className="text-white font-bold">{formatTime(time)}</span></div>
              <div>步数: <span className="text-white font-bold">{moves}</span></div>
            </div>
          </div>
          <button 
            onClick={handleNewGame}
            className="px-8 py-3 bg-green-600 rounded-full font-bold text-lg hover:bg-green-500 transition-colors shadow-[0_0_20px_rgba(34,197,94,0.4)]"
          >
            再来一局
          </button>
        </div>
      )}
    </div>
  );
}
