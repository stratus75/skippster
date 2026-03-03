import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/shared/Layout';
import { FeedPage } from './pages/FeedPage';
import { FriendsPage } from './pages/FriendsPage';
import { GroupsPage } from './pages/GroupsPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { MessengerPage } from './pages/MessengerPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/messages" element={<MessengerPage />} />
        <Route path="/profile/:did" element={<ProfilePage />} />
      </Routes>
    </Layout>
  );
}

export default App;