
import React, { useState, useEffect, useCallback, useRef } from 'react';
// Fixed error: Removed non-existent OrderId from import
import { GameState, Plot, PlotStatus, CropId, Order } from './types';
import { CROPS, INITIAL_MONEY, GRID_SIZE, MAX_ORDERS, TICK_RATE, WIN_GOAL } from './constants';
import { FarmPlot } from './components/Plot';
import { OrderCard } from './components/OrderCard';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Initialize plots
    const initialPlots: Plot[] = Array.from({ length: GRID_SIZE }, (_, i) => ({
      id: i,
      status: PlotStatus.EMPTY,
      cropId: null,
      startTime: null,
      progress: 0
    }));

    return {
      money: INITIAL_MONEY,
      inventory: { wheat: 0, tomato: 0, corn: 0 },
      plots: initialPlots,
      orders: [],
      stats: {
        totalEarned: 0,
        cropsHarvested: 0,
        ordersFulfilled: 0,
        ordersFailed: 0
      }
    };
  });

  const [selectedCrop, setSelectedCrop] = useState<CropId>('wheat');
  const [showWin, setShowWin] = useState(false);
  const [showLoss, setShowLoss] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);

  // Helper to generate a unique random order
  const generateOrder = useCallback((): Order => {
    const cropIds: CropId[] = ['wheat', 'tomato', 'corn'];
    const cropId = cropIds[Math.floor(Math.random() * cropIds.length)];
    const quantity = Math.floor(Math.random() * 3) + 1; // 1-3
    const crop = CROPS[cropId];
    
    // Reward is calculated based on cost and time, plus a premium
    const reward = Math.round(crop.orderValue * quantity * (1 + Math.random() * 0.2));
    const totalTime = Math.round(crop.growthTime * quantity * 3 + 15); // Reasonable time window

    return {
      id: Math.random().toString(36).substr(2, 9),
      cropId,
      quantity,
      reward,
      timeLeft: totalTime,
      totalTime
    };
  }, []);

  // Main game loop
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(prev => {
        // 1. Update Plot Progress
        const updatedPlots = prev.plots.map(plot => {
          if (plot.status === PlotStatus.GROWING && plot.cropId) {
            const crop = CROPS[plot.cropId];
            const increment = (100 / crop.growthTime);
            const newProgress = Math.min(100, plot.progress + increment);
            return {
              ...plot,
              progress: newProgress,
              status: newProgress >= 100 ? PlotStatus.READY : PlotStatus.GROWING
            };
          }
          return plot;
        });

        // 2. Update Order Timers
        const updatedOrders = prev.orders
          .map(order => ({ ...order, timeLeft: order.timeLeft - 1 }))
          .filter(order => {
            if (order.timeLeft <= 0) {
              // Mark as failed if timer expires
              return false;
            }
            return true;
          });
        
        const failedCount = prev.orders.length - updatedOrders.length;

        // 3. Spawn New Orders if needed
        let finalOrders = [...updatedOrders];
        if (finalOrders.length < MAX_ORDERS && Math.random() > 0.7) {
          finalOrders.push(generateOrder());
        }

        return {
          ...prev,
          plots: updatedPlots,
          orders: finalOrders,
          stats: {
            ...prev.stats,
            ordersFailed: prev.stats.ordersFailed + failedCount
          }
        };
      });
    }, TICK_RATE);

    return () => clearInterval(timer);
  }, [generateOrder]);

  // Check win/loss
  useEffect(() => {
    if (gameState.money >= WIN_GOAL) {
      setShowWin(true);
    }
    
    // Loss condition: No money, no inventory, nothing growing
    // Fixed error: cast Object.values to number[] to avoid comparison with unknown
    const canRecover = 
      gameState.money >= CROPS.wheat.cost || 
      (Object.values(gameState.inventory) as number[]).some(count => count > 0) ||
      gameState.plots.some(p => p.status !== PlotStatus.EMPTY);

    if (!canRecover) {
      setShowLoss(true);
    }
  }, [gameState]);

  const flashMessage = (text: string, type: 'error' | 'success' | 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const plantCrop = (plotId: number) => {
    const crop = CROPS[selectedCrop];
    if (gameState.money < crop.cost) {
      flashMessage(`Not enough money! Need $${crop.cost}`, 'error');
      return;
    }

    setGameState(prev => {
      const newPlots = prev.plots.map(p => {
        if (p.id === plotId && p.status === PlotStatus.EMPTY) {
          return {
            ...p,
            status: PlotStatus.GROWING,
            cropId: selectedCrop,
            progress: 0
          };
        }
        return p;
      });

      return {
        ...prev,
        money: prev.money - crop.cost,
        plots: newPlots
      };
    });
  };

  const harvestPlot = (plotId: number) => {
    setGameState(prev => {
      const plot = prev.plots.find(p => p.id === plotId);
      if (!plot || plot.status !== PlotStatus.READY || !plot.cropId) return prev;

      const cropId = plot.cropId;
      const newPlots = prev.plots.map(p => {
        if (p.id === plotId) {
          return {
            ...p,
            status: PlotStatus.EMPTY,
            cropId: null,
            progress: 0
          };
        }
        return p;
      });

      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          [cropId]: prev.inventory[cropId] + 1
        },
        plots: newPlots,
        stats: {
          ...prev.stats,
          cropsHarvested: prev.stats.cropsHarvested + 1
        }
      };
    });
  };

  const fulfillOrder = (orderId: string) => {
    const order = gameState.orders.find(o => o.id === orderId);
    if (!order) return;

    if (gameState.inventory[order.cropId] < order.quantity) {
      flashMessage(`Need more ${CROPS[order.cropId].name}!`, 'error');
      return;
    }

    setGameState(prev => ({
      ...prev,
      money: prev.money + order.reward,
      inventory: {
        ...prev.inventory,
        [order.cropId]: prev.inventory[order.cropId] - order.quantity
      },
      orders: prev.orders.filter(o => o.id !== orderId),
      stats: {
        ...prev.stats,
        totalEarned: prev.stats.totalEarned + order.reward,
        ordersFulfilled: prev.stats.ordersFulfilled + 1
      }
    }));
    flashMessage(`Order Fulfilled! +$${order.reward}`, 'success');
  };

  const resetGame = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header Panel */}
      <header className="bg-white rounded-3xl shadow-lg p-6 border border-green-100 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className="bg-green-500 p-4 rounded-2xl shadow-inner">
            <i className="fa-solid fa-tractor text-white text-3xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-black text-green-800 tracking-tight">GEMINI FARM <span className="text-amber-500">TYCOON</span></h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Master of the Soil</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 z-10">
          <div className="bg-green-50 px-6 py-3 rounded-2xl border border-green-200">
            <span className="block text-[10px] font-bold text-green-600 uppercase">Capital</span>
            <span className="text-2xl font-black text-green-700">${gameState.money}</span>
          </div>
          <div className="bg-amber-50 px-6 py-3 rounded-2xl border border-amber-200">
            <span className="block text-[10px] font-bold text-amber-600 uppercase">Goal</span>
            <span className="text-2xl font-black text-amber-700">${WIN_GOAL}</span>
          </div>
        </div>

        {/* Feedback Message */}
        {message && (
          <div className={`absolute bottom-0 left-0 right-0 py-1 text-center text-xs font-bold transition-all ${
            message.type === 'error' ? 'bg-red-500 text-white' : 
            message.type === 'success' ? 'bg-green-500 text-white' : 
            'bg-blue-500 text-white'
          }`}>
            {message.text}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Farm Grid */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-green-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <i className="fa-solid fa-seedling text-green-500"></i> Farm Plots
              </h2>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {(Object.keys(CROPS) as CropId[]).map(cid => (
                  <button
                    key={cid}
                    onClick={() => setSelectedCrop(cid)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2
                      ${selectedCrop === cid ? 'bg-white shadow-sm text-green-700' : 'text-gray-400 hover:text-gray-600'}
                    `}
                  >
                    <span>{CROPS[cid].icon}</span>
                    <span className="hidden sm:inline">${CROPS[cid].cost}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {gameState.plots.map(plot => (
                <FarmPlot 
                  key={plot.id} 
                  plot={plot} 
                  selectedCrop={selectedCrop}
                  onPlant={plantCrop}
                  onHarvest={harvestPlot}
                />
              ))}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Harvested</span>
                <span className="text-xl font-bold text-gray-700">{gameState.stats.cropsHarvested}</span>
             </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Delivered</span>
                <span className="text-xl font-bold text-gray-700">{gameState.stats.ordersFulfilled}</span>
             </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Total Earned</span>
                <span className="text-xl font-bold text-green-600">${gameState.stats.totalEarned}</span>
             </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Missed</span>
                <span className="text-xl font-bold text-red-400">{gameState.stats.ordersFailed}</span>
             </div>
          </div>
        </div>

        {/* Right Column: Inventory & Orders */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Inventory */}
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-green-100">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <i className="fa-solid fa-boxes-stacked text-amber-500"></i> Barn
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(CROPS) as CropId[]).map(cid => (
                <div key={cid} className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                  <span className="text-3xl block mb-1">{CROPS[cid].icon}</span>
                  <span className="text-lg font-black text-gray-700">{gameState.inventory[cid]}</span>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">{CROPS[cid].name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Board */}
          <div className="bg-green-700 rounded-3xl shadow-lg p-6 border border-green-800 flex-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <i className="fa-solid fa-clipboard-list text-green-300"></i> Active Orders
            </h2>
            <div className="space-y-4">
              {gameState.orders.length === 0 ? (
                <div className="bg-green-800/50 rounded-2xl p-8 text-center border border-green-600/50 border-dashed">
                  <i className="fa-solid fa-hourglass-start text-green-400 text-3xl mb-3 block"></i>
                  <p className="text-green-300 font-bold text-sm">Waiting for customers...</p>
                </div>
              ) : (
                gameState.orders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    inventoryCount={gameState.inventory[order.cropId]}
                    onFulfill={fulfillOrder}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Win Modal */}
      {showWin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full text-center border-8 border-yellow-400 shadow-2xl animate-bounce-subtle">
            <div className="text-7xl mb-4">🏆</div>
            <h2 className="text-4xl font-black text-gray-800 mb-2">YOU WIN!</h2>
            <p className="text-lg text-gray-600 mb-8 font-medium">You've reached your goal of ${WIN_GOAL} and built a farming empire!</p>
            <div className="bg-gray-100 p-6 rounded-3xl mb-8">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-gray-400 uppercase text-xs">Total Earnings</span>
                <span className="font-black text-green-600">${gameState.stats.totalEarned}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-bold text-gray-400 uppercase text-xs">Crops Harvested</span>
                <span className="font-black text-amber-600">{gameState.stats.cropsHarvested}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-400 uppercase text-xs">Orders Fulfilled</span>
                <span className="font-black text-blue-600">{gameState.stats.ordersFulfilled}</span>
              </div>
            </div>
            <button 
              onClick={resetGame}
              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Loss Modal */}
      {showLoss && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full text-center border-8 border-red-400 shadow-2xl">
            <div className="text-7xl mb-4">🍂</div>
            <h2 className="text-4xl font-black text-gray-800 mb-2">GAME OVER</h2>
            <p className="text-lg text-gray-600 mb-8 font-medium">You ran out of funds and the farm has gone dry...</p>
            <button 
              onClick={resetGame}
              className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all"
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <footer className="mt-auto pt-8 pb-4 text-center">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
          Click plots to plant & harvest • Fulfill orders to grow your wealth • Goal: ${WIN_GOAL}
        </p>
      </footer>
    </div>
  );
};

export default App;
