
import React from 'react';
import { Plot, PlotStatus, CropId } from '../types';
import { CROPS } from '../constants';

interface PlotProps {
  plot: Plot;
  selectedCrop: CropId;
  onPlant: (plotId: number) => void;
  onHarvest: (plotId: number) => void;
}

export const FarmPlot: React.FC<PlotProps> = ({ plot, selectedCrop, onPlant, onHarvest }) => {
  const crop = plot.cropId ? CROPS[plot.cropId] : null;

  const handleClick = () => {
    if (plot.status === PlotStatus.EMPTY) {
      onPlant(plot.id);
    } else if (plot.status === PlotStatus.READY) {
      onHarvest(plot.id);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        relative w-full aspect-square border-2 rounded-xl cursor-pointer 
        transition-all duration-200 transform hover:scale-105 active:scale-95
        flex flex-col items-center justify-center overflow-hidden
        ${plot.status === PlotStatus.EMPTY ? 'border-dashed border-green-200 bg-green-50/30 hover:bg-green-100/50' : ''}
        ${plot.status === PlotStatus.GROWING ? 'border-amber-200 bg-amber-50' : ''}
        ${plot.status === PlotStatus.READY ? 'border-green-400 bg-green-100 shadow-lg animate-bounce-subtle' : ''}
      `}
    >
      {plot.status === PlotStatus.EMPTY && (
        <div className="text-green-300 group-hover:text-green-500 flex flex-col items-center">
          <i className="fa-solid fa-plus text-xl mb-1"></i>
          <span className="text-[10px] font-bold uppercase tracking-wider">Empty</span>
        </div>
      )}

      {plot.status === PlotStatus.GROWING && crop && (
        <div className="flex flex-col items-center w-full px-2">
          <span className="text-2xl mb-1 opacity-60">{crop.icon}</span>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden border border-gray-100">
            <div 
              className="h-full bg-green-500 transition-all duration-1000" 
              style={{ width: `${plot.progress}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-amber-700 mt-1">{Math.ceil(plot.progress)}%</span>
        </div>
      )}

      {plot.status === PlotStatus.READY && crop && (
        <div className="flex flex-col items-center animate-pulse">
          <span className="text-3xl mb-1">{crop.icon}</span>
          <span className="bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shadow-sm">
            Harvest
          </span>
        </div>
      )}
    </div>
  );
};
