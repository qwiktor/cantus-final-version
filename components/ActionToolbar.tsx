import React from 'react';
import { SongInfo } from '../types';
import Spinner from './Spinner';

interface ActionToolbarProps {
  songs: SongInfo[];
  onDownload: () => void;
  onReset: () => void;
  isDownloading: boolean;
  downloadFileName: string;
  setDownloadFileName: (name: string) => void;
}

const ActionToolbar: React.FC<ActionToolbarProps> = ({ songs, onDownload, onReset, isDownloading, downloadFileName, setDownloadFileName }) => {
  return (
    <div className="absolute top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm p-4 shadow-lg z-20 flex items-start justify-between flex-wrap gap-4">
      <div className="flex-1 mr-4 min-w-[200px]">
        <h2 className="text-lg font-semibold text-white mb-2">Wykryte utwory</h2>
        <div className="text-sm text-gray-300 max-h-24 overflow-y-auto pr-2">
            {songs.length > 0 ? songs.map((song, index) => (
                <div key={index} className="flex justify-between items-center text-xs mb-1">
                    <span className="truncate pr-2" title={song.title}>{song.title}</span>
                    <span className="flex-shrink-0">s. {song.startPage}-{song.endPage}</span>
                </div>
            )) : (
              <p className="text-gray-400">Nie wykryto żadnych utworów.</p>
            )}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label htmlFor="filename" className="block text-sm font-medium text-gray-300 mb-1">Nazwa pliku</label>
          <input
            type="text"
            id="filename"
            value={downloadFileName}
            onChange={(e) => setDownloadFileName(e.target.value)}
            className="w-full sm:w-48 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
            placeholder="Uklad-Cantusow.pdf"
            disabled={isDownloading}
          />
        </div>
        <div className="flex items-end gap-2 pt-1 sm:pt-0 sm:self-end">
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400/50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {isDownloading ? (
              <>
                <Spinner className="w-4 h-4" />
                <span>Pobieranie...</span>
              </>
            ) : (
              "Pobierz PDF"
            )}
          </button>
          <button
            onClick={onReset}
            disabled={isDownloading}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 transition"
          >
            Resetuj
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionToolbar;
