import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlaySquare, Upload, TrendingUp, Users } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/trending', icon: TrendingUp, label: 'Trending' },
    { path: '/subscriptions', icon: Users, label: 'Subscriptions' },
    { path: '/studio', icon: Upload, label: 'Studio' },
  ];

  const isWatchPage = location.pathname.startsWith('/watch');

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#0f0f0f] border-b border-gray-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-tube-500 rounded-full flex items-center justify-center">
              <PlaySquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Skippster Tube</span>
          </Link>
        </div>

        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-[#121212] border border-gray-700 rounded-full px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="w-8 h-8 bg-tube-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">U</span>
          </div>
        </div>
      </header>

      <div className="flex pt-14">
        {!isWatchPage && (
          <aside className="fixed left-0 top-14 bottom-0 w-64 bg-[#0f0f0f] overflow-y-auto p-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-[#272727]' : 'hover:bg-[#272727]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        <main className={`flex-1 ${!isWatchPage ? 'ml-64' : ''} min-h-screen`}>
          {children}
        </main>
      </div>
    </div>
  );
}