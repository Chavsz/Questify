import { useState, useEffect } from "react";
import { getUser, type InventoryItem } from "../services/users";
import { useTheme } from "../components/theme";
import { IoSunnyOutline } from "react-icons/io5";
import { FaRegMoon } from "react-icons/fa";
import { useAuth } from "../contexts/authContexts/auth";
import MiniSwordManIdle from "../assets/MiniSwordManIdle.gif";
import MiniSwordManIdleAttack from "../assets/MiniSwordManIdleAttack.gif";
import MiniSwordManIdleHit from "../assets/MiniSwordManIdleHit.gif";
import MiniSwordManIdleWalk from "../assets/MiniSwordManIdleWalk.gif";


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
  const [userCoins, setUserCoins] = useState(0);
  const [modal, setModal] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ open: false, title: '', message: '', type: 'info' });
  const miniSwordCrew = [
    {
      id: "idle",
      label: "Idle",
      description: "Calm stance before the action starts.",
      image: MiniSwordManIdle
    },
    {
      id: "attack",
      label: "Attack",
      description: "Sword strike mid-animation.",
      image: MiniSwordManIdleAttack
    },
    {
      id: "hit",
      label: "Hit",
      description: "Taking a hit but staying on his feet.",
      image: MiniSwordManIdleHit
    },
    {
      id: "walk",
      label: "Walk",
      description: "Marching forward into the quest.",
      image: MiniSwordManIdleWalk
    }
  ];
  useEffect(() => {
    const fetchStreak = async () => {
      if (!user) {
        setStreak(null);
        setLoadingStreak(false);
        setUserCoins(0);
        return;
      }
      try {
        const userData = await getUser(user.uid);
        setStreak(userData && typeof userData.streak === 'number' ? userData.streak : 0);
        setUserCoins(userData?.coins ?? 0);
      } catch (e) {
        setStreak(0);
        setUserCoins(0);
      } finally {
        setLoadingStreak(false);
      }
    };
    fetchStreak();
  }, [user]);

  // Avatar items now come from user inventory (shop purchases)
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  useEffect(() => {
    const fetchInventory = async () => {
      if (!user) {
        setInventory([]);
        return;
      }
      const userData = await getUser(user.uid);
      setInventory(userData?.inventory || []);
    };
    fetchInventory();
  }, [user]);

  // Only show items that are wearable (have a slot)
  const avatarItems: AvatarItem[] = inventory
    .filter(item => typeof item.slot === "string" && ["head","body","feet","accessory","back","weapon","hands","ring"].includes(item.slot))
    .map(item => ({
      id: item.id,
      name: item.name,
      category: getCategoryFromSlot(item.slot ?? ""),
      emoji: item.emoji,
      slot: item.slot ?? ""
    }));

  function getCategoryFromSlot(slot: string) {
    switch (slot) {
      case "head": return "Headwear";
      case "body": return "Body";
      case "feet": return "Footwear";
      case "accessory": return "Accessory";
      case "back": return "Accessory";
      case "weapon": return "Weapon";
      case "hands": return "Accessory";
      case "ring": return "Accessory";
      default: return "Other";
    }
  }

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
          className={`rounded-lg p-6 text-center cursor-pointer hover:-translate-y-1 hover:shadow-lg ${
            isEquipped 
              ? 'border-indigo-600 border-3' 
              : isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 border' 
                : 'bg-white hover:bg-gray-50 border-gray-200 border'
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
      setModal({
        open: true,
        title: 'No Items Equipped',
        message: 'Select items to customize your character.',
        type: 'error'
      });
      return;
    }
    const itemsList = equipped.map(item => `${item.emoji} ${item.name}`).join('\n');
    setModal({
      open: true,
      title: 'Equipment Saved!',
      message: `Equipped items:\n${itemsList}`,
      type: 'success'
    });
  };
  // Modal component
  const renderModal = () => (
    modal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-4 flex flex-col items-center relative"
          style={{ borderColor: modal.type === 'success' ? '#22C55E' : modal.type === 'error' ? '#EF4444' : '#F59E42' }}>
          <button
            onClick={() => setModal({ ...modal, open: false })}
            className="absolute top-4 right-4 text-2xl font-bold text-gray-700 hover:text-red-500 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
            aria-label="Close Modal"
          >
            ×
          </button>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">
              {modal.type === 'success' && '✅'}
              {modal.type === 'error' && '❌'}
              {modal.type === 'info' && 'ℹ️'}
            </span>
            <span className={`text-2xl font-bold ${modal.type === 'success' ? 'text-green-600' : modal.type === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>{modal.title}</span>
          </div>
          <div className="text-gray-700 text-center whitespace-pre-line mb-2 text-lg">{modal.message}</div>
        </div>
      </div>
    )
  );

  return (
    <div>
      {renderModal()}
      <div className="">
        {/* Header */}
        <header className={`flex justify-between items-center mb-10 p-6 rounded-2xl ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-300'
        }`}>
          <div className="flex items-center gap-8">
            <div className={`px-6 py-4 rounded-xl font-bold text-lg shadow-md ${
              isDarkMode 
                ? 'bg-orange-600 text-white' 
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
            }`}>
              Streak: {loadingStreak ? '...' : `${streak ?? 0} day${streak === 1 ? '' : 's'}`}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover:scale-105 shadow-md ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
                  : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-300'
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
          <aside className="w-full max-w-xs shrink-0 flex flex-col gap-8 mx-auto lg:mx-0">
            {/* Gender Selection */}
            <div className="flex justify-center gap-4 mb-2">
              <button
                className={`px-5 py-2 rounded-lg font-bold hover:scale-105 flex items-center gap-2 text-base ${
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
                className={`px-5 py-2 rounded-lg font-bold hover:scale-105 flex items-center gap-2 text-base ${
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
            <div className={`p-6 rounded-2xl text-center font-bold text-lg ${
              isDarkMode 
                ? 'bg-gray-800 text-white border border-gray-700' 
                : 'bg-white text-gray-600 border border-gray-300'
            }`}>
              🟡 {userCoins} Coins
            </div>
            <div className={`p-6 rounded-2xl text-center font-bold w-full ${
              isDarkMode 
                ? 'bg-gray-800 text-white border border-gray-700' 
                : 'bg-white text-gray-600 border border-gray-300'
            }`}>
              <div className="text-xl mb-2"> Avatar Preview</div>
              <div className="w-full h-56 rounded-2xl mt-2 flex flex-col items-center justify-center text-white text-6xl relative overflow-hidden shadow-inner bg-gradient-to-br from-purple-600 to-indigo-700">
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
          <main className={`flex-1 rounded-2xl p-8 min-h-[500px] ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-300'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 text-center ${
              isDarkMode ? 'text-white' : 'text-gray-600'
            }`}>Customize Your Character</h2>
            <section className="mb-8">
              <h3 className={`text-xl font-semibold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                Mini Sword Squad
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {miniSwordCrew.map((character) => (
                  <div
                    key={character.id}
                    className={`rounded-xl p-5 flex flex-col items-center text-center shadow-md border ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`w-28 h-28 mb-4 rounded-lg flex items-center justify-center overflow-hidden border ${
                      isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                      <img
                        src={character.image}
                        alt={`${character.label} Mini Sword`}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    </div>
                    <p className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {character.label}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {character.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap justify-center">
              <button 
                className={`px-5 py-2 rounded-lg font-bold shadow-md hover:scale-105 ${
                  currentCategory === 'all' 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                onClick={() => filterByCategory('all')}
              >
                All Items
              </button>
              <button 
                className={`px-5 py-2 rounded-lg font-bold shadow-md hover:scale-105 ${
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
                className={`px-5 py-2 rounded-lg font-bold shadow-md hover:scale-105 ${
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
                className={`px-5 py-2 rounded-lg font-bold shadow-md hover:scale-105 ${
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
                className={`px-5 py-2 rounded-lg font-bold shadow-md hover:scale-105 ${
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
              <button 
                className={`px-5 py-2 rounded-lg font-bold shadow-md hover:scale-105 ${
                  currentCategory === 'Consumables' 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => filterByCategory('Consumables')}
              >
                💍 Consumables
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {renderItems()}
            </div>
          </main>
        </div>

        {/* Bottom Navigation */}
        <nav className="flex justify-end">
          <button 
            onClick={handleSaveEquipment}
            className="bg-green-600 text-white border-none px-7 py-4 rounded-xl font-bold text-lg cursor-pointer hover:bg-green-700 hover:shadow-xl"
          >
            Save Equipment
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Avatar;