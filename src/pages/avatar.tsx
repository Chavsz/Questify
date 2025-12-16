import { useState, useEffect } from "react";
import { Lock, Check } from "lucide-react";
import { useTheme } from "../components/theme";
import { IoSunnyOutline } from "react-icons/io5";
import { FaRegMoon } from "react-icons/fa";
import { useAuth } from "../contexts/authContexts/auth";
import { getUser, updateUser } from "../services/users";
import FireGif from "../assets/Fire.gif";
import MiniSwordManIdle from "../assets/MiniSwordManIdle.gif";
import MiniSpear from "../assets/MiniSpearManIdle.gif";
import MiniArcher from "../assets/MiniArcherIdle.gif";
import MiniMage from "../assets/MiniMageIdle.gif";
import MiniPrince from "../assets/MiniPrinceIdle.gif";

// Public asset paths for skin idle sprites
const MiniShieldIdle = "/assets/MiniShieldIdle.gif";
const MiniHalberdIdle = "/assets/MiniHalberdIdle.gif";
const MiniCrossBowIdle = "/assets/MiniCrossBowIdle.gif";
const MiniArchMageIdle = "/assets/MiniArchMageIdle.gif";
const MiniKingIdle = "/assets/MiniKingIdle.gif";

const miniSwordCrew = [
  {
    id: "idle",
    label: "Mini Swordman",
    description: "A tiny but fearless warrior who charges into battle with quick slashes. Agile, brave, and always on the front line.",
    requiredLevel: 0,
    image: MiniSwordManIdle,
  },
  {
    id: "idle1",
    label: "Mini Spearman",
    description: "A small defender armed with a long spear, keeping enemies at a distance. Steady, disciplined, and great for holding the line.",
    requiredLevel: 5,
    image: MiniSpear,
  },
  {
    id: "idle2",
    label: "Mini Archer",
    description: "A miniature marksman who fires arrows from afar with surprising accuracy. Light, swift, and perfect for ranged support.",
    requiredLevel: 10,
    image: MiniArcher,
  },
  {
    id: "idle3",
    label: "Mini Mage",
    description: "A mystical spellcaster wielding arcane magic. Powerful ranged attacks with elemental fury and crowd control.",
    requiredLevel: 15,
    image: MiniMage,
  },
  {
    id: "idle4",
    label: "Mini Prince",
    description: "A noble warrior with balanced skills and royal abilities. Master of both offense and defense with inspiring presence.",
    requiredLevel: 15,
    image: MiniPrince,
  },
];

