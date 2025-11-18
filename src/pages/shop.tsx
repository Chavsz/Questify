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
  emoji: string; // emoji or image path
  slot: string;
  description: string;
}

const Shop = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const authContext = useAuth();
  const user = authContext?.currentUser;
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [modal, setModal] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ open: false, title: '', message: '', type: 'info' });
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
      emoji: "/items/HealthPotionMedium.png",
      description: "Restore 50 HP",
      slot: "inventory",
    },
    {
      id: 2,
      name: "Speedrun Key",
      price: 9999,
      category: "consumables",
      emoji: "/items/KeyIron.png",
      description: "Instantly finish a quest",
      slot: "inventory",
    },
    {
      id: 3,
      name: "Magic Shield",
      price: 150,
      category: "consumables",
      emoji: "/items/ShieldGold1.png",
      description: "+20 Defense",
      slot: "inventory",
    },
    {
      id: 4,
      name: "Energy Drink",
      price: 40,
      category: "consumables",
      emoji: "/items/ManaPotionMedium.png",
      description: "Bonus points",
      slot: "inventory",
    },
    {
      id: 5,
      name: "Lucky Charm",
      price: 120,
      category: "consumables",
      emoji: "/items/Ruby.png",
      description: "Bonus points",
      slot: "inventory",
    },
    
  ];

  const openInventoryModal = () => setIsInventoryModalOpen(true);
  const closeInventoryModal = () => setIsInventoryModalOpen(false);

  const selectItem = (item: ShopItem) => {
    setSelectedItem(item);
    setPurchaseQuantity(1);
  };

  const handlePurchase = async () => {
    if (!selectedItem) {
      setModal({ open: true, title: "No Item Selected", message: "Please select an item to purchase.", type: "error" });
      return;
    }
    if (purchaseQuantity < 1 || !Number.isInteger(purchaseQuantity)) {
      setModal({ open: true, title: "Invalid Quantity", message: "Please enter a valid quantity (1 or more).", type: "error" });
      return;
    }
    const totalCost = selectedItem.price * purchaseQuantity;
    if (userCoins < totalCost) {
      setModal({ open: true, title: "Not Enough Coins", message: `You need ${totalCost} coins but only have ${userCoins} coins.`, type: "error" });
      return;
    }
    if (!user) {
      setModal({ open: true, title: "Not Logged In", message: "You must be logged in to purchase items.", type: "error" });
      return;
    }
    // Deduct coins in Firestore and add item(s)
    const newCoins = userCoins - totalCost;
    await updateUser(user.uid, { coins: newCoins });
    setUserCoins(newCoins);
    await addItemToInventory(user.uid, {
      id: selectedItem.id,
      name: selectedItem.name,
      quantity: purchaseQuantity,
      emoji: selectedItem.emoji,
      slot: selectedItem.slot,
    });
    // Refresh inventory and coins from Firestore
    const userData = await getUser(user.uid);
    setInventory(filterInventoryItems(userData?.inventory || []));
    setUserCoins(userData?.coins ?? newCoins);
    setModal({
      open: true,
      title: "Purchase Successful!",
      message: `You bought: ${selectedItem.name} x${purchaseQuantity}\nCost: ${totalCost} coins\nRemaining coins: ${userData?.coins ?? newCoins}`,
      type: "success"
    });
    setSelectedItem(null);
    setPurchaseQuantity(1);
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
          className={`pixel-card p-5 text-center cursor-pointer ${
            isSelected
              ? isDarkMode
                ? "border-[#ffd700] ring-2 ring-[#ffd700]"
                : "border-amber-600 ring-2 ring-amber-400"
              : isDarkMode
              ? "bg-gray-700"
              : "bg-gray-50"
          }`}
          onClick={() => selectItem(item as ShopItem)}
        >
          <div className={`w-full h-32 mb-4 flex items-center justify-center text-5xl ${
            isDarkMode 
              ? "bg-gray-800" 
              : "bg-gray-100 border border-gray-300"
          }`}>
            {typeof item.emoji === 'string' && item.emoji.endsWith('.png')
              ? <img src={item.emoji} alt={item.name} className="object-contain w-20 h-20" style={{imageRendering:'pixelated'}} />
              : item.emoji}
          </div>
          <div
            className={`font-bold mb-3 text-base ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
          >
            {item.name}
          </div>
          <div className={`font-bold text-sm ${
            isDarkMode ? "text-yellow-300" : "text-yellow-700"
          }`}>
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
                <div className="text-5xl mb-2">
                  {typeof item.emoji === 'string' && item.emoji.endsWith('.png')
                    ? <img src={item.emoji} alt={item.name} className="object-contain w-14 h-14" style={{imageRendering:'pixelated'}} />
                    : item.emoji}
                </div>
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
  <div className="min-h-screen">
    {/* === HEADER === */}
    <header
      className={`pixel-header pixel-border flex justify-between items-center mb-6 p-6 ${
        isDarkMode
          ? "bg-gray-800"
          : "bg-white"
      }`}
    >
      {/* Streak */}
      <div
        className={`px-6 py-4 rounded-xl font-bold text-lg shadow-md ${
          isDarkMode
            ? "bg-orange-600 text-white"
            : "bg-gradient-to-r from-orange-500 to-red-500 text-white"
        }`}
      >
        Streak: {loadingStreak ? "..." : `${streak ?? 0} day${streak === 1 ? "" : "s"}`}
      </div>

      {/* Toggle Theme */}
      <button
        onClick={toggleDarkMode}
        className={`pixel-button pixel-button-red flex items-center gap-2 px-4 py-2 font-medium text-xs ${
          isDarkMode
            ? ""
            : ""
        }`}
      >
        {isDarkMode ? <IoSunnyOutline /> : <FaRegMoon />}
        <span>{isDarkMode ? "LIGHT" : "DARK"}</span>
      </button>
    </header>

    {/* === COINS DISPLAY (SEPARATE — not inside header) === */}
    <div className="flex justify-start mb-8">
      <div
        className={`pixel-card pixel-border px-8 py-5 font-bold text-xl shadow-md flex items-center gap-3 ${
          isDarkMode
            ? "text-yellow-300"
            : "text-yellow-800"
        }`}
      >
        🟡 {userCoins} Coins
      </div>
    </div>

    {/* === ITEMS SECTION === */}
    <main
      className={`pixel-card pixel-border p-10 mb-10 min-height-[500px] ${
        isDarkMode
          ? "bg-gray-800 text-white"
          : "bg-white text-gray-800"
      }`}
    >
      <h2
        className={`text-3xl font-bold mb-8 text-center pixel-text ${
          isDarkMode ? "text-[#ffd700]" : "text-amber-600"
        }`}
      >
        Items for Purchase
      </h2>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-7">
        {renderItems()}
      </div>
    </main>

    {/* === BOTTOM BUTTONS === */}
    <nav className="flex justify-end gap-5">
      <button
        onClick={openInventoryModal}
        className={`pixel-button pixel-button-red px-7 py-4 font-bold text-xs cursor-pointer ${
          isDarkMode
            ? ""
            : ""
        }`}
      >
        INVENTORY
      </button>

      {selectedItem && (
        <div className="flex items-center gap-3">
          <label htmlFor="quantity" className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Qty:</label>
          <input
            id="quantity"
            type="number"
            min={1}
            value={purchaseQuantity}
            onChange={e => setPurchaseQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className={`w-20 px-2 py-1 border-2 text-lg text-center ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-400 text-gray-800'
            }`}
            style={{ fontFamily: 'Press Start 2P, monospace', fontSize: '10px' }}
          />
        </div>
      )}
      <button
        onClick={handlePurchase}
        disabled={!selectedItem}
        className={`pixel-button px-7 py-4 font-bold text-xs cursor-pointer ${
          selectedItem
            ? "pixel-button-green"
            : "pixel-button-green opacity-50 cursor-not-allowed"
        }`}
      >
        {selectedItem
          ? `💳 BUY ${selectedItem.name.toUpperCase()} (${selectedItem.price * purchaseQuantity} COINS)`
          : "PURCHASE"}
      </button>
    </nav>

    {isInventoryModalOpen && renderInventoryModal()}
    {renderModal()}
  </div>
);


};

export default Shop;
