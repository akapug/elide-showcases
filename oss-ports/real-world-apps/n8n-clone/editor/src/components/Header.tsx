import React from 'react';
import { Menu, List, Bell, User } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onShowExecutions: () => void;
}

export function Header({ onToggleSidebar, onShowExecutions }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onShowExecutions}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <List className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
