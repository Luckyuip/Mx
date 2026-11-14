import React from 'react';
import { PlaySquare, FolderPlus, Search, RefreshCw } from 'lucide-react';

export default function Header({ onScanStorage, onPickFile, searchQuery, setSearchQuery, isScanning }) {
  return (
    <header className="sticky top-0 z-20 bg-[#181818] border-b border-gray-800 px-4 py-3 shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-mxBlue p-1.5 rounded-lg">
            <PlaySquare className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-xl font-bold tracking-wide text-white">
            MX <span className="text-mxBlue font-normal">Player</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onScanStorage}
            disabled={isScanning}
            className="flex items-center gap-1.5 bg-[#262626] hover:bg-[#303030] active:scale-95 transition px-3 py-2 rounded-full text-xs font-medium border border-gray-700"
            title="Scan Phone Videos"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-mxBlue ${isScanning ? 'animate-spin' : ''}`} />
            <span>Scan</span>
          </button>

          <button
            onClick={onPickFile}
            className="flex items-center gap-1.5 bg-mxBlue hover:bg-blue-600 active:scale-95 transition px-3 py-2 rounded-full text-xs font-medium shadow"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Open File</span>
          </button>
        </div>
      </div>

      <div className="mt-3 relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search MKV, AVI, MP4, HEVC videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#242424] text-sm text-white placeholder-gray-400 pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-mxBlue"
        />
      </div>
    </header>
  );
}
