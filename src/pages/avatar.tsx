import { useState, useEffect, useRef } from "react";
import titleScreenBgm from "../assets/Final Fantasy VII Remake - Title Screen.mp3";
import { getUser } from "../services/users";
import { useTheme } from "../components/theme";
import { IoSunnyOutline } from "react-icons/io5";
import { FaRegMoon } from "react-icons/fa";
import { useAuth } from "../contexts/authContexts/auth";
import MiniSwordManIdle from "../assets/MiniSwordManIdle.gif";
import MiniSpear from "../assets/MiniSpearManIdle.gif";
import MiniArcher from "../assets/MiniArcherIdle.gif";
import MiniMage from "../assets/MiniMageIdle.gif";
import MiniPrince from "../assets/MiniPrinceIdle.gif";
import MiniShieldIdle from "../assets/MiniShieldIdle.gif";
import MiniHalberdIdle from "../assets/MiniHalberdIdle.gif";
import MiniCrossBowIdle from "../assets/MiniCrossBowIdle.gif";
import MiniArchMageIdle from "../assets/MiniArchMageIdle.gif";
import MiniKingIdle from "../assets/MiniKingIdle.gif";
import FireGif from "../assets/Fire.gif";

// Move miniSwordCrew above Avatar so it can be used in state initialization
const miniSwordCrew = [
  {
    id: "idle",
    label: "Mini Swordman",
    description:
      "A tiny but fearless warrior who charges into battle with quick slashes. Agile, brave, and always on the front line.",
    requiredLevel: 0,
    image: MiniSwordManIdle,
  },
  {
    id: "idle1",
    label: "Mini Spearman",
    description:
      "A small defender armed with a long spear, keeping enemies at a distance. Steady, disciplined, and great for holding the line.",
    requiredLevel: 5,
    image: MiniSpear,
  },
  {
    id: "idle2",
    label: "Mini Archer",
    description:
      "A miniature marksman who fires arrows from afar with surprising accuracy. Light, swift, and perfect for ranged support.",
    requiredLevel: 10,
    image: MiniArcher,
  },
  {
    id: "idle3",
    label: "Mini Mage",
    description:
      "A mystical spellcaster wielding arcane magic. Powerful ranged attacks with elemental fury and crowd control.",
    requiredLevel: 15,
    image: MiniMage,
  },
  {
    id: "idle4",
    label: "Mini Prince",
    description:
      "A noble warrior with balanced skills and royal abilities. Master of both offense and defense with inspiring presence.",
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
  const [userLevel, setUserLevel] = useState(0);
  const [modal, setModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({ open: false, title: "", message: "", type: "info" });
  // Character selection state
  const [selectedCharacter, setSelectedCharacter] = useState<string>(
    miniSwordCrew[0].id
  );
  const [unlockedCharacters, setUnlockedCharacters] = useState<string[]>(["idle"]); // Mini Swordman always unlocked
  const [ownedSkins, setOwnedSkins] = useState<string[]>([]);
  const [selectedSkins, setSelectedSkins] = useState<Record<string, string>>({});

  const skinCatalog: Record<string, { id: string; label: string; for: string; image: string; shopId: number }> = {
    miniShieldman: { id: "miniShieldman", label: "Mini Shieldman", for: "idle", image: MiniShieldIdle, shopId: 101 },
    miniHalberdman: { id: "miniHalberdman", label: "Mini Halberdman", for: "idle1", image: MiniHalberdIdle, shopId: 102 },
    miniCrossbow: { id: "miniCrossbow", label: "Mini Crossbow", for: "idle2", image: MiniCrossBowIdle, shopId: 103 },
    miniArchmage: { id: "miniArchmage", label: "Mini Archmage", for: "idle3", image: MiniArchMageIdle, shopId: 104 },
    miniKing: { id: "miniKing", label: "Mini King", for: "idle4", image: MiniKingIdle, shopId: 105 },
  };

  // Load selected character and unlocked characters from Firestore on mount
  useEffect(() => {
    const fetchSelectedCharacter = async () => {
      if (!user) return;
      const userData = await getUser(user.uid);
      if (userData && userData.selectedCharacter) {
        setSelectedCharacter(userData.selectedCharacter);
      }
      // Load selected skins mapping (per character)
      const savedSkins = (userData as any)?.selectedSkins || {};
      setSelectedSkins(savedSkins);
      // Derive owned skins from inventory
      const ownedSkinIds: string[] = [];
      (userData?.inventory || []).forEach((item) => {
        if (item.slot === "skin") {
          const found = Object.values(skinCatalog).find((s) => s.shopId === item.id);
          if (found) ownedSkinIds.push(found.id);
        }
      });
      setOwnedSkins(ownedSkinIds);

      // Load unlocked characters and check level-based unlocks
      const unlockedChars = userData?.unlockedCharacters || ["idle"];
      if (!unlockedChars.includes("idle")) {
        unlockedChars.push("idle");
      }
      
      // Auto-unlock based on level
      const userLevel = userData?.level || 0;
      let charUpdated = false;
      
      // Unlock Mini Spearman at level 5
      if (userLevel >= 5 && !unlockedChars.includes("idle1")) {
        unlockedChars.push("idle1");
        charUpdated = true;
      }
      
      // Unlock Mini Archer at level 10
      if (userLevel >= 10 && !unlockedChars.includes("idle2")) {
        unlockedChars.push("idle2");
        charUpdated = true;
      }
      
      // Unlock Mini Mage at level 15
      if (userLevel >= 15 && !unlockedChars.includes("idle3")) {
        unlockedChars.push("idle3");
        charUpdated = true;
      }
      
      // Unlock Mini Prince at level 15
      if (userLevel >= 15 && !unlockedChars.includes("idle4")) {
        unlockedChars.push("idle4");
        charUpdated = true;
      }
      
      // Update Firestore if new characters were unlocked
      if (charUpdated && user) {
        const { updateUser } = await import("../services/users");
        await updateUser(user.uid, { unlockedCharacters: unlockedChars });
      }
      
      setUnlockedCharacters(unlockedChars);
    };
    fetchSelectedCharacter();
  }, [user]);

  // // Handle character selection and save to Firestore
  // const handleSelectCharacter = async (charId: string) => {
  //   if (!user) return;
  //   setSelectedCharacter(charId);
  //   // Save to Firestore (users collection)
  //   const { updateUser } = await import("../services/users");
  //   await updateUser(user.uid, { selectedCharacter: charId });
  //   setModal({
  //     open: true,
  //     title: "Character Selected",
  //     message: "Your character has been updated!",
  //     type: "success",
  //   });
  // };

  // (removed duplicate miniSwordCrew declaration)
  useEffect(() => {
    const fetchStreak = async () => {
      if (!user) {
        setStreak(null);
        setLoadingStreak(false);
        setUserCoins(0);
        setUserLevel(0);
        return;
      }
      try {
        const userData = await getUser(user.uid);
        setStreak(
          userData && typeof userData.streak === "number" ? userData.streak : 0
        );
        setUserCoins(userData?.coins ?? 0);
        setUserLevel(userData?.level ?? 0);
      } catch (e) {
        setStreak(0);
        setUserCoins(0);
      } finally {
        setLoadingStreak(false);
      }
    };
    fetchStreak();
  }, [user]);

  {
    (() => {
      const char =
        miniSwordCrew.find((c) => c.id === selectedCharacter) ||
        miniSwordCrew[0];
      return (
        <img
          src={char.image}
          alt={char.label}
          className="w-32 h-32 object-contain"
          style={{ imageRendering: "pixelated" }}
        />
      );
    })();
  }

  const updateAvatarPreview = () => {
    // Show selected character gif if selected, else default to first character
    const char =
      miniSwordCrew.find((c) => c.id === selectedCharacter) || miniSwordCrew[0];
    const skinChoice = selectedSkins[char.id];
    const skinObj = skinChoice
      ? Object.values(skinCatalog).find((s) => s.id === skinChoice && s.for === char.id)
      : null;
    const showSkin = skinObj && ownedSkins.includes(skinObj.id);
    const imgSrc = showSkin ? skinObj?.image : char.image;
    return (
      <img
        src={imgSrc}
        alt={char.label}
        className="w-50 h-50 object-contain"
        style={{ imageRendering: "pixelated" }}
      />
    );
  };

  const renderSkinToggle = (charId: string) => {
    const skinForChar = Object.values(skinCatalog).find((s) => s.for === charId);
    if (!skinForChar) return null;
    const owned = ownedSkins.includes(skinForChar.id);
    const currentSkin = selectedSkins[charId] || "default";
    return (
      <div className="mt-3 w-full flex gap-2">
        <button
          className={`flex-1 px-3 py-2 text-xs font-['Press_Start_2P',cursive] border-2 rounded-sm transition-transform duration-200 hover:-translate-y-1 ${
            currentSkin === "default"
              ? "bg-linear-to-b from-[#ffd700] to-[#ffb700] border-[#8b6914] text-[#1a1a2e]"
              : "bg-gray-200 text-gray-700 border-gray-400"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSkins((prev) => ({ ...prev, [charId]: "default" }));
          }}
        >
          Default
        </button>
        <button
          className={`flex-1 px-3 py-2 text-xs font-['Press_Start_2P',cursive] border-2 rounded-sm transition-transform duration-200 hover:-translate-y-1 ${
            currentSkin === skinForChar.id
              ? "bg-linear-to-b from-[#ffd700] to-[#ffb700] border-[#8b6914] text-[#1a1a2e]"
              : "bg-linear-to-b from-[#ff6348] to-[#ff4757] border-[#c0392b] text-white"
          } ${!owned ? "opacity-60 cursor-not-allowed" : ""}`}
          disabled={!owned}
          onClick={(e) => {
            e.stopPropagation();
            if (!owned) return;
            setSelectedSkins((prev) => ({ ...prev, [charId]: skinForChar.id }));
          }}
        >
          {owned ? skinForChar.label : "Locked"}
        </button>
      </div>
    );
  };

  // Modal component
  const renderModal = () =>
    modal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 flex flex-col items-center relative"
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
          <div className="text-gray-700 text-center whitespace-pre-line mb-2 text-lg">
            {modal.message}
          </div>
        </div>
      </div>
    );

  return (
    <div>
      {renderModal()}
      <div className="">
        {/* Header */}
        <header className={`flex justify-between items-center mb-6`}>
          <div>
            <div
              className={`font-bold text-lg ml-5 ${
                isDarkMode ? "text-white" : " text-orange-600"
              }`}
            >
              <div className="flex items-center">
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
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              |
            </span>
            {/* Profile Picture */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xl bg-linear-to-r from-orange-500 to-red-500 ${
                isDarkMode ? " text-white" : " text-white"
              }`}
            >
              {user?.email ? user.email.charAt(0).toUpperCase() : "?"}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-10 mb-10">
          {/* Left Sidebar */}
          <aside className="w-full max-w-xs shrink-0 flex flex-col gap-8 mx-auto lg:mx-0">
            <div
              className={`p-6 text-center font-bold text-lg border-2 ${
                isDarkMode
                  ? "bg-gray-900 text-white border-amber-400"
                  : "bg-white text-gray-600 border-amber-500"
              }`}
            >
              🟡 {userCoins} Coins
            </div>
            <div
              className={`p-6 text-center font-bold w-full border-2 ${
                isDarkMode
                  ? "bg-gray-900 text-white border-amber-400"
                  : "bg-white text-gray-600 border-amber-500"
              }`}
            >
              <div className="text-xl mb-2 font-['Press_Start_2P',cursive] tracking-[0.12em]">
                Avatar Preview
              </div>
              <div
                className={`mt-2 flex flex-col items-center justify-center relative overflow-hidden shadow-inner ${
                  isDarkMode ? "bg-gray-800" : "bg-white border border-gray-300"
                }`}
              >
                {updateAvatarPreview()}
              </div>
            </div>
          </aside>

          {/* Items Display Area */}
          <main
            className={`flex-1 p-8 min-h-[500px] border-2 ${
              isDarkMode
                ? "bg-gray-900 border-amber-400"
                : "bg-white border-amber-500"
            }`}
          >
            <h2
              className={`text-2xl font-bold mb-6 text-center font-['Press_Start_2P',cursive] tracking-[0.12em] ${
                isDarkMode ? "text-[#ffd700]" : "text-amber-600"
              }`}
            >
              Customize Your Character
            </h2>
            <section className="mb-8">
              <h3
                className={`text-xl font-semibold mb-4 text-center font-['Press_Start_2P',cursive] tracking-[0.12em] ${
                  isDarkMode ? "text-[#ffd700]" : "text-amber-700"
                }`}
              >
                Mini Sword Squad
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {miniSwordCrew.map((character) => {
                  const isUnlocked = unlockedCharacters.includes(character.id);
                  return (
                    <div
                      key={character.id}
                      className={`relative p-5 flex flex-col items-center text-center transition-all duration-200 cursor-pointer border-2 shadow-md ${
                        isUnlocked
                          ? selectedCharacter === character.id
                            ? isDarkMode
                              ? "border-[#ffd700] ring-2 ring-[#ffd700] bg-gray-900"
                              : "border-amber-600 ring-2 ring-amber-400 bg-amber-50"
                            : isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-gray-50 border-gray-300"
                          : isDarkMode
                          ? "bg-gray-800 border-gray-700 opacity-60"
                          : "bg-gray-50 border-gray-300 opacity-60"
                      }`}
                      onClick={() => isUnlocked && setSelectedCharacter(character.id)}
                    >
                      <div
                        className={`w-28 h-28 mb-4 flex items-center justify-center overflow-hidden border-2 ${
                          isDarkMode
                            ? "bg-gray-900 border-gray-700"
                            : "bg-white border-gray-200"
                        } ${!isUnlocked ? "opacity-50" : ""}`}
                      >
                        {typeof character.image === "string" && character.image.match(/^[^\w]$/u) ? (
                          <span className="text-6xl">{character.image}</span>
                        ) : (
                          <img
                            src={character.image}
                            alt={`${character.label}`}
                            className="w-full h-full object-contain"
                            style={{ imageRendering: "pixelated" }}
                          />
                        )}
                      </div>
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded pointer-events-none">
                          <span className="text-4xl">🔒</span>
                        </div>
                      )}
                      <p
                        className={`text-lg font-bold mb-1 ${
                          isDarkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {character.label}
                      </p>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {character.description}
                      </p>
                      {isUnlocked ? (
                        <button
                          className={`mt-3 px-4 py-2 w-full text-xs
                                font-['Press_Start_2P',cursive] border-2 rounded-sm
                                transition-transform duration-300 hover:-translate-y-1
${
  selectedCharacter === character.id
    ? "bg-linear-to-b from-[#ffd700] to-[#ffb700] border-[#8b6914] text-[#1a1a2e] cursor-not-allowed"
    : "bg-linear-to-b from-[#ff6348] to-[#ff4757] border-[#c0392b] text-white"
}`}
                          disabled={selectedCharacter === character.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCharacter(character.id);
                          }}
                        >
                          {selectedCharacter === character.id
                            ? "SELECTED"
                            : "SELECT"}
                        </button>
                      ) : (
                        <div className="mt-3 px-4 py-2 w-full text-xs text-center bg-gray-400 text-gray-700 border-2 border-gray-500 rounded-sm cursor-default opacity-60">
                          LOCKED - Reach Level {character.requiredLevel}
                        </div>
                      )}
                      {isUnlocked && renderSkinToggle(character.id)}
                    </div>
                  );
                })}
              </div>
            </section>
            {/* Category Tabs */}
          </main>
        </div>

        {/* Bottom Navigation */}
        <nav className="flex justify-end">
          <button
            onClick={async () => {
              if (!user) return;
              const { updateUser } = await import("../services/users");
              await updateUser(user.uid, { selectedCharacter, selectedSkins });
              setModal({
                open: true,
                title: "Character Saved",
                message: "Your character has been saved!",
                type: "success",
              });
            }}
            className="px-7 py-4 text-xs
font-['Press_Start_2P',cursive] uppercase tracking-[0.12em] border-2 rounded-sm
transition-transform duration-300 hover:-translate-y-1
bg-linear-to-b from-[#22c55e] to-[#16a34a] border-[#15803d] text-white"
          >
            SAVE CHARACTER
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Avatar;
