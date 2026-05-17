// ArcGov — arcgov.vercel.app
import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800 py-4 px-4 md:px-8 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <span>ArcGov</span>
          <span className="mx-1">·</span>
          <span>Built on Arc Testnet</span>
          <span className="mx-1">·</span>
          <span>Chain ID 5042002</span>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="/embed" 
            className="hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Embed Widget
          </a>
          <a 
            href="https://github.com/arcgov" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Open Source on GitHub
          </a>
          <span>Not affiliated with Circle</span>
        </div>
      </div>
    </footer>
  );
}
