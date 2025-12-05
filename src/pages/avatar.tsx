import { useState, useEffect } from "react";
import { getUser } from "../services/users";
import { useTheme } from "../components/theme";
import { IoSunnyOutline } from "react-icons/io5";
import { FaRegMoon } from "react-icons/fa";
import { useAuth } from "../contexts/authContexts/auth";
import MiniSwordManIdle from "../assets/MiniSwordManIdle.gif";
import MiniSpear from "../assets/MiniSpearManIdle.gif";
import MiniArcher from "../assets/MiniArcherIdle.gif";

// Move miniSwordCrew above Avatar so it can be used in state initialization
const miniSwordCrew = [
  {
    id: "idle",
    label: "Mini Swordman",
    description:
      "A tiny but fearless warrior who charges into battle with quick slashes. Agile, brave, and always on the front line.",
    image: MiniSwordManIdle,
  },
  {
    id: "idle1",
    label: "Mini Spearman",
    description:
      "A small defender armed with a long spear, keeping enemies at a distance. Steady, disciplined, and great for holding the line.",
    image: MiniSpear,
  },
  {
    id: "idle2",
    label: "Mini Archer",
    description:
      "A miniature marksman who fires arrows from afar with surprising accuracy. Light, swift, and perfect for ranged support.",
    image: MiniArcher,
  },
];

const Avatar = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const authContext = useAuth();
  const user = authContext?.currentUser;
  const [streak, setStreak] = useState<number | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(true);
  const [userCoins, setUserCoins] = useState(0);
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

  // Load selected character from Firestore on mount
  useEffect(() => {
    const fetchSelectedCharacter = async () => {
      if (!user) return;
      const userData = await getUser(user.uid);
      if (userData && userData.selectedCharacter) {
        setSelectedCharacter(userData.selectedCharacter);
      }
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
        return;
      }
      try {
        const userData = await getUser(user.uid);
        setStreak(
          userData && typeof userData.streak === "number" ? userData.streak : 0
        );
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
    return (
      <img
        src={char.image}
        alt={char.label}
        className="w-32 h-32 object-contain"
        style={{ imageRendering: "pixelated" }}
      />
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
        <header
          className={`flex justify-between items-center mb-10 p-6 border-2 ${
            isDarkMode
              ? "bg-linear-to-b from-gray-800 to-gray-900 border-amber-400"
              : "bg-linear-to-b from-gray-50 to-gray-100 border-amber-500"
          }`}
        >
          <div className="flex items-center gap-8">
            <div
              className={`px-6 py-4 rounded-xl font-bold text-lg ${
                isDarkMode
                  ? "bg-orange-600 text-white"
                  : "bg-linear-to-r from-orange-500 to-red-500 text-white"
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
              className="flex items-center gap-2 px-4 py-2 font-medium text-xs
                        font-['Press_Start_2P',cursive] border-2 rounded-sm
                        transition-transform duration-300 hover:-translate-y-1
                        bg-linear-to-b from-[#ff6348] to-[#ff4757] border-[#c0392b] text-white"
            >
              {isDarkMode ? <IoSunnyOutline /> : <FaRegMoon />}
              <span>{isDarkMode ? "LIGHT" : "DARK"}</span>
            </button>
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
                className={`w-full h-56 mt-2 flex flex-col items-center justify-center text-white text-6xl relative overflow-hidden shadow-inner ${
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
                {miniSwordCrew.map((character) => (
                  <div
                    key={character.id}
                    className={`p-5 flex flex-col items-center text-center transition-all duration-200 cursor-pointer border-2 shadow-md ${
                      selectedCharacter === character.id
                        ? isDarkMode
                          ? "border-[#ffd700] ring-2 ring-[#ffd700] bg-gray-900"
                          : "border-amber-600 ring-2 ring-amber-400 bg-amber-50"
                        : isDarkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-50 border-gray-300"
                    }`}
                    onClick={() => setSelectedCharacter(character.id)}
                  >
                    <div
                      className={`w-28 h-28 mb-4 flex items-center justify-center overflow-hidden border-2 ${
                        isDarkMode
                          ? "bg-gray-900 border-gray-700"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <img
                        src={character.image}
                        alt={`${character.label} Mini Sword`}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    </div>
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
                  </div>
                ))}
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
              await updateUser(user.uid, { selectedCharacter });
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
