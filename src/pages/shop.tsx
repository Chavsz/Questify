import { useState, useEffect } from "react";
import { useTheme } from "../components/theme";
import { IoSunnyOutline } from "react-icons/io5";
import { FaRegMoon } from "react-icons/fa";
import { useAuth } from "../contexts/authContexts/auth";
import {
  getUser,
  addItemToInventory,
  updateUser,
  type InventoryItem,
} from "../services/users";

interface ShopItem {
  id: number;
  name: string;
  price: number;
  category: string;
  emoji: string;
  slot: string;
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
  const filterInventoryItems = (items: InventoryItem[] = []) =>
    items.filter((item) => (item.slot ?? "inventory") === "inventory");

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
        setStreak(
          userData && typeof userData.streak === "number" ? userData.streak : 0
        );
        setInventory(filterInventoryItems(userData?.inventory || []));
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
    {
      id: 1,
      name: "Healing Potion",
      price: 50,
      category: "consumables",
      emoji: "🧪",
      description: "Restore 50 HP",
      slot: "inventory",
    },
    {
      id: 2,
      name: "Clue Token",
      price: 30,
      category: "Accessories",
      emoji: "🔍",
      description: "Get a hint",
      slot: "accessory",
    },
    {
      id: 3,
      name: "Magic Shield",
      price: 150,
      category: "Accessories",
      emoji: "🛡️",
      description: "+20 Defense",
      slot: "accessory",
    },
    {
      id: 4,
      name: "Energy Drink",
      price: 40,
      category: "Consumables",
      emoji: "🥤",
      description: "Extra time",
      slot: "inventory",
    },
    {
      id: 5,
      name: "Lucky Charm",
      price: 120,
      category: "Accessories",
      emoji: "🍀",
      description: "Bonus points",
      slot: "accessory",
    },
    {
      id: 6,
      name: "Warrior Helmet",
      price: 60,
      category: "Headwear",
      emoji: "⛑️",
      description: "Bonus points",
      slot: "head",
    },
    {
      id: 7,
      name: "Crown",
      price: 70,
      category: "Headwear",
      emoji: "👑",
      description: "Bonus points",
      slot: "head",
    },
    {
      id: 8,
      name: "Wizard Hat",
      price: 70,
      category: "Headwear",
      emoji: "🎩",
      description: "Bonus points",
      slot: "head",
    },
    {
      id: 9,
      name: "Gold Armor",
      price: 65,
      category: "Body",
      emoji: "🦺",
      description: "Bonus points",
      slot: "body",
    },
    {
      id: 10,
      name: "Blue Tunic",
      price: 85,
      category: "Body",
      emoji: "👕",
      description: "Bonus points",
      slot: "body",
    },
    {
      id: 11,
      name: "Leather Vest",
      price: 100,
      category: "Body",
      emoji: "🧥",
      description: "Bonus points",
      slot: "body",
    },
    {
      id: 12,
      name: "Speed Boots",
      price: 45,
      category: "Footwear",
      emoji: "👢",
      description: "Bonus points",
      slot: "feet",
    },
    {
      id: 13,
      name: "Iron Boots",
      price: 50,
      category: "Footwear",
      emoji: "🥾",
      description: "Bonus points",
      slot: "feet",
    },
    {
      id: 14,
      name: "Red Cape",
      price: 50,
      category: "Accessory",
      emoji: "🧣",
      description: "Bonus points",
      slot: "back",
    },
    {
      id: 15,
      name: "Iron Sword",
      price: 140,
      category: "Weapon",
      emoji: "⚔️",
      description: "Bonus points",
      slot: "weapon",
    },
    {
      id: 16,
      name: "Magic Wand",
      price: 90,
      category: "Weapon",
      emoji: "🪄",
      description: "Bonus points",
      slot: "weapon",
    },
    {
      id: 17,
      name: "Battle Axe",
      price: 80,
      category: "Weapon",
      emoji: "🪓",
      description: "Bonus points",
      slot: "weapon",
    },
    {
      id: 18,
      name: "Leather Gloves",
      price: 75,
      category: "Accessory",
      emoji: "🧤",
      description: "Bonus points",
      slot: "hands",
    },
    {
      id: 19,
      name: "Gold Ring",
      price: 90,
      category: "Accessory",
      emoji: "💍",
      description: "Bonus points",
      slot: "ring",
    },
  ];

  const openInventoryModal = () => setIsInventoryModalOpen(true);
  const closeInventoryModal = () => setIsInventoryModalOpen(false);

  const selectItem = (item: ShopItem) => {
    setSelectedItem(item);
  };

  const handlePurchase = async () => {
    if (!selectedItem) {
      alert("Please select an item to purchase");
      return;
    }
    if (userCoins < selectedItem.price) {
      alert(
        `Not enough coins! You need ${selectedItem.price} coins but only have ${userCoins} coins.`
      );
      return;
    }
    if (!user) {
      alert("You must be logged in to purchase items.");
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
      emoji: selectedItem.emoji,
      slot: selectedItem.slot,
    });
    // Refresh inventory and coins from Firestore
    const userData = await getUser(user.uid);
    setInventory(filterInventoryItems(userData?.inventory || []));
    setUserCoins(userData?.coins ?? newCoins);
    alert(
      `✅ Purchase successful!\n\nYou bought: ${selectedItem.name}\nCost: ${
        selectedItem.price
      } coins\nRemaining coins: ${userData?.coins ?? newCoins}`
    );
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
    return shopItems.map((item) => {
      const isSelected = selectedItem?.id === item.id;
      return (
        <div
          key={item.id}
          className={`rounded-lg p-5 text-center cursor-pointer hover:-translate-y-1 hover:shadow-lg ${
            isSelected
              ? "border-indigo-600 border-3"
              : isDarkMode
              ? "bg-gray-700 hover:bg-gray-600 border-gray-700 border"
              : " border-gray-300 hover:bg-gray-50 border"
          }`}
          onClick={() => selectItem(item as ShopItem)}
        >
          <div className="w-full h-32 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-lg mb-4 flex items-center justify-center text-5xl">
            {item.emoji}
          </div>
          <div
            className={`font-bold mb-3 text-base ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
          >
            {item.name}
          </div>
          <div className="text-red-500 font-bold text-sm">
            💰 {(item as ShopItem).price} Coins
          </div>
        </div>
      );
    });
  };

  const renderInventoryModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl border border-gray-500 flex flex-col items-center">
        <button
          onClick={closeInventoryModal}
          className="absolute top-4 right-4 text-2xl font-bold text-gray-700 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
          aria-label="Close Inventory"
        >
          ×
        </button>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-bold text-indigo-600">Backpack</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 w-full">
          {inventory.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              <div className="text-6xl mb-2">📦</div>
              <p>No items in your backpack</p>
            </div>
          ) : (
            inventory.map(item => (
              <div key={item.id} className="flex flex-col items-center bg-white rounded-xl shadow p-4 border-2 border-gray-500">
                <div className="text-5xl mb-2">{item.emoji}</div>
                <div className="font-bold text-lg text-indigo-600 mb-1">{item.name}</div>
                <div className="text-gray-600 font-semibold">x{item.quantity}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen ">
      <div className="">
        {/* Header */}
        <header
          className={`flex justify-between items-center mb-10 p-6 rounded-2xl ${
            isDarkMode
              ? "bg-gray-800 border border-gray-700"
              : "bg-white border border-gray-300"
          }`}
        >
          <div className="flex items-center gap-8">
            <div
              className={`px-6 py-4 rounded-xl font-bold text-lg shadow-md ${
                isDarkMode
                  ? "bg-orange-600 text-white"
                  : "bg-gradient-to-r from-orange-500 to-red-500 text-white"
              }`}
            >
              Streak:{" "}
              {loadingStreak
                ? "..."
                : `${streak ?? 0} day${streak === 1 ? "" : "s"}`}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover:scale-105 shadow-md ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
                  : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-300"
              }`}
            >
              {isDarkMode ? <IoSunnyOutline /> : <FaRegMoon />}
              <span>{isDarkMode ? "Light" : "Dark"}</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 mb-10">
          {/* Left Sidebar */}
          <aside className="flex flex-col gap-5">
            <div
              className={`p-4 rounded-lg text-center font-bold text-lg ${
                isDarkMode
                  ? "bg-gray-800 text-white border border-gray-700"
                  : "bg-white text-gray-600 border border-gray-300"
              }`}
            >
              🟡 {userCoins} Coins
            </div>
            <div
              className={`p-5 rounded-lg text-center font-bold w-full ${
                isDarkMode
                  ? "bg-gray-800 text-white border border-gray-700"
                  : "bg-white text-gray-800 border border-gray-200"
              }`}
            >
              <div className={isDarkMode ? "text-white" : "text-gray-800"}>
                Shop Owner
              </div>
              <div className="w-full h-52 bg-gradient-to-br from-red-400 to-orange-500 rounded-lg mt-4 flex items-center justify-center text-6xl">
                🧙‍♂️
              </div>
            </div>
          </aside>

          {/* Display Area */}
          <main
            className={`rounded-2xl p-10 min-h-[500px] ${
              isDarkMode
                ? "bg-gray-800 text-white border border-gray-700"
                : "bg-white text-gray-800 border border-gray-200"
            }`}
          >
            <h2
              className={`text-2xl font-bold mb-8 text-center ${
                isDarkMode ? "text-white" : "text-gray-600"
              }`}
            >
              Items for Purchase
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {renderItems()}
            </div>
          </main>
        </div>

        {/* Bottom Navigation */}
        <nav className="flex justify-end gap-5">
          <button
            onClick={openInventoryModal}
            className={`px-7 py-4 rounded-lg font-bold text-lg cursor-pointer hover:shadow-lg ${
              isDarkMode
                ? "bg-gray-600 text-white border border-gray-700 hover:bg-gray-700"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Inventory
          </button>
          <button
            onClick={handlePurchase}
            disabled={!selectedItem}
            className={`border-none px-7 py-4 rounded-lg font-bold text-lg cursor-pointer hover:shadow-lg ${
              selectedItem
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {selectedItem
              ? `💳 Buy ${selectedItem.name} (${selectedItem.price} coins)`
              : "Purchase"}
          </button>
        </nav>
      </div>
      {isInventoryModalOpen && renderInventoryModal()}
    </div>
  );
};

export default Shop;
