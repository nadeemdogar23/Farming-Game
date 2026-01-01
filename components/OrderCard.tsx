
import React from 'react';
import { Order, CropId } from '../types';
import { CROPS } from '../constants';

interface OrderCardProps {
  order: Order;
  inventoryCount: number;
  onFulfill: (orderId: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, inventoryCount, onFulfill }) => {
  const crop = CROPS[order.cropId];
  const canFulfill = inventoryCount >= order.quantity;
  const timeProgress = (order.timeLeft / order.totalTime) * 100;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-3 relative overflow-hidden flex flex-col transition-all hover:shadow-md">
      <div 
        className={`absolute top-0 left-0 h-1 transition-all duration-1000 ${order.timeLeft < 10 ? 'bg-red-500' : 'bg-blue-400'}`}
        style={{ width: `${timeProgress}%` }}
      />
      
      <div className="flex justify-between items-start mb-2 mt-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{crop.icon}</span>
          <div>
            <h4 className="font-bold text-gray-800 text-sm">{order.quantity}x {crop.name}</h4>
            <span className="text-xs text-gray-400">Order #{order.id.slice(0, 4)}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="block font-bold text-green-600 text-sm">${order.reward}</span>
          <span className={`text-[10px] font-semibold ${order.timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
            <i className="fa-regular fa-clock mr-1"></i>
            {order.timeLeft}s
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-auto">
        <div className="flex-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded">
          Inventory: <span className={canFulfill ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{inventoryCount}</span>/{order.quantity}
        </div>
        <button
          onClick={() => onFulfill(order.id)}
          disabled={!canFulfill}
          className={`
            px-4 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-all
            ${canFulfill 
              ? 'bg-green-500 text-white hover:bg-green-600 active:scale-95' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
          `}
        >
          Deliver
        </button>
      </div>
    </div>
  );
};
