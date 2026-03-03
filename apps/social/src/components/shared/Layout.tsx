import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Store, MessageCircle, MoreHorizontal } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Feed' },
    { path: '/friends', icon: Users, label: 'Friends' },
    { path: '/marketplace', icon: Store, label: 'Marketplace' },
    { path: '/groups', icon: Users, label: 'Groups' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
  ];

  return (
    <div className="min-h-screen bg-[#18191a]">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-14 bg-[#242526] border-b border-[#3e4042] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-social-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-bold text-social-500 hidden sm:block">Skippster Social</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <input type="text" placeholder="Search Skippster Social" className="w-full" />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Link to="/" className="w-10 h-10 bg-[#3a3b3c] hover:bg-[#4e4f50] rounded-full flex items-center justify-center transition-colors">
            <Home className="w-5 h-5" />
          </Link>
          <Link to="/marketplace" className="w-10 h-10 bg-[#3a3b3c] hover:bg-[#4e4f50] rounded-full flex items-center justify-center transition-colors">
            <Store className="w-5 h-5" />
          </Link>
          <Link to="/groups" className="w-10 h-10 bg-[#3a3b3c] hover:bg-[#4e4f50] rounded-full flex items-center justify-center transition-colors">
            <Users className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 bg-social-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">U</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex pt-14">
        {/* Left Sidebar - Desktop */}
        <aside className="hidden lg:block fixed left-0 top-14 bottom-0 w-64 p-4 overflow-y-auto">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive ? 'bg-[#3a3b3c]' : 'hover:bg-[#3a3b3c]'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <hr className="border-[#3e4042] my-2" />
            <Link
              to="/tube"
              className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium hover:bg-[#3a3b3c] transition-colors"
            >
              <div className="w-6 h-6 bg-tube-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">T</span>
              </div>
              <span>Go to Tube</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 lg:mr-80">
          {children}
        </main>

        {/* Right Sidebar - Desktop */}
        <aside className="hidden lg:block fixed right-0 top-14 bottom-0 w-80 p-4 overflow-y-auto">
          <div className="sticky top-0">
            <h3 className="text-xl font-bold mb-4">Sponsored</h3>
            <div className="space-y-3 mb-6">
              <SponsoredAd title="Decentralize Your Social" />
              <SponsoredAd title="Web3 Development Course" />
            </div>

            <hr className="border-[#3e4042] my-4" />

            <h3 className="text-xl font-bold mb-4">Contacts</h3>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 hover:bg-[#3a3b3c] rounded-lg p-2 cursor-pointer">
                  <div className="w-9 h-9 bg-[#3a3b3c] rounded-full" />
                  <span>User {i}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SponsoredAd({ title }: { title: string }) {
  return (
    <div className="flex gap-3 p-2 rounded-lg hover:bg-[#3a3b3c] cursor-pointer">
      <div className="w-32 h-20 bg-[#3a3b3c] rounded flex-shrink-0" />
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-gray-500 mt-1">skippster.social</p>
      </div>
    </div>
  );
}