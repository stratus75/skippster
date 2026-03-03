import React, { useState } from 'react';
import { DollarSign, Lock, Zap, Check } from 'lucide-react';

export function MonetizationSettings() {
  const [activeTab, setActiveTab] = useState<'overview' | 'donations' | 'ppv' | 'subscription'>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'donations' as const, label: 'Donations' },
    { id: 'ppv' as const, label: 'Pay Per View' },
    { id: 'subscription' as const, label: 'Subscription' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Monetization</h2>
        <p className="text-gray-500">Manage how you earn from your content</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 border-b-2 font-medium transition-colors ${
                activeTab === tab.id ? 'border-white text-white' : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && <Overview />}
      {activeTab === 'donations' && <DonationSettings />}
      {activeTab === 'ppv' && <PayPerViewSettings />}
      {activeTab === 'subscription' && <SubscriptionSettings />}
    </div>
  );
}

function Overview() {
  const [lightningEnabled, setLightningEnabled] = useState(true);
  const [ppvEnabled, setPpvEnabled] = useState(false);
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false);

  const totalRevenue = 1234.56;
  const thisMonthRevenue = 234.50;

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1f1f1f] rounded-lg p-6">
          <p className="text-gray-500 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-green-500">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-[#1f1f1f] rounded-lg p-6">
          <p className="text-gray-500 mb-1">This Month</p>
          <p className="text-3xl font-bold text-social-500">${thisMonthRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Monetization Options */}
      <div>
        <h3 className="font-bold mb-4">Enabled Monetization</h3>
        <div className="space-y-3">
          <MonetizationOption
            title="Lightning Donations"
            description="Accept instant micropayments via Lightning Network"
            icon={Zap}
            enabled={lightningEnabled}
            onToggle={() => setLightningEnabled(!lightningEnabled)}
          />
          <MonetizationOption
            title="Pay Per View"
            description="Require one-time payment to access premium content"
            icon={Lock}
            enabled={ppvEnabled}
            onToggle={() => setPpvEnabled(!ppvEnabled)}
          />
          <MonetizationOption
            title="Channel Subscription"
            description="Offer exclusive content to monthly subscribers"
            icon={DollarSign}
            enabled={subscriptionEnabled}
            onToggle={() => setSubscriptionEnabled(!subscriptionEnabled)}
          />
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-[#1f1f1f] rounded-lg p-6">
        <h3 className="font-bold mb-4">Revenue Breakdown</h3>
        <div className="space-y-4">
          <RevenueBreakdown label="Donations" amount="$234.50" percent={45} />
          <RevenueBreakdown label="Pay Per View" amount="$156.78" percent={30} />
          <RevenueBreakdown label="Subscriptions" amount="$125.00" percent={25} />
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-[#1f1f1f] rounded-lg p-6">
        <h3 className="font-bold mb-4">Payment Methods</h3>
        <div className="space-y-3">
          <PaymentMethod name="Lightning Network" address="username@skippster.social" />
          <PaymentMethod name="Solana" address="7xKXt...3n9P" />
        </div>
        <button className="mt-4 text-tube-500 hover:text-tube-600 text-sm font-medium">
          + Add Payment Method
        </button>
      </div>
    </div>
  );
}

function DonationSettings() {
  const [lightningAddress, setLightningAddress] = useState('username@skippster.social');
  const [minimumTip, setMinimumTip] = useState(100);
  const [suggestedTips, setSuggestedTips] = useState([100, 500, 1000, 5000]);

  return (
    <div className="space-y-6">
      <div className="bg-[#1f1f1f] rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-bold mb-1">Lightning Network Donations</h3>
            <p className="text-gray-500 text-sm">
              Enable viewers to send you instant, low-fee micropayments via the Lightning Network.
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <span className="font-medium">Enable Lightning Donations</span>
          <button className="w-12 h-6 bg-tube-500 rounded-full relative">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Lightning Address</label>
        <input
          type="text"
          value={lightningAddress}
          onChange={(e) => setLightningAddress(e.target.value)}
          className="w-full bg-[#272727] rounded-lg px-4 py-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Minimum Tip (sats)</label>
        <input
          type="number"
          value={minimumTip}
          onChange={(e) => setMinimumTip(Number(e.target.value))}
          className="w-full bg-[#272727] rounded-lg px-4 py-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Suggested Tip Amounts (sats)</label>
        <div className="flex gap-2 flex-wrap">
          {suggestedTips.map((amount, index) => (
            <input
              key={index}
              type="number"
              value={amount}
              onChange={(e) => {
                const newAmounts = [...suggestedTips];
                newAmounts[index] = Number(e.target.value);
                setSuggestedTips(newAmounts);
              }}
              className="w-24 bg-[#272727] rounded-lg px-4 py-3"
            />
          ))}
          <button className="w-12 h-12 bg-[#272727] hover:bg-[#3d3d3d] rounded-lg flex items-center justify-center">
            +
          </button>
        </div>
      </div>

      <div className="bg-[#1f1f1f] rounded-lg p-6">
        <h3 className="font-bold mb-4">Recent Donations</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full" />
                <div>
                  <p className="font-medium">User {i}</p>
                  <p className="text-sm text-gray-500">For video: Welcome to Skippster Tube</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-yellow-500">💖 {1000 * i} sats</p>
                <p className="text-xs text-gray-500">{i}h ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PayPerViewSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-[#1f1f1f] rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold mb-1">Pay Per View</h3>
            <p className="text-gray-500 text-sm">
              Require viewers to pay a one-time fee to access your premium content.
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <span className="font-medium">Enable Pay Per View</span>
          <button className="w-12 h-6 bg-gray-700 rounded-full relative">
            <div className="absolute left-1 top-1 w-4 h-4 bg-gray-500 rounded-full" />
          </button>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4">
        <p className="text-sm text-gray-500">
          When enabled, you can set PPV pricing on individual videos. Revenue is split 90/10 in your favor,
          with 10% going to platform infrastructure costs.
        </p>
      </div>
    </div>
  );
}

function SubscriptionSettings() {
  const [enabled, setEnabled] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState('4.99');
  const [yearlyPrice, setYearlyPrice] = useState('49.99');

  return (
    <div className="space-y-6">
      <div className="bg-[#1f1f1f] rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-social-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6 text-social-500" />
          </div>
          <div>
            <h3 className="font-bold mb-1">Channel Subscription</h3>
            <p className="text-gray-500 text-sm">
              Offer exclusive content, early access, and perks to monthly subscribers.
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <span className="font-medium">Enable Subscription</span>
          <button className="w-12 h-6 bg-gray-700 rounded-full relative">
            <div className="absolute left-1 top-1 w-4 h-4 bg-gray-500 rounded-full" />
          </button>
        </div>
      </div>

      {enabled && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Monthly Price (USD)</label>
            <input
              type="number"
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              className="w-full bg-[#272727] rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Yearly Price (USD)</label>
            <input
              type="number"
              value={yearlyPrice}
              onChange={(e) => setYearlyPrice(e.target.value)}
              className="w-full bg-[#272727] rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <h4 className="font-medium mb-2">Subscriber Perks</h4>
            <div className="space-y-2">
              {['Early access to videos', 'Exclusive content', 'No ads', 'Custom badge', 'Members-only chat'].map(
                (perk) => (
                  <label key={perk} className="flex items-center gap-3 bg-[#1f1f1f] p-3 rounded-lg cursor-pointer hover:bg-[#272727]">
                    <div className="w-5 h-5 border-2 border-gray-600 rounded flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>{perk}</span>
                  </label>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MonetizationOption({
  title,
  description,
  icon: Icon,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between bg-[#1f1f1f] p-4 rounded-lg">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${enabled ? 'bg-tube-500' : 'bg-gray-700'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full relative transition-colors ${enabled ? 'bg-tube-500' : 'bg-gray-700'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${enabled ? 'right-1' : 'left-1'}`} />
      </button>
    </div>
  );
}

function RevenueBreakdown({ label, amount, percent }: { label: string; amount: string; percent: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span>{amount}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className="bg-social-500 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function PaymentMethod({ name, address }: { name: string; address: string }) {
  return (
    <div className="flex items-center justify-between bg-[#272727] p-4 rounded-lg">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-500">{address}</p>
      </div>
      <button className="text-gray-400 hover:text-white">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
    </div>
  );
}