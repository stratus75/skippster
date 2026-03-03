import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/shared/Layout';
import { HomePage } from './pages/HomePage';
import { WatchPage } from './pages/WatchPage';
import { StudioPage } from './pages/StudioPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { TrendingPage } from './pages/TrendingPage';
import { ChannelPage } from './pages/ChannelPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/watch/:videoId" element={<WatchPage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/trending" element={<TrendingPage />} />
        <Route path="/channel/:did" element={<ChannelPage />} />
      </Routes>
    </Layout>
  );
}

export default App;