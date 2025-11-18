import { useState, useEffect } from "react";
import { getUser, } from "../services/users";
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
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-4 flex flex-col items-center relative"
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
        <div className="flex flex-col lg:flex-row gap-10 mb-10">
          {/* Left Sidebar */}
          <aside className="w-full max-w-xs shrink-0 flex flex-col gap-8 mx-auto lg:mx-0">
            <div
              className={`p-6 rounded-2xl text-center font-bold text-lg ${
                isDarkMode
                  ? "bg-gray-800 text-white border border-gray-700"
                  : "bg-white text-gray-600 border border-gray-300"
              }`}
            >
              🟡 {userCoins} Coins
            </div>
            <div
              className={`p-6 rounded-2xl text-center font-bold w-full ${
                isDarkMode
                  ? "bg-gray-800 text-white border border-gray-700"
                  : "bg-white text-gray-600 border border-gray-300"
              }`}
            >
              <div className="text-xl mb-2"> Avatar Preview</div>
              <div className="w-full h-56 rounded-2xl mt-2 flex flex-col items-center justify-center text-white text-6xl relative overflow-hidden shadow-inner bg-gradient-to-br from-purple-600 to-indigo-700">
                {updateAvatarPreview()}
              </div>
            </div>
          </aside>

          {/* Items Display Area */}
          <main
            className={`flex-1 rounded-2xl p-8 min-h-[500px] ${
              isDarkMode
                ? "bg-gray-800 border border-gray-700"
                : "bg-white border border-gray-300"
            }`}
          >
            <h2
              className={`text-2xl font-bold mb-6 text-center ${
                isDarkMode ? "text-white" : "text-gray-600"
              }`}
            >
              Customize Your Character
            </h2>
            <section className="mb-8">
              <h3
                className={`text-xl font-semibold mb-4 text-center ${
                  isDarkMode ? "text-white" : "text-gray-700"
                }`}
              >
                Mini Sword Squad
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {miniSwordCrew.map((character) => (
                  <div
                    key={character.id}
                    className={`rounded-xl p-5 flex flex-col items-center text-center shadow-md border transition-all duration-200 cursor-pointer ${
                      selectedCharacter === character.id
                        ? isDarkMode
                          ? "border-indigo-400 ring-2 ring-indigo-300 bg-gray-900"
                          : "border-indigo-600 ring-2 ring-indigo-400 bg-indigo-50"
                        : isDarkMode
                        ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                        : "bg-gray-50 border-gray-200 hover:bg-indigo-100"
                    }`}
                    onClick={() => setSelectedCharacter(character.id)}
                  >
                    <div
                      className={`w-28 h-28 mb-4 rounded-lg flex items-center justify-center overflow-hidden border ${
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
                      className={`mt-3 px-4 py-2 rounded-lg font-bold transition-all w-full ${
                        selectedCharacter === character.id
                          ? isDarkMode
                            ? "bg-indigo-700 text-white cursor-not-allowed border border-indigo-400"
                            : "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-indigo-500 text-white hover:bg-indigo-600"
                      }`}
                      disabled={selectedCharacter === character.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCharacter(character.id);
                      }}
                    >
                      {selectedCharacter === character.id
                        ? "Selected"
                        : "Select"}
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
            className="bg-green-600 text-white border-none px-7 py-4 rounded-xl font-bold text-lg cursor-pointer hover:bg-green-700 hover:shadow-xl"
          >
            Save Character
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Avatar;
