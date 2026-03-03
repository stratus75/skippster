import React from 'react';
import { Plus, Search, Filter, MapPin, DollarSign } from 'lucide-react';

export function MarketplacePage() {
  const [category, setCategory] = React.useState<string>('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'items', label: 'Items' },
    { id: 'services', label: 'Services' },
    { id: 'housing', label: 'Housing' },
  ];

  const listings = [
    {
      id: '1',
      title: 'MacBook Pro 16" M3',
      description: 'Like new, used for 6 months. Comes with charger and original box.',
      price: 2200,
      currency: 'USD',
      category: 'items',
      location: 'San Francisco, CA',
      image: '',
      seller: 'Alice Johnson',
      time: '2h ago',
    },
    {
      id: '2',
      title: 'Web Development Services',
      description: 'Full-stack developer available for React, Node.js, and Web3 projects.',
      price: 100,
      currency: 'USD',
      category: 'services',
      location: 'Remote',
      image: '',
      seller: 'Bob Developer',
      time: '5h ago',
    },
    {
      id: '3',
      title: '1BR Apartment in Downtown',
      description: 'Modern apartment with great views. Available for immediate move-in.',
      price: 2500,
      currency: 'USD',
      category: 'housing',
      location: 'New York, NY',
      image: '',
      seller: 'Carol Properties',
      time: '1d ago',
    },
    {
      id: '4',
      title: 'Sony A7III Camera',
      description: 'Excellent condition, includes 2 lenses and camera bag.',
      price: 1500,
      currency: 'USD',
      category: 'items',
      location: 'Los Angeles, CA',
      image: '',
      seller: 'David Photography',
      time: '3d ago',
    },
  ];

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <button className="bg-social-500 hover:bg-social-600 px-4 py-2 rounded font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Listing
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search marketplace"
          className="pl-12 pr-4 py-3 bg-[#242526] rounded-lg"
        />
        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-[#3a3b3c] rounded-lg transition-colors">
          <Filter className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
              category === cat.id
                ? 'bg-social-500 text-white'
                : 'bg-[#242526] hover:bg-[#3a3b3c] text-gray-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {listings.map((listing) => (
          <div key={listing.id} className="bg-[#242526] rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            {/* Image */}
            <div className="aspect-[4/3] bg-[#3a3b3c] relative">
              {listing.image ? (
                <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  {listing.category === 'items' && '📦'}
                  {listing.category === 'services' && '🛠️'}
                  {listing.category === 'housing' && '🏠'}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium line-clamp-2">{listing.title}</h3>
              </div>

              <div className="flex items-center gap-2 text-social-500 font-bold text-lg mb-2">
                <DollarSign className="w-5 h-5" />
                {listing.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-500">{listing.currency}</span>
              </div>

              <p className="text-sm text-gray-400 line-clamp-2 mb-3">{listing.description}</p>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <MapPin className="w-3 h-3" />
                {listing.location}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{listing.seller}</span>
                <span>{listing.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}