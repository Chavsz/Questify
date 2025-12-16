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

import FireGif from "../assets/Fire.gif";

interface ShopItem {
  id: number;
  name: string;
  price: number;
  category: string;
  emoji: string; // emoji or image path
  slot: string;
  description: string;
  characterId?: string; // For character unlocks
  skinFor?: string; // character id this skin applies to
}

const Shop = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const authContext = useAuth();
  const user = authContext?.currentUser;
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [modal, setModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({ open: false, title: "", message: "", type: "info" });
  const [userCoins, setUserCoins] = useState(0);
  const [streak, setStreak] = useState<number | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
  const [unlockedCharacters, setUnlockedCharacters] = useState<string[]>(["idle"]);
  const filterInventoryItems = (items: InventoryItem[] = []) =>
    items.filter((item) => (item.slot ?? "inventory") === "inventory");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setStreak(null);
        setLoadingStreak(false);
        setInventory([]);
        setUserCoins(0);
        setUnlockedCharacters(["idle"]);
        return;
      }
      try {
        const userData = await getUser(user.uid);
        setStreak(
          userData && typeof userData.streak === "number" ? userData.streak : 0
        );
        setInventory(filterInventoryItems(userData?.inventory || []));
        setAllInventory(userData?.inventory || []);
        setUserCoins(userData?.coins ?? 0);
        setUnlockedCharacters(userData?.unlockedCharacters || ["idle"]);
      } catch (e) {
        setStreak(0);
        setInventory([]);
        setUserCoins(0);
        setUnlockedCharacters(["idle"]);
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
      description: "Restore 1 heart (if not full)",
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
      description: "Block next wrong answer",
      slot: "inventory",
    },
    {
      id: 4,
      name: "Energy Drink",
      price: 40,
      category: "consumables",
      emoji: "/items/ManaPotionMedium.png",
      description: "Skip this question",
      slot: "inventory",
    },
    {
      id: 5,
      name: "Lucky Charm",
      price: 120,
      category: "consumables",
      emoji: "/items/Ruby.png",
      description: "Auto-correct one wrong answer",
      slot: "inventory",
    },
    // Skins
    {
      id: 101,
      name: "Mini Shieldman",
      price: 400,
      category: "skins",
      emoji: "/assets/MiniShieldIdle.gif",
      description: "Skin for Mini Swordman",
      slot: "skin",
      skinFor: "idle",
    },
    {
      id: 102,
      name: "Mini Halberdman",
      price: 400,
      category: "skins",
      emoji: "/assets/MiniHalberdIdle.gif",
      description: "Skin for Mini Spearman",
      slot: "skin",
      skinFor: "idle1",
    },
    {
      id: 103,
      name: "Mini Crossbow",
      price: 400,
      category: "skins",
      emoji: "/assets/MiniCrossBowIdle.gif",
      description: "Skin for Mini Archer",
      slot: "skin",
      skinFor: "idle2",
    },
    {
      id: 104,
      name: "Mini Archmage",
      price: 500,
      category: "skins",
      emoji: "/assets/MiniArchMageIdle.gif",
      description: "Skin for Mini Mage",
      slot: "skin",
      skinFor: "idle3",
    },
    {
      id: 105,
      name: "Mini King",
      price: 500,
      category: "skins",
      emoji: "/assets/MiniKingIdle.gif",
      description: "Skin for Mini Prince",
      slot: "skin",
      skinFor: "idle4",
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
      setModal({
        open: true,
        title: "No Item Selected",
        message: "Please select an item to purchase.",
        type: "error",
      });
      return;
    }
    
    // For character unlocks, quantity is always 1
    if (selectedItem.category === "characters") {
      if (selectedItem.characterId && unlockedCharacters.includes(selectedItem.characterId)) {
        setModal({
          open: true,
          title: "Already Unlocked",
          message: "You already own this character!",
          type: "error",
        });
        return;
      }
      const totalCost = selectedItem.price;
      if (userCoins < totalCost) {
        setModal({
          open: true,
          title: "Not Enough Coins",
          message: `You need ${totalCost} coins but only have ${userCoins} coins.`,
          type: "error",
        });
        return;
      }
      if (!user) {
        setModal({
          open: true,
          title: "Not Logged In",
          message: "You must be logged in to purchase items.",
          type: "error",
        });
        return;
      }
      // Unlock character
      const newCoins = userCoins - totalCost;
      const newUnlockedCharacters = [...unlockedCharacters, selectedItem.characterId!];
      await updateUser(user.uid, {
        coins: newCoins,
        unlockedCharacters: newUnlockedCharacters,
      });
      setUserCoins(newCoins);
      setUnlockedCharacters(newUnlockedCharacters);
      setModal({
        open: true,
        title: "Character Unlocked!",
        message: `You've unlocked ${selectedItem.name}!\n\nGo to Avatar to select your new character.`,
        type: "success",
      });
      setSelectedItem(null);
      setPurchaseQuantity(1);
      return;
    }

    // For skins, single purchase, tied to character
    if (selectedItem.category === "skins") {
      if (!user) {
        setModal({
          open: true,
          title: "Not Logged In",
          message: "You must be logged in to purchase items.",
          type: "error",
        });
        return;
      }
      const alreadyOwned = allInventory.some((i) => i.id === selectedItem.id);
      if (alreadyOwned) {
        setModal({
          open: true,
          title: "Already Owned",
          message: "You already own this skin.",
          type: "error",
        });
        return;
      }
      const totalCost = selectedItem.price;
      if (userCoins < totalCost) {
        setModal({
          open: true,
          title: "Not Enough Coins",
          message: `You need ${totalCost} coins but only have ${userCoins} coins.`,
          type: "error",
        });
        return;
      }
      const newCoins = userCoins - totalCost;
      await updateUser(user.uid, { coins: newCoins });
      await addItemToInventory(user.uid, {
        id: selectedItem.id,
        name: selectedItem.name,
        quantity: 1,
        emoji: selectedItem.emoji,
        slot: selectedItem.slot,
      });
      const userData = await getUser(user.uid);
      setInventory(filterInventoryItems(userData?.inventory || []));
      setAllInventory(userData?.inventory || []);
      setUserCoins(userData?.coins ?? newCoins);
      setModal({
        open: true,
        title: "Skin Purchased!",
        message: `You bought ${selectedItem.name} for ${totalCost} coins. Equip it in Avatar page.`,
        type: "success",
      });
      setSelectedItem(null);
      setPurchaseQuantity(1);
      return;
    }

    // For consumables, handle quantity
    if (purchaseQuantity < 1 || !Number.isInteger(purchaseQuantity)) {
      setModal({
        open: true,
        title: "Invalid Quantity",
        message: "Please enter a valid quantity (1 or more).",
        type: "error",
      });
      return;
    }
    const totalCost = selectedItem.price * purchaseQuantity;
    if (userCoins < totalCost) {
      setModal({
        open: true,
        title: "Not Enough Coins",
        message: `You need ${totalCost} coins but only have ${userCoins} coins.`,
        type: "error",
      });
      return;
    }
    if (!user) {
      setModal({
        open: true,
        title: "Not Logged In",
        message: "You must be logged in to purchase items.",
        type: "error",
      });
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
      message: `You bought: ${
        selectedItem.name
      } x${purchaseQuantity}\nCost: ${totalCost} coins\nRemaining coins: ${
        userData?.coins ?? newCoins
      }`,
      type: "success",
    });
    setSelectedItem(null);
    setPurchaseQuantity(1);
  };
  // Modal component
  const renderModal = () =>
    modal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div
          className={`rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 flex flex-col items-center relative ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-500"}`}
          style={{
            borderColor:
              modal.type === "success"
                ? "#22C55E"
                : modal.type === "error"
                ? "#EF4444"
                : "#F59E42",
          }}
        >
          <button
            onClick={() => setModal({ ...modal, open: false })}
            className="absolute top-4 right-4 text-2xl font-bold text-gray-700 hover:text-red-500 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
            aria-label="Close Modal"
          >
            ×
          </button>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">
              {modal.type === "success" && "✅"}
              {modal.type === "error" && "❌"}
              {modal.type === "info" && "ℹ️"}
            </span>
            <span
              className={`text-2xl font-bold ${
                modal.type === "success"
                  ? "text-green-600"
                  : modal.type === "error"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {modal.title}
            </span>
          </div>
          <div className={`text-center whitespace-pre-line mb-2 text-lg ${isDarkMode ? "text-white" : "text-gray-700"}`}>
            {modal.message}
          </div>
        </div>
      </div>
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
    return shopItems.map((item, index) => {
      const isSelected = selectedItem?.id === item.id;
      const isSkin = item.category === "skins";
      return (
        <div
          key={item.id}
          className={`p-5 text-center cursor-pointer border-2 transform transition-transform duration-300 hover:-translate-y-1 ${
            isSelected
              ? isDarkMode
                ? "bg-gray-900 border-[#ffd700] ring-2 ring-[#ffd700]"
                : "bg-amber-50 border-amber-600 ring-2 ring-amber-400"
              : isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-gray-50 border-gray-300"
          }`}
          onClick={() => selectItem(item as ShopItem)}
        >
          <div
            className={`w-full ${item.category === "skins" ? "h-40" : "h-32"} mb-4 flex items-center justify-center text-5xl ${
              isDarkMode ? "bg-gray-800" : "bg-gray-100 border border-gray-300"
            }`}
          >
            {typeof item.emoji === "string" && item.emoji.includes(".") ? (
              <img
                src={item.emoji}
                alt={item.name}
                className={`object-contain ${item.category === "skins" ? "w-32 h-32" : "w-20 h-20"} ${!isSkin ? "float-animation" : ""}`}
                style={{ 
                  imageRendering: "pixelated",
                  ...(!isSkin ? { animationDelay: `${index * 0.2}s` } : {})
                }}
              />
            ) : typeof item.emoji === "string" ? (
              <span className={!isSkin ? "float-animation" : ""} style={!isSkin ? { animationDelay: `${index * 0.2}s` } : {}}>
                {item.emoji}
              </span>
            ) : (
              <img
                src={item.emoji}
                alt={item.name}
                className={`object-contain ${item.category === "skins" ? "w-32 h-32" : "w-20 h-20"} ${!isSkin ? "float-animation" : ""}`}
                style={{ 
                  imageRendering: "pixelated",
                  ...(!isSkin ? { animationDelay: `${index * 0.2}s` } : {})
                }}
              />
            )}
          </div>
          <div
            className={`font-bold mb-3 text-base ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
          >
            {item.name}
          </div>
          <div
            className={`font-bold text-sm ${
              isDarkMode ? "text-yellow-300" : "text-yellow-700"
            }`}
          >
            💰 {(item as ShopItem).price} Coins
          </div>
        </div>
      );
    });
  };

  const renderInventoryModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`relative rounded-3xl shadow-2xl p-8 w-full max-w-2xl border border-[#ffd700] flex flex-col items-center ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-500"}`}>
        <button
          onClick={closeInventoryModal}
          className={`absolute top-4 right-4 text-2xl font-bold rounded-full w-10 h-10 flex items-center justify-center shadow ${isDarkMode ? "text-white bg-gray-700" : "text-gray-700 bg-white"}`}
          aria-label="Close Inventory"
        >
          ×
        </button>
        <div className="flex items-center gap-3 mb-6">
          <span className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-amber-600"}`}>Backpack</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 w-full">
          {inventory.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              <div className="text-6xl mb-2">📦</div>
              <p>No items in your backpack</p>
            </div>
          ) : (
            inventory.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col items-center rounded-xl shadow p-4 border-2 ${isDarkMode ? "bg-gray-900 border-gray-600" : "bg-white border-gray-500"}`}
              >
                <div className="text-5xl mb-2">
                  {typeof item.emoji === "string" &&
                  item.emoji.endsWith(".png") ? (
                    <img
                      src={item.emoji}
                      alt={item.name}
                      className="object-contain w-14 h-14"
                      style={{ imageRendering: "pixelated" }}
                    />
                  ) : (
                    item.emoji
                  )}
                </div>
                <div className={`font-bold text-lg text-center ${isDarkMode ? "text-white" : "text-gray-600"} mb-1`}>
                  {item.name}
                </div>
                <div className="text-white font-semibold">
                  x{item.quantity}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={
        isDarkMode
          ? "min-h-screen bg-[#020617]"
          : "min-h-screen bg-[#fafaff]"
      }
    >
      <style>{`
        @keyframes floatUpDown {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3.5px);
          }
        }
        .float-animation {
          animation: floatUpDown 2s ease-in-out infinite;
          will-change: transform;
        }
        .float-animation:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className=" px-4 pb-8 space-y-8">
        {/* === HEADER === */}
        <header className="flex justify-between items-center">
          <div>
            <div
              className={`font-bold text-lg ${
                isDarkMode ? "text-white" : "text-orange-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {!loadingStreak && (streak ?? 0) > 0 && (
                  <img
                    src={FireGif}
                    alt="Streak fire"
                    className="w-7 h-7 object-contain mb-1.5"
                  />
                )}
                <span>
                  Streak:{" "}
                  {loadingStreak
                    ? "..."
                    : `${streak ?? 0} day${streak === 1 ? "" : "s"}`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Toggle Theme */}
            <button
              onClick={toggleDarkMode}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDarkMode
                  ? "bg-gray-700 focus:ring-gray-500"
                  : "bg-yellow-400 focus:ring-yellow-500"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                  isDarkMode ? "translate-x-8" : "translate-x-0"
                }`}
              >
                {isDarkMode ? (
                  <FaRegMoon className="text-gray-700 text-xs" />
                ) : (
                  <IoSunnyOutline className="text-yellow-500 text-xs" />
                )}
              </span>
            </button>

            <span
              className={`text-2xl ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              |
            </span>
            {/* Profile Picture */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xl bg-linear-to-br from-orange-500 to-red-500 text-white shadow-lg`}
            >
              {user?.email ? user.email.charAt(0).toUpperCase() : "?"}
            </div>
          </div>
        </header>

        {/* === COINS + SELECTED ITEM SUMMARY === */}
        <section className="flex justify-between items-center">
          <div
            className={`px-6 py-4 rounded-sm font-bold text-lg shadow-md flex items-center justify-between gap-3 border-2 ${
              isDarkMode
                ? "bg-gray-900 text-yellow-300 border-amber-400"
                : "bg-white text-yellow-800 border-amber-300"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              <span>Coins</span>
            </span>
            <span className="text-2xl tracking-wide">{userCoins}</span>
          </div>

          {/* Selected item detail card */}
          <div
            className={`px-16 py-4 rounded-sm border-2 shadow-sm flex items-center gap-4 ${
              isDarkMode
                ? "bg-gray-900 border-amber-400 text-gray-100"
                : "bg-white border-amber-200 text-gray-800"
            }`}
          >
            {selectedItem ? (
              <>
                <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-black/5">
                  {typeof selectedItem.emoji === "string" &&
                  selectedItem.emoji.includes(".") ? (
                    <img
                      src={selectedItem.emoji}
                      alt={selectedItem.name}
                      className="object-contain w-12 h-12"
                      style={{ imageRendering: "pixelated" }}
                    />
                  ) : (
                    <span className="text-3xl">{selectedItem.emoji}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold truncate">
                      {selectedItem.name}
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide ${
                        isDarkMode
                          ? "bg-gray-800 text-amber-300"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {selectedItem.category}
                    </span>
                  </div>
                  <p className="text-xs line-clamp-2 opacity-80">
                    {selectedItem.description}
                  </p>
                  <div className="mt-2 text-sm font-bold flex items-center gap-2">
                    <span>💰</span>
                    <span>
                      {selectedItem.category === "characters" ||
                      selectedItem.category === "skins"
                        ? `${selectedItem.price} coins`
                        : `${selectedItem.price} x ${purchaseQuantity} = ${
                            selectedItem.price * purchaseQuantity
                          } coins`}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm opacity-70">
                Select an item from the shop to see its details and cost here.
              </p>
            )}
          </div>
        </section>

        {/* === ITEMS SECTION === */}
        <main
          className={`p-6 md:p-8 border-2 rounded-sm shadow-lg ${
            isDarkMode
              ? "bg-gray-900 text-white border-amber-400"
              : "bg-white text-gray-800 border-amber-400/70"
          }`}
        >
          <h2
            className={`text-2xl md:text-3xl font-bold mb-8 text-center font-['Press_Start_2P',cursive] ${
              isDarkMode ? "text-[#ffd700]" : "text-amber-600"
            }`}
          >
            Items for Purchase
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 md:gap-7">
            {renderItems()}
          </div>
        </main>

        {/* === BOTTOM ACTION BAR === */}
        <nav className="flex flex-col md:flex-row md:items-center justify-end gap-4 md:gap-5">
          <button
            onClick={openInventoryModal}
            className="px-7 py-4 font-bold text-xs cursor-pointer
              font-['Press_Start_2P',cursive] uppercase tracking-[0.12em]  rounded-md
              transition-transform duration-300 hover:-translate-y-1 shadow-md
              bg-linear-to-b from-[#ff7f50] to-[#ff4757] text-white"
          >
            INVENTORY
          </button>
          

          {selectedItem &&
            selectedItem.category !== "characters" &&
            selectedItem.category !== "skins" && (
              <div className="flex items-center gap-3">
                <label
                  htmlFor="quantity"
                  className={`font-bold text-sm md:text-base ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Qty:
                </label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  value={purchaseQuantity}
                  onChange={(e) =>
                    setPurchaseQuantity(
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  }
                  className={`w-24 px-2 py-1 border-2 text-center rounded-md ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-400 text-gray-800"
                  }`}
                  style={{
                    fontFamily: "Press Start 2P, monospace",
                    fontSize: "10px",
                  }}
                />
              </div>
            )}
          <button
            onClick={handlePurchase}
            disabled={!selectedItem}
            className={`px-7 py-4 font-bold text-xs cursor-pointer
font-['Press_Start_2P',cursive] uppercase tracking-[0.12em] rounded-md
transition-transform duration-300 hover:-translate-y-1 shadow-md
bg-green-600 text-white
${selectedItem ? "" : "opacity-50 cursor-not-allowed"}`}
          >
            {selectedItem
              ? selectedItem.category === "characters"
                ? `🔓 UNLOCK ${selectedItem.name.toUpperCase()} (${selectedItem.price} coins)`
                : selectedItem.category === "skins"
                ? `BUY ${selectedItem.name.toUpperCase()} (${selectedItem.price} coins)`
                : `BUY ${selectedItem.name.toUpperCase()} (${
                    selectedItem.price * purchaseQuantity
                  } coins)`
              : "PURCHASE"}
          </button>
        </nav>

        {isInventoryModalOpen && renderInventoryModal()}
        {renderModal()}
      </div>
    </div>
  );
};

export default Shop;
