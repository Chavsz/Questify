import { useState, useEffect } from "react";
import { useTheme } from "../components/theme";
import { IoSunnyOutline } from "react-icons/io5";
import { FaRegMoon } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/authContexts/auth";
import { getUser, addItemToInventory, updateUser, type InventoryItem } from "../services/users";

interface ShopItem {
  id: number;
  name: string;
  price: number;
  emoji: string;
  description: string;
}


const Shop = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const authContext = useAuth();
  const user = authContext?.currentUser;
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [userCoins, setUserCoins] = useState(0);
  const [streak, setStreak] = useState<number | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setStreak(null);
        setLoadingStreak(false);
        setInventory([]);
        setUserCoins(0);
        return;
      }
      try {
        const userData = await getUser(user.uid);
        setStreak(userData && typeof userData.streak === 'number' ? userData.streak : 0);
        setInventory(userData?.inventory || []);
        setUserCoins(userData?.coins ?? 0);
      } catch (e) {
        setStreak(0);
        setInventory([]);
        setUserCoins(0);
      } finally {
        setLoadingStreak(false);
      }
    };
    fetchUserData();
  }, [user]);

  const shopItems: ShopItem[] = [
    { id: 1, name: "Healing Potion", price: 50, emoji: "🧪", description: "Restore 50 HP" },
    { id: 2, name: "Clue Token", price: 30, emoji: "🔍", description: "Get a hint" },
    { id: 3, name: "Warrior Helmet", price: 100, emoji: "⛑️", description: "+10 Defense" },
    { id: 4, name: "Magic Shield", price: 150, emoji: "🛡️", description: "+20 Defense" },
    { id: 5, name: "Speed Boots", price: 80, emoji: "👢", description: "+15 Speed" },
    { id: 6, name: "Gold Armor", price: 200, emoji: "🦺", description: "+30 Defense" },
    { id: 7, name: "Energy Drink", price: 40, emoji: "🥤", description: "Extra time" },
    { id: 8, name: "Lucky Charm", price: 120, emoji: "🍀", description: "Bonus points" }
  ];


  const openInventoryModal = () => setIsInventoryModalOpen(true);
  const closeInventoryModal = () => setIsInventoryModalOpen(false);

  const selectItem = (item: ShopItem) => {
    setSelectedItem(item);
  };

  const handlePurchase = async () => {
    if (!selectedItem) {
      alert('Please select an item to purchase');
      return;
    }
    if (userCoins < selectedItem.price) {
      alert(`Not enough coins! You need ${selectedItem.price} coins but only have ${userCoins} coins.`);
      return;
    }
    if (!user) {
      alert('You must be logged in to purchase items.');
      return;
    }
    // Deduct coins in Firestore and add item
    const newCoins = userCoins - selectedItem.price;
    await updateUser(user.uid, { coins: newCoins });
    setUserCoins(newCoins);
    await addItemToInventory(user.uid, {
      id: selectedItem.id,
      name: selectedItem.name,
      quantity: 1,
      emoji: selectedItem.emoji
    });
    // Refresh inventory and coins from Firestore
    const userData = await getUser(user.uid);
    setInventory(userData?.inventory || []);
    setUserCoins(userData?.coins ?? newCoins);
    alert(`✅ Purchase successful!\n\nYou bought: ${selectedItem.name}\nCost: ${selectedItem.price} coins\nRemaining coins: ${userData?.coins ?? newCoins}`);
    setSelectedItem(null);
  };

  const renderItems = () => {
    if (shopItems.length === 0) {
      return (
        <div className="text-center py-16 px-5 text-gray-500">
          <div className="text-6xl mb-5">📦</div>
          <p>No items to display</p>
        </div>
      );
    }
    return shopItems.map(item => {
      const isSelected = selectedItem?.id === item.id;
      return (
        <div
          key={item.id}
          className={`rounded-lg p-5 text-center transition-all duration-300 cursor-pointer border-3 border-transparent hover:-translate-y-1 hover:shadow-lg hover:border-green-500 ${
            isSelected 
              ? 'border-green-500 bg-green-50' 
              : isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
                : 'bg-white hover:bg-gray-50 border-gray-200'
          }`}
          onClick={() => selectItem(item as ShopItem)}
        >
          <div className="w-full h-32 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-lg mb-4 flex items-center justify-center text-5xl">
            {item.emoji}
          </div>
          <div className={`font-bold mb-3 text-base ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>{item.name}</div>
          <div className="text-red-500 font-bold text-sm">💰 {(item as ShopItem).price} Coins</div>
        </div>
      );
    });
  };

  const renderInventoryModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-gradient-to-br from-yellow-100 to-orange-200 rounded-3xl shadow-2xl p-8 w-full max-w-2xl border-4 border-yellow-400 flex flex-col items-center">
        <button
          onClick={closeInventoryModal}
          className="absolute top-4 right-4 text-2xl font-bold text-gray-700 hover:text-red-500 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
          aria-label="Close Inventory"
        >
          ×
        </button>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">🎒</span>
          <span className="text-2xl font-bold text-yellow-700">Backpack</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 w-full">
          {inventory.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              <div className="text-6xl mb-2">📦</div>
              <p>No items in your backpack</p>
            </div>
          ) : (
            inventory.map(item => (
              <div key={item.id} className="flex flex-col items-center bg-white rounded-xl shadow p-4 border-2 border-yellow-300">
                <div className="text-5xl mb-2">{item.emoji}</div>
                <div className="font-bold text-lg text-yellow-800 mb-1">{item.name}</div>
                <div className="text-green-600 font-semibold">x{item.quantity}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-indigo-100'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto p-5">
        {/* Header */}
        <header className={`flex justify-between items-center mb-10 p-6 rounded-2xl shadow-lg ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-purple-200'
        }`}>
          <div className="flex items-center gap-8">
            <div className={`px-6 py-4 rounded-xl font-bold text-lg shadow-md ${
              isDarkMode 
                ? 'bg-purple-600 text-white' 
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
            }`}>
              🎮 Questify
            </div>
            <div className={`px-6 py-4 rounded-xl font-bold text-lg shadow-md ${
              isDarkMode 
                ? 'bg-orange-600 text-white' 
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
            }`}>
              🔥 Streak: {loadingStreak ? '...' : `${streak ?? 0} day${streak === 1 ? '' : 's'}`}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-md ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
                  : 'bg-white hover:bg-gray-50 text-purple-900 border border-purple-300'
              }`}
            >
              {isDarkMode ? <IoSunnyOutline /> : <FaRegMoon />}
              <span>{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 mb-10">
          {/* Left Sidebar */}
          <aside className="flex flex-col gap-5">
            <div className={`p-4 rounded-lg text-center font-bold text-lg ${
              isDarkMode 
                ? 'bg-gray-800 text-white border border-gray-700' 
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border border-orange-300'
            }`}>
              💰 {userCoins} Coins
            </div>
            <div className={`p-5 rounded-lg text-center font-bold w-full ${
              isDarkMode 
                ? 'bg-gray-800 text-white border border-gray-700' 
                : 'bg-white text-gray-800 border border-gray-200'
            }`}>
              <div className={isDarkMode ? 'text-white' : 'text-gray-800'}>🏪 Shop Owner</div>
              <div className="w-full h-52 bg-gradient-to-br from-red-400 to-orange-500 rounded-lg mt-4 flex items-center justify-center text-6xl">
                🧙‍♂️
              </div>
            </div>
          </aside>

          {/* Display Area */}
          <main className={`rounded-2xl p-10 min-h-[500px] ${
            isDarkMode 
              ? 'bg-gray-800 text-white border border-gray-700' 
              : 'bg-white text-gray-800 border border-gray-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-8 text-center ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              🛒 Items for Purchase
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {renderItems()}
            </div>
          </main>
        </div>

        {/* Bottom Navigation */}
        <nav className="flex justify-between gap-5">
          <Link 
            to="/"
            className={`px-10 py-5 rounded-lg font-bold text-lg cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex-1 max-w-sm text-center ${
              isDarkMode 
                ? 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700' 
                : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
            }`}
          >
          Back to Hub
          </Link>
          <button 
            onClick={openInventoryModal}
            className={`px-10 py-5 rounded-lg font-bold text-lg cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex-1 max-w-sm ${
              isDarkMode 
                ? 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700' 
                : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            🎒 Inventory
          </button>
          <button 
            onClick={handlePurchase}
            disabled={!selectedItem}
            className={`border-none px-10 py-5 rounded-lg font-bold text-lg cursor-pointer transition-all duration-300 hover:-translate-y-0.5 flex-1 max-w-sm ${
              selectedItem 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {selectedItem ? `💳 Buy ${selectedItem.name} (${selectedItem.price} coins)` : '💳 Purchase'}
          </button>
        </nav>
      </div>
      {isInventoryModalOpen && renderInventoryModal()}
    </div>
  );
};

export default Shop;