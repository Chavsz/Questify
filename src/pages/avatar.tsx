import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../components/theme";
import { IoSunnyOutline } from "react-icons/io5";
import { FaRegMoon } from "react-icons/fa";
import { useAuth } from "../contexts/authContexts/auth";
import { getUser } from "../services/users";

interface AvatarItem {
  id: number;
  name: string;
  category: string;
  emoji: string;
  slot: string;
}

const Avatar = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const authContext = useAuth();
  const user = authContext?.currentUser;
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [equippedItems, setEquippedItems] = useState<Map<string, AvatarItem>>(new Map());
  const [currentCategory, setCurrentCategory] = useState('all');
  const [streak, setStreak] = useState<number | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(true);
  useEffect(() => {
    const fetchStreak = async () => {
      if (!user) {
        setStreak(null);
        setLoadingStreak(false);
        return;
      }
      try {
        const userData = await getUser(user.uid);
        setStreak(userData && typeof userData.streak === 'number' ? userData.streak : 0);
      } catch (e) {
        setStreak(0);
      } finally {
        setLoadingStreak(false);
      }
    };
    fetchStreak();
  }, [user]);

  // Avatar customization items with categories
  const avatarItems: AvatarItem[] = [
    { id: 1, name: "Warrior Helmet", category: "Headwear", emoji: "⛑️", slot: "head" },
    { id: 2, name: "Crown", category: "Headwear", emoji: "👑", slot: "head" },
    { id: 3, name: "Wizard Hat", category: "Headwear", emoji: "🎩", slot: "head" },
    { id: 4, name: "Gold Armor", category: "Body", emoji: "🦺", slot: "body" },
    { id: 5, name: "Blue Tunic", category: "Body", emoji: "👕", slot: "body" },
    { id: 6, name: "Leather Vest", category: "Body", emoji: "🧥", slot: "body" },
    { id: 7, name: "Speed Boots", category: "Footwear", emoji: "👢", slot: "feet" },
    { id: 8, name: "Iron Boots", category: "Footwear", emoji: "🥾", slot: "feet" },
    { id: 9, name: "Magic Shield", category: "Accessory", emoji: "🛡️", slot: "accessory" },
    { id: 10, name: "Red Cape", category: "Accessory", emoji: "🧣", slot: "back" },
    { id: 11, name: "Iron Sword", category: "Weapon", emoji: "⚔️", slot: "weapon" },
    { id: 12, name: "Magic Wand", category: "Weapon", emoji: "🪄", slot: "weapon" },
    { id: 13, name: "Battle Axe", category: "Weapon", emoji: "🪓", slot: "weapon" },
    { id: 14, name: "Leather Gloves", category: "Accessory", emoji: "🧤", slot: "hands" },
    { id: 15, name: "Gold Ring", category: "Accessory", emoji: "💍", slot: "ring" },
  ];

  const filterByCategory = (category: string) => {
    setCurrentCategory(category);
  };

  const equipItem = (item: AvatarItem) => {
    const currentEquipped = equippedItems.get(item.slot);
    
    if (currentEquipped?.id === item.id) {
      // Unequip if clicking the same item
      const newEquipped = new Map(equippedItems);
      newEquipped.delete(item.slot);
      setEquippedItems(newEquipped);
    } else {
      // Equip the new item (replaces any item in the same slot)
      const newEquipped = new Map(equippedItems);
      newEquipped.set(item.slot, item);
      setEquippedItems(newEquipped);
    }
  };

  const renderItems = () => {
    const filteredItems = currentCategory === 'all' 
      ? avatarItems 
      : avatarItems.filter(item => item.category === currentCategory);

    if (filteredItems.length === 0) {
      return (
        <div className="text-center py-16 px-5 text-gray-500">
          <div className="text-6xl mb-5">📦</div>
          <p>No items in this category</p>
        </div>
      );
    }

    return filteredItems.map(item => {
      const isEquipped = equippedItems.get(item.slot)?.id === item.id;
      return (
        <div
          key={item.id}
          className={`rounded-xl p-6 text-center transition-all duration-300 cursor-pointer border-2 border-transparent hover:-translate-y-2 hover:shadow-xl hover:scale-105 ${
            isEquipped 
              ? 'border-red-500 bg-red-50 shadow-lg' 
              : isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
                : 'bg-white hover:bg-gray-50 border-gray-200'
          } shadow-md`}
          onClick={() => equipItem(item)}
        >
          <div className={`w-full h-28 rounded-xl mb-4 flex items-center justify-center text-5xl shadow-inner ${
            isDarkMode 
              ? 'bg-gradient-to-br from-indigo-500 to-purple-700' 
              : 'bg-gradient-to-br from-indigo-400 to-purple-600'
          }`}>
            {item.emoji}
          </div>
          <div className={`font-bold mb-2 text-sm ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>{item.name}</div>
          <div className={`text-xs mb-3 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>{item.category}</div>
          {isEquipped && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
              ✓ EQUIPPED
            </span>
          )}
        </div>
      );
    });
  };

  const updateAvatarPreview = () => {
    const equipped = Array.from(equippedItems.values());
    const baseAvatar = gender === 'male' ? '🧑‍🦱' : '👩‍🦰';
    if (equipped.length > 0) {
      const emojis = [baseAvatar, ...equipped.map(item => item.emoji)].join(' ');
      return (
        <div className="text-4xl leading-relaxed">{emojis}</div>
      );
    } else {
      return <div className="text-6xl">{baseAvatar}</div>;
    }
  };

  const updateEquippedList = () => {
    const equipped = Array.from(equippedItems.values());
    
    if (equipped.length === 0) {
      return (
        <div className="text-center text-gray-500">No items equipped</div>
      );
    }

    return equipped.map(item => (
      <div key={item.id} className="p-1 bg-gray-100 my-1 rounded text-xs">
        {item.emoji} {item.name}
      </div>
    ));
  };

  const handleSaveEquipment = () => {
    const equipped = Array.from(equippedItems.values());
    
    if (equipped.length === 0) {
      alert('⚠️ No items equipped!\n\nSelect items to customize your character.');
      return;
    }

    const itemsList = equipped.map(item => `${item.emoji} ${item.name}`).join('\n');
    alert(`✅ Equipment saved successfully!\n\nEquipped items:\n${itemsList}`);
  };

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
        <div className="flex flex-col lg:flex-row gap-10 mb-10">
          {/* Left Sidebar */}
          <aside className="w-full max-w-xs flex-shrink-0 flex flex-col gap-8 mx-auto lg:mx-0">
            {/* Gender Selection */}
            <div className="flex justify-center gap-4 mb-2">
              <button
                className={`px-5 py-2 rounded-lg font-bold transition-all duration-300 shadow-md hover:scale-105 flex items-center gap-2 text-base ${
                  gender === 'male'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => setGender('male')}
              >
                🧑‍🦱 Male
              </button>
              <button
                className={`px-5 py-2 rounded-lg font-bold transition-all duration-300 shadow-md hover:scale-105 flex items-center gap-2 text-base ${
                  gender === 'female'
                    ? 'bg-pink-500 text-white shadow-lg'
                    : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => setGender('female')}
              >
                👩‍🦰 Female
              </button>
            </div>
            <div className={`p-6 rounded-2xl text-center font-bold text-lg shadow-lg ${
              isDarkMode 
                ? 'bg-gray-800 text-yellow-400 border border-gray-700' 
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
            }`}>
              💰 1,250 Coins
            </div>
            <div className={`p-6 rounded-2xl text-center font-bold w-full shadow-lg ${
              isDarkMode 
                ? 'bg-gray-800 text-white border border-gray-700' 
                : 'bg-white text-purple-900 border border-purple-200'
            }`}>
              <div className="text-xl mb-2">⚔️ Avatar Preview</div>
              <div className={`w-full h-56 rounded-2xl mt-2 flex flex-col items-center justify-center text-white text-6xl relative overflow-hidden shadow-inner ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-700' 
                  : 'bg-gradient-to-br from-indigo-400 to-purple-600'
              }`}>
                {updateAvatarPreview()}
              </div>
              <div className={`mt-3 text-left text-xs max-h-20 overflow-y-auto p-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {updateEquippedList()}
              </div>
            </div>
          </aside>

          {/* Items Display Area */}
          <main className="flex-1 rounded-2xl p-8 min-h-[500px] shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h2 className={`text-3xl font-bold mb-6 text-center ${
              isDarkMode ? 'text-white' : 'text-purple-900'
            }`}>🎨 Customize Your Character</h2>
            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap justify-center">
              <button 
                className={`px-5 py-2 rounded-lg font-bold transition-all duration-300 shadow-md hover:scale-105 ${
                  currentCategory === 'all' 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => filterByCategory('all')}
              >
                All Items
              </button>
              <button 
                className={`px-5 py-2 rounded-lg font-bold transition-all duration-300 shadow-md hover:scale-105 ${
                  currentCategory === 'Headwear' 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => filterByCategory('Headwear')}
              >
                👑 Headwear
              </button>
              <button 
                className={`px-5 py-2 rounded-lg font-bold transition-all duration-300 shadow-md hover:scale-105 ${
                  currentCategory === 'Body' 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => filterByCategory('Body')}
              >
                🦺 Body
              </button>
              <button 
                className={`px-5 py-2 rounded-lg font-bold transition-all duration-300 shadow-md hover:scale-105 ${
                  currentCategory === 'Weapon' 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => filterByCategory('Weapon')}
              >
                ⚔️ Weapon
              </button>
              <button 
                className={`px-5 py-2 rounded-lg font-bold transition-all duration-300 shadow-md hover:scale-105 ${
                  currentCategory === 'Accessory' 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => filterByCategory('Accessory')}
              >
                💍 Accessories
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {renderItems()}
            </div>
          </main>
        </div>

        {/* Bottom Navigation */}
        <nav className="flex justify-between gap-6">
          <Link to="/"
            className={`px-10 py-5 rounded-xl font-bold text-lg cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex-1 max-w-sm text-center shadow-lg ${
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600' 
                : 'bg-white hover:bg-gray-50 text-purple-900 border border-purple-300'
            }`}
          >
            🏠 Back to Hub
          </Link>
          <button 
            onClick={handleSaveEquipment}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white border-none px-10 py-5 rounded-xl font-bold text-lg cursor-pointer transition-all duration-300 hover:from-green-600 hover:to-green-700 hover:-translate-y-1 hover:shadow-xl flex-1 max-w-sm shadow-lg"
          >
            💾 Save Equipment
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Avatar;