const Avatar = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const authContext = useAuth();
  const user = authContext?.currentUser;
  const [streak, setStreak] = useState<number | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(true);
  const [userCoins, setUserCoins] = useState(0);
  const [modal, setModal] = useState({ open: false, title: "", message: "", type: "info" as "success" | "error" | "info" });
  const [selectedCharacter, setSelectedCharacter] = useState(miniSwordCrew[0].id);
  const [unlockedCharacters, setUnlockedCharacters] = useState<string[]>(["idle"]);
  const [ownedSkins, setOwnedSkins] = useState<string[]>([]);
  const [selectedSkins, setSelectedSkins] = useState<Record<string, string>>({});
  const [saveAnimation, setSaveAnimation] = useState(false);

  const skinCatalog: Record<string, { id: string; label: string; for: string; image: string; shopId: number }> = {
    miniShieldman: { id: "miniShieldman", label: "Mini Shieldman", for: "idle", image: MiniShieldIdle, shopId: 101 },
    miniHalberdman: { id: "miniHalberdman", label: "Mini Halberdman", for: "idle1", image: MiniHalberdIdle, shopId: 102 },
    miniCrossbow: { id: "miniCrossbow", label: "Mini Crossbow", for: "idle2", image: MiniCrossBowIdle, shopId: 103 },
    miniArchmage: { id: "miniArchmage", label: "Mini Archmage", for: "idle3", image: MiniArchMageIdle, shopId: 104 },
    miniKing: { id: "miniKing", label: "Mini King", for: "idle4", image: MiniKingIdle, shopId: 105 },
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setStreak(null);
        setLoadingStreak(false);
        return;
      }
      try {
        const userData = await getUser(user.uid);
        if (userData) {
          setSelectedCharacter(userData.selectedCharacter || miniSwordCrew[0].id);
          setSelectedSkins(userData.selectedSkins || {});
          setStreak(userData.streak ?? 0);
          setUserCoins(userData.coins ?? 0);
          
          const unlockedChars = userData.unlockedCharacters || ["idle"];
          setUnlockedCharacters(unlockedChars);
          
          // Load owned skins from inventory
          if (userData.inventory) {
            const owned: string[] = [];
            userData.inventory.forEach((item: { id: number; slot?: string }) => {
              if (item.slot === "skin") {
                // Map shop ID to skin ID
                const skinObj = Object.values(skinCatalog).find((s) => s.shopId === item.id);
                if (skinObj) {
                  owned.push(skinObj.id);
                }
              }
            });
            setOwnedSkins(owned);
          }
        }
      } catch (e) {
        setStreak(0);
      } finally {
        setLoadingStreak(false);
      }
    };
    fetchData();
  }, [user]);

  const updateAvatarPreview = () => {
    const char = miniSwordCrew.find((c) => c.id === selectedCharacter) || miniSwordCrew[0];
    const skinChoice = selectedSkins[char.id];
    const skinObj = skinChoice ? Object.values(skinCatalog).find((s) => s.id === skinChoice && s.for === char.id) : null;
    const showSkin = skinObj && ownedSkins.includes(skinObj.id);
    const imgSrc = showSkin ? skinObj?.image : char.image;
    
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-linear-to-br from-amber-400/20 to-orange-500/20 blur-xl group-hover:blur-2xl transition-transform duration-500"></div>
        <img
          src={imgSrc}
          alt={char.label}
          className="relative w-50 h-50 object-contain transform group-hover:scale-105 transition-transform duration-300"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    );
  };

  const renderSkinToggle = (charId: string) => {
    const skinForChar = Object.values(skinCatalog).find((s) => s.for === charId);
    if (!skinForChar) return null;
    const owned = ownedSkins.includes(skinForChar.id);
    const currentSkin = selectedSkins[charId] || "default";
    
    return (
      <div className="mt-4 w-full flex gap-2">
        <button
          className={`flex-1 px-3 py-2.5 text-xs font-['Press_Start_2P',cursive] border-2 rounded transition-transform duration-200 hover:shadow-lg active:scale-95 ${
            currentSkin === "default"
              ? "bg-linear-to-b from-[#ffd700] to-[#ffb700] border-[#8b6914] text-[#1a1a2e] shadow-md"
              : "bg-gray-200 text-gray-700 border-gray-400 hover:border-gray-500"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSkins((prev) => ({ ...prev, [charId]: "default" }));
          }}
        >
          Default
        </button>
        <button
          className={`flex-1 px-3 py-2.5 text-xs font-['Press_Start_2P',cursive] border-2 rounded transition-transform duration-200 hover:shadow-lg active:scale-95 ${
            currentSkin === skinForChar.id
              ? "bg-linear-to-b from-[#ffd700] to-[#ffb700] border-[#8b6914] text-[#1a1a2e] shadow-md"
              : "bg-linear-to-b from-[#ff6348] to-[#ff4757] border-[#c0392b] text-white"
          } ${!owned ? "opacity-60 cursor-not-allowed" : ""}`}
          disabled={!owned}
          onClick={(e) => {
            e.stopPropagation();
            if (!owned) return;
            setSelectedSkins((prev) => ({ ...prev, [charId]: skinForChar.id }));
          }}
        >
          {owned ? skinForChar.label : <><Lock className="inline w-3 h-3 mr-1" />Locked</>}
        </button>
      </div>
    );
  };

  const renderModal = () =>
    modal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          className={`${isDarkMode ? "bg-gray-900" : "bg-white"} rounded-2xl shadow-2xl p-8 w-full max-w-md border-4 flex flex-col items-center relative animate-in zoom-in-95 duration-300`}
          style={{
            borderColor: modal.type === "success" ? "#22C55E" : modal.type === "error" ? "#EF4444" : "#F59E42",
          }}
        >
          <button
            onClick={() => setModal({ ...modal, open: false })}
            className={`absolute top-4 right-4 text-2xl font-bold hover:text-red-500 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-transform hover:rotate-90 duration-300 ${
              isDarkMode ? "text-white bg-gray-700 hover:bg-gray-600" : "text-gray-700 bg-white hover:bg-gray-100"
            }`}
            aria-label="Close Modal"
          >
            ×
          </button>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl animate-bounce">
              {modal.type === "success" && "✅"}
              {modal.type === "error" && "❌"}
              {modal.type === "info" && "ℹ️"}
            </span>
            <span
              className={`text-2xl font-bold ${
                modal.type === "success" ? "text-green-600" : modal.type === "error" ? "text-red-600" : "text-yellow-600"
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

  return (
    <div className={`px-4 pb-8 min-h-screen ${isDarkMode ? "bg-[#020617]" : "bg-[#fafaff]"}`}>
      {renderModal()}
      
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3 group">
          {!loadingStreak && (streak ?? 0) > 0 && (
            <img
              src={FireGif}
              alt="Streak fire"
              className="w-7 h-7 object-contain mb-1.5"
            />
          )}
          <div className={`font-bold text-lg transition-colors duration-200 ${isDarkMode ? "text-white" : "text-orange-600"}`}>
            <span className="group-hover:scale-110 inline-block transition-transform">
              Streak: {loadingStreak ? "..." : `${streak ?? 0} day${streak === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className={`relative w-14 h-7 rounded-full transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg hover:shadow-xl ${
              isDarkMode ? "bg-gray-700 focus:ring-gray-500" : "bg-yellow-400 focus:ring-yellow-500"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                isDarkMode ? "translate-x-7" : "translate-x-0"
              }`}
            >
              {isDarkMode ? <FaRegMoon className="text-gray-700 text-xs" /> : <IoSunnyOutline className="text-yellow-500 text-xs" />}
            </span>
          </button>
          
          <span className={`text-2xl ${isDarkMode ? "text-gray-600" : "text-gray-300"}`}>|</span>
          
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl bg-linear-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl transition-transform hover:scale-110 cursor-pointer`}>
            {user?.email ? user.email.charAt(0).toUpperCase() : "?"}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8 mb-10">
        {/* Left Sidebar */}
        <aside className="w-full max-w-xs shrink-0 flex flex-col gap-6 mx-auto lg:mx-0">
          <div
            className={`p-6 text-center font-bold text-xl border-2 rounded-lg shadow-md transition-transform duration-300 hover:-translate-y-1 ${
              isDarkMode ? "bg-gray-900 text-white border-amber-400" : "bg-white text-gray-600 border-amber-500"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🟡</span>
              <span>{userCoins}</span>
              <span className="text-sm">Coins</span>
            </div>
          </div>
          
          <div
            className={`p-6 border-2 rounded-lg shadow-md transition-transform duration-300 ${
              isDarkMode ? "bg-gray-900 text-white border-amber-400" : "bg-white text-gray-600 border-amber-500"
            }`}
          >
            <div className="text-xl mb-4 font-['Press_Start_2P',cursive] tracking-[0.12em] text-center">
              Avatar Preview
            </div>
            <div
              className={`mt-2 p-6 flex flex-col items-center justify-center relative overflow-hidden rounded-lg ${
                isDarkMode ? "bg-gray-800" : "bg-gray-50 border-2 border-gray-200"
              }`}
            >
              {updateAvatarPreview()}
            </div>
            <div className={`mt-4 text-center text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {miniSwordCrew.find((c) => c.id === selectedCharacter)?.label}
            </div>
          </div>
        </aside>

        {/* Items Display Area */}
        <main
          className={`flex-1 p-8 min-h-[500px] border-2 rounded-lg shadow-md transition-transform duration-300 ${
            isDarkMode ? "bg-gray-900 border-amber-400" : "bg-white border-amber-500"
          }`}
        >
          <h2
            className={`text-2xl font-bold mb-8 text-center font-['Press_Start_2P',cursive] tracking-[0.12em] ${
              isDarkMode ? "text-[#ffd700]" : "text-amber-600"
            }`}
          >
            Customize Your Character
          </h2>
          
          <section>
            <h3
              className={`text-xl font-semibold mb-6 text-center font-['Press_Start_2P',cursive] tracking-[0.12em] ${
                isDarkMode ? "text-[#ffd700]" : "text-amber-700"
              }`}
            >
              Mini Sword Squad
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {miniSwordCrew.map((character) => {
                const isUnlocked = unlockedCharacters.includes(character.id);
                const isSelected = selectedCharacter === character.id;
                
                return (
                  <div
                    key={character.id}
                    className={`relative p-6 flex flex-col items-center text-center transition-transform duration-300 cursor-pointer border-2 rounded-lg shadow-md  ${
                      isUnlocked
                        ? isSelected
                          ? isDarkMode
                            ? "border-[#ffd700] ring-4 ring-[#ffd700]/30 bg-gray-800 scale-105"
                            : "border-amber-600 ring-4 ring-amber-400/30 bg-amber-50 scale-105"
                          : isDarkMode
                          ? "bg-gray-800 border-gray-700 hover:border-gray-600 hover:-translate-y-1"
                          : "bg-gray-50 border-gray-300 hover:border-gray-400 hover:-translate-y-1"
                        : isDarkMode
                        ? "bg-gray-800/50 border-gray-700 opacity-70 cursor-not-allowed"
                        : "bg-gray-50/50 border-gray-300 opacity-70 cursor-not-allowed"
                    }`}
                    onClick={() => isUnlocked && setSelectedCharacter(character.id)}
                  >
                    {isSelected && (
                      <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-2 shadow-lg animate-bounce">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    
                    <div
                      className={`w-32 h-32 mb-4 flex items-center justify-center overflow-hidden rounded-lg border-2 transition-transform duration-300 ${
                        isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
                      } ${!isUnlocked ? "opacity-50" : "hover:scale-110"}`}
                    >
                      <img
                        src={character.image}
                        alt={character.label}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    </div>
                    
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg backdrop-blur-sm pointer-events-none">
                        <Lock className="w-12 h-12 text-white" />
                      </div>
                    )}
                    
                    <p className={`text-lg font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                      {character.label}
                    </p>
                    
                    <p className={`text-xs mb-4 line-clamp-3 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {character.description}
                    </p>
                    
                    {isUnlocked ? (
                      <button
                        className={`mt-auto px-4 py-2.5 w-full text-xs font-['Press_Start_2P',cursive] border-2 rounded transition-transform duration-200 hover:shadow-lg active:scale-95 ${
                          isSelected
                            ? "bg-linear-to-b from-[#ffd700] to-[#ffb700] border-[#8b6914] text-[#1a1a2e] cursor-default shadow-md"
                            : "bg-linear-to-b from-[#ff6348] to-[#ff4757] border-[#c0392b] text-white hover:-translate-y-1"
                        }`}
                        disabled={isSelected}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCharacter(character.id);
                        }}
                      >
                        {isSelected ? "✓ SELECTED" : "SELECT"}
                      </button>
                    ) : (
                      <div className="mt-auto px-4 py-2.5 w-full text-xs text-center bg-gray-400 text-gray-700 border-2 border-gray-500 rounded cursor-not-allowed opacity-60 flex items-center justify-center gap-2">
                        <Lock className="w-3 h-3" />
                        Level {character.requiredLevel} Required
                      </div>
                    )}
                    
                    {isUnlocked && renderSkinToggle(character.id)}
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>

      {/* Bottom Navigation */}
      <nav className="flex justify-end">
        <button
          onClick={async () => {
            if (!user) return;
            setSaveAnimation(true);
            await updateUser(user.uid, { selectedCharacter, selectedSkins });
            setModal({
              open: true,
              title: "Character Saved",
              message: "Your character has been saved successfully!",
              type: "success",
            });
            setTimeout(() => setSaveAnimation(false), 600);
          }}
          className={`px-7 py-4 text-xs font-['Press_Start_2P',cursive] uppercase tracking-[0.12em] border-2 rounded-lg transition-transform duration-300 hover:shadow-xl active:scale-95 bg-green-600 border-[#15803d] text-white hover:-translate-y-1 ${
            saveAnimation ? "animate-pulse scale-105" : ""
          }`}
        >
          <span className="flex items-center gap-2">
            SAVE CHARACTER
          </span>
        </button>
      </nav>
    </div>
  );
};

export default Avatar;