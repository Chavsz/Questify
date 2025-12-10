import { useState, useEffect } from "react";
import MiniSwordManIdle from "../assets/MiniSwordManIdle.gif";
import MiniSpear from "../assets/MiniSpearManIdle.gif";
import MiniArcher from "../assets/MiniArcherIdle.gif";
import MiniMage from "../assets/MiniMageIdle.gif";
import MiniPrince from "../assets/MiniPrinceIdle.gif";

// Skin imports (idle animations)
import MiniShieldIdle from "../assets/MiniShieldIdle.gif";
import MiniHalberdIdle from "../assets/MiniHalberdIdle.gif";
import MiniCrossBowIdle from "../assets/MiniCrossBowIdle.gif";
import MiniArchMageIdle from "../assets/MiniArchMageIdle.gif";
import MiniKingIdle from "../assets/MiniKingIdle.gif";

// Avatar character list (sync with avatar.tsx)
const miniSwordCrew = [
  {
    id: "idle",
    label: "Mini Swordman",
    image: MiniSwordManIdle,
  },
  {
    id: "idle1",
    label: "Mini Spearman",
    image: MiniSpear,
  },
  {
    id: "idle2",
    label: "Mini Archer",
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

// Skin catalog
const skinCatalog: Record<string, { id: string; for: string; image: string; shopId: number }> = {
  miniShieldman: { id: "miniShieldman", for: "idle", image: MiniShieldIdle, shopId: 101 },
  miniHalberdman: { id: "miniHalberdman", for: "idle1", image: MiniHalberdIdle, shopId: 102 },
  miniCrossbow: { id: "miniCrossbow", for: "idle2", image: MiniCrossBowIdle, shopId: 103 },
  miniArchmage: { id: "miniArchmage", for: "idle3", image: MiniArchMageIdle, shopId: 104 },
  miniKing: { id: "miniKing", for: "idle4", image: MiniKingIdle, shopId: 105 },
};
import { useTheme } from "../components/theme";
import { IoSunnyOutline } from "react-icons/io5";
import { FaRegMoon } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  FaUpload,
  FaFire,
  FaCheckCircle,
} from "react-icons/fa";
import { generateQuizFromFile } from "../api/generate-quiz/generate_quiz";
import type { GeneratedQuiz } from "../api/generate-quiz/generate_quiz";
import { db, storage } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../contexts/authContexts/auth";
import { getUser, updateUser, type InventoryItem } from "../services/users";

interface QuestItem {
  id: string;
  name: string;
  details: string;
  status: "completed" | "in-progress" | "not-started";
  progress: string;
  progressText: string;
  coins?: string;
  quizId?: string;
}

const Quest = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const authContext = useAuth();
  const user = authContext?.currentUser;
  // Avatar state
  const [selectedCharacter, setSelectedCharacter] = useState<string>(
    miniSwordCrew[0].id
  );
  const [selectedSkins, setSelectedSkins] = useState<Record<string, string>>({});
  const [ownedSkins, setOwnedSkins] = useState<Record<string, boolean>>({});

  // Load selected character from Firestore
  useEffect(() => {
    const fetchSelectedCharacter = async () => {
      if (!user) return;
      const userData = await getUser(user.uid);
      if (userData && userData.selectedCharacter) {
        setSelectedCharacter(userData.selectedCharacter);
      }
      // Load selected skins and owned skins
      if (userData) {
        if (userData.selectedSkins) {
          setSelectedSkins(userData.selectedSkins);
        }
        if (userData.inventory) {
          const owned: Record<string, boolean> = {};
          userData.inventory.forEach((item: InventoryItem) => {
            if (item.slot === "skin") {
              // Map shop ID (item.id) to skin ID using skinCatalog
              const skinObj = Object.values(skinCatalog).find((s) => s.shopId === item.id);
              if (skinObj) {
                owned[skinObj.id] = true;
              }
            }
          });
          setOwnedSkins(owned);
        }
      }
    };
    fetchSelectedCharacter();
  }, [user]);
  const navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
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
        setStreak(
          userData && typeof userData.streak === "number" ? userData.streak : 0
        );
      } catch (e) {
        setStreak(0);
      } finally {
        setLoadingStreak(false);
      }
    };
    fetchStreak();
  }, [user]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [modal, setModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "confirm";
    onConfirm?: () => void;
  }>({ open: false, title: "", message: "", type: "info" });
  const [generatedQuizInfo, setGeneratedQuizInfo] = useState<{
    title: string;
    questionCount: number;
  } | null>(null);

  // Load quests from Firebase
  useEffect(() => {
    const loadQuests = async () => {
      if (!user) return;
      try {
        const questsRef = collection(db, "quests");
        const q = query(questsRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const loadedQuests: QuestItem[] = [];
        let awarded = false;
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const quizData = data.quiz as GeneratedQuiz;
          let status: "completed" | "in-progress" | "not-started" =
            "not-started";
          const totalQuestions = quizData.questions.length;
          const completedQuestions = data.completedQuestions || 0;
          if (completedQuestions === 0) {
            status = "not-started";
          } else if (completedQuestions === totalQuestions) {
            status = "completed";
            // Award exp and coins if not already awarded (add a field to mark awarded)
            if (!data.rewarded) {
              const userData = await getUser(user.uid);
              let exp = userData?.exp ?? 0;
              let level = userData?.level ?? 1;
              let coins = userData?.coins ?? 1250;
              const expToNext = 100 + (level - 1) * 50;
              exp += 100; // Award 100 exp per quest
              coins += 100; // Award 100 coins per quest
              let leveledUp = false;
              let newLevel = level;
              if (exp >= expToNext) {
                exp -= expToNext;
                newLevel = level + 1;
                leveledUp = true;
              }
              await updateUser(user.uid, { exp, level: newLevel, coins });
              await updateDoc(doc(db, "quests", docSnap.id), {
                rewarded: true,
              });
              awarded = true;
              if (leveledUp) {
                setModal({
                  open: true,
                  title: "Level Up!",
                  message: `Congratulations!\nYou reached Level ${newLevel}!`,
                  type: "success",
                  onConfirm: () =>
                    setModal((prev) => ({ ...prev, open: false })),
                });
              }
            }
          } else {
            status = "in-progress";
          }
          const progress =
            totalQuestions > 0
              ? Math.round((completedQuestions / totalQuestions) * 100)
              : 0;
          loadedQuests.push({
            id: docSnap.id,
            name: quizData.title,
            details: `Based on: ${quizData.sourceFile} • ${totalQuestions} questions`,
            status,
            progress: `${progress}%`,
            progressText: `${completedQuestions}/${totalQuestions} completed`,
            quizId: quizData.id,
          });
        }
        setQuests(loadedQuests);
        if (awarded) {
          // Optionally, show a notification or reload to reflect new exp/coins
        }
      } catch (error) {
        console.error("Error loading quests:", error);
      }
    };
    loadQuests();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <FaCheckCircle className="text-xs" />
            COMPLETED
          </span>
        );
      case "in-progress":
        return (
          <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <FaFire className="text-xs" />
            IN PROGRESS
          </span>
        );
      case "not-started":
        return (
          <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            NOT STARTED
          </span>
        );
      default:
        return null;
    }
  };

  const getQuestItemClasses = (status: string) => {
    const baseClasses =
      "p-6 mb-4 flex items-center cursor-pointer border-2 shadow-sm transition-all duration-200";
    switch (status) {
      case "completed":
        return `${baseClasses} border-green-500 ${
          isDarkMode ? "bg-green-900/30" : "bg-green-50/30"
        }`;
      case "in-progress":
        return `${baseClasses} border-orange-500 ${
          isDarkMode ? "bg-orange-900/30" : "bg-orange-50/30"
        }`;
      case "not-started":
        return `${baseClasses} border-gray-400 ${
          isDarkMode ? "bg-gray-700/30" : "bg-gray-50/30"
        }`;
      default:
        return baseClasses;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    if (!user) {
      alert("Please log in to generate quizzes");
      return;
    }

    setIsGenerating(true);

    try {
      // Store file as base64 in Firestore (avoids CORS issues with Firebase Storage)
      // Note: This works for files up to ~900KB (Firestore document limit is 1MB)
      let fileDataBase64: string | null = null;
      let fileUrl: string | null = null;
      
      if (selectedFile.size <= 900000) {
        // Convert file to base64 for storage in Firestore
        const reader = new FileReader();
        fileDataBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = result.split(',')[1] || result;
            resolve(base64);
          };
          reader.onerror = (error) => {
            console.error("Error reading file:", error);
            reject(new Error("Failed to read file"));
          };
          reader.readAsDataURL(selectedFile);
        });
      } else {
        // For larger files, try Firebase Storage (may fail due to CORS)
        try {
          const fileRef = ref(storage, `quests/${user.uid}/${Date.now()}_${selectedFile.name}`);
          await uploadBytes(fileRef, selectedFile);
          fileUrl = await getDownloadURL(fileRef);
        } catch (storageError: any) {
          console.warn("Firebase Storage upload failed:", storageError);
          throw new Error(
            `File is too large (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB). ` +
            `Please use a file smaller than 900KB, or configure Firebase Storage CORS. ` +
            `See FIREBASE_STORAGE_CORS_SETUP.md for instructions.`
          );
        }
      }

      // Ensure we have a way to store the file for regeneration
      if (!fileUrl && !fileDataBase64) {
        throw new Error("Failed to store file. Cannot proceed without file storage for regeneration.");
      }

      // Generate quiz from file
      const generatedQuiz = await generateQuizFromFile(selectedFile);

      // Save to Firebase
      const questsRef = collection(db, "quests");
      const questData: any = {
        userId: user.uid,
        quiz: generatedQuiz,
        completedQuestions: 0,
        createdAt: new Date(),
        sourceFileName: selectedFile.name,
      };
      
      if (fileUrl) {
        questData.sourceFileUrl = fileUrl;
      } else if (fileDataBase64) {
        questData.sourceFileData = fileDataBase64;
        questData.sourceFileType = selectedFile.type;
      }

      await addDoc(questsRef, questData);

      setIsUploadModalOpen(false);
      setSelectedFile(null);

      setModal({
        open: true,
        title: "",
        message: "",
        type: "success",
        onConfirm: () => {
          setModal((prev) => ({ ...prev, open: false }));
          window.location.reload();
        },
      });
      // Store quiz info for modal rendering
      setGeneratedQuizInfo({
        title: generatedQuiz.title,
        questionCount: generatedQuiz.questions.length,
      });
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      alert(`Error generating quiz: ${error.message || "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const closeInventoryModal = () => setIsInventoryModalOpen(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const filterInventoryItems = (items: InventoryItem[] = []) =>
    items.filter((item) => (item.slot ?? "inventory") === "inventory");

  const fetchInventory = async () => {
    if (!user) {
      setInventory([]);
      return;
    }
    const userData = await getUser(user.uid);
    setInventory(filterInventoryItems(userData?.inventory || []));
  };
  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const checkInventory = async () => {
    await fetchInventory();
    setIsInventoryModalOpen(true);
  };

  const renderInventoryModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`relative bg-${isDarkMode ? "gray-900" : "white"} rounded-3xl shadow-2xl p-8 w-full max-w-2xl border border-[#ffd700] flex flex-col items-center`}>
        <button
          onClick={closeInventoryModal}
          className="absolute top-4 right-4 text-2xl font-bold text-gray-700 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
          aria-label="Close Inventory"
        >
          ×
        </button>
        <div className="flex items-center gap-3 mb-6">
          <span className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-amber-600"}`}>Backpack</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 w-full">
          {inventory.length === 0 ? (
            <div className={`col-span-full text-center ${isDarkMode ? "text-white" : "text-gray-500"}`}>
              <div className="text-6xl mb-2">📦</div>
              <p>No items in your backpack</p>
            </div>
          ) : (
            inventory.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center bg-white rounded-xl shadow p-4 border-2 border-gray-500"
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
                <div className="font-bold text-lg text-indigo-600 mb-1">
                  {item.name}
                </div>
                <div className="text-gray-600 font-semibold">
                  x{item.quantity}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const embarkOnQuest = () => {
    const inProgressQuest = quests.find(
      (quest) => quest.status === "in-progress"
    );
    if (inProgressQuest) {
      alert("Continuing your in-progress quest: Algebra Fundamentals");
    } else {
      alert("Select a quest from the list to begin your adventure!");
    }
  };

  const viewQuest = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (quest && quest.quizId) {
      navigate(`/quiz/${quest.quizId}`);
    } else {
      setModal({
        open: true,
        title: "Quiz Not Found",
        message: "Quiz not found.",
        type: "error",
      });
    }
  };
  // Modal component
  const renderModal = () =>
    modal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div
          className="bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 flex flex-col items-center relative"
          style={{
            borderColor:
              modal.type === "success"
                ? "#ffd700"
                : modal.type === "error"
                ? "#EF4444"
                : modal.type === "confirm"
                ? "#F59E42"
                : "#3B82F6",
          }}
        >
          <button
            onClick={() => setModal({ ...modal, open: false })}
            className="absolute top-4 right-4 text-2xl font-bold text-gray-700 hover:text-red-500 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
            aria-label="Close Modal"
          >
            ×
          </button>
          {modal.type === "success" && generatedQuizInfo ? (
            <>
              <div className="flex flex-col items-center mb-4">
                <div className="text-2xl font-bold text-[#ffd700] mb-1">
                  Quiz Generated!
                </div>
                <div className="text-lg text-white mb-2 text-center">
                  <span className="font-semibold">
                    {generatedQuizInfo.title}
                  </span>
                  <br />
                  <span>Questions: {generatedQuizInfo.questionCount}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setModal((prev) => ({ ...prev, open: false }));
                  setGeneratedQuizInfo(null);
                  window.location.reload();
                }}
                className="mt-2 px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg shadow"
              >
                Go to Quests
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">
                  {modal.type === "success" && "✅"}
                  {modal.type === "error" && "❌"}
                  {modal.type === "info" && "ℹ️"}
                  {modal.type === "confirm" && "⚠️"}
                </span>
                <span
                  className={`text-2xl font-bold ${
                    modal.type === "success"
                      ? "text-green-600"
                      : modal.type === "error"
                      ? "text-red-600"
                      : modal.type === "confirm"
                      ? "text-yellow-600"
                      : "text-blue-600"
                  }`}
                >
                  {modal.title}
                </span>
              </div>
              <div className={`text-${isDarkMode ? "white" : "gray-700"} text-center whitespace-pre-line mb-2 text-lg`}>
                {modal.message}
              </div>
              {modal.type === "confirm" && (
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => {
                      setModal({ ...modal, open: false });
                    }}
                    className="px-6 py-2 bg-gray-300 text-gray-800 rounded font-bold shadow hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (modal.onConfirm) modal.onConfirm();
                      setModal({ ...modal, open: false });
                    }}
                    className="px-6 py-2 bg-red-500 text-white rounded font-bold shadow hover:bg-red-600"
                  >
                    Confirm
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className={`flex justify-between items-center mb-6`}>
          <div>
            <div
              className={`font-bold text-lg ml-5 ${
                isDarkMode ? "text-white" : " text-orange-600"
              }`}
            >
              Streak:{" "}
              {loadingStreak
                ? "..."
                : `${streak ?? 0} day${streak === 1 ? "" : "s"}`}
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
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xl bg-linear-to-r from-orange-500 to-red-500 text-white`}
            >
              {user?.email ? user.email.charAt(0).toUpperCase() : "?"}
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 flex-1 mb-8">
          {/* Left Sidebar - Avatar */}
          <aside className="flex flex-col">
            <div
              className={`p-5 text-center font-bold border-2 ${
                isDarkMode
                  ? "bg-gray-900 border-amber-400"
                  : "bg-white border-amber-500"
              }`}
            >
              <h3
                className={`text-xl font-bold mb-4 font-['Press_Start_2P',cursive] tracking-[0.12em] ${
                  isDarkMode ? "text-[#ffd700]" : "text-amber-600"
                }`}
              >
                Avatar Character
              </h3>
              <div className="relative">
                <div
                  className={` flex items-center justify-center shadow-md ${
                    isDarkMode
                      ? "bg-gray-800"
                      : "bg-white border border-gray-300"
                  }`}
                >
                  {(() => {
                    const char =
                      miniSwordCrew.find((c) => c.id === selectedCharacter) ||
                      miniSwordCrew[0];
                    const skinId = selectedSkins[selectedCharacter];
                    const skinObj = skinId && skinCatalog[skinId] && ownedSkins[skinId] ? skinCatalog[skinId] : null;
                    const imageToShow = skinObj ? skinObj.image : char.image;
                    return (
                      <img
                        src={imageToShow}
                        alt={char.label}
                        className="w-50 h-50 object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          </aside>

          {/* Quest List Container */}
          <main
            className={`p-8 flex flex-col border-2 ${
              isDarkMode
                ? "bg-gray-900 border-amber-400"
                : "bg-white border-amber-500"
            }`}
          >
            <h2
              className={`text-2xl text-center mb-4 font-bold font-['Press_Start_2P',cursive] ${
                isDarkMode ? "text-[#ffd700]" : "text-amber-600"
              }`}
            >
              Your Study Quests
            </h2>
            <div className="flex-1 overflow-y-auto max-h-[600px] space-y-4">
              {quests.map((quest) => (
                <div
                  key={quest.id}
                  className={getQuestItemClasses(quest.status)}
                  onClick={() => viewQuest(quest.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <div className={`font-bold text-xl ${isDarkMode ? "text-white" : "text-gray-600"} mb-2`}>
                        {quest.name}
                      </div>
                      <div className={`text-sm ${isDarkMode ? "text-white" : "text-gray-600"} mb-3`}>
                        {quest.details}
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusBadge(quest.status)}
                        {quest.coins && (
                          <span className="text-green-600 font-semibold text-sm">
                            {quest.coins}
                          </span>
                        )}
                      </div>
                      <div
                        className={`relative w-full h-2 border-2 rounded-sm overflow-hidden ${
                          isDarkMode
                            ? "bg-gray-900 border-gray-600"
                            : "bg-gray-200 border-gray-400"
                        }`}
                      >
                        <div
                          className={`h-full transition-all duration-500 ${
                            quest.status === "completed"
                              ? "bg-gradient-to-r from-[#ffd700] to-[#ffed4e] shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                              : quest.status === "in-progress"
                              ? "bg-gradient-to-r from-[#ff4757] to-[#ff6348] shadow-[0_0_10px_rgba(255,71,87,0.5)]"
                              : "bg-gray-400"
                          }`}
                          style={{ width: quest.progress }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end text-sm text-gray-600 shrink-0 ml-4 mt-2">
                    <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-600"}`}>
                      {quest.progress}
                    </div>
                    <div className={`text-sm ${isDarkMode ? "text-white" : "text-gray-600"}`}>{quest.progressText}</div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal({
                            open: true,
                            title: "Regenerate Quest?",
                            message:
                              "Regenerate this quest with different questions? Progress will be reset.",
                            type: "confirm",
                            onConfirm: async () => {
                              try {
                                setIsGenerating(true);
                                // Get quest document to retrieve file URL or base64 data
                                const questDoc = await getDoc(doc(db, "quests", quest.id));
                                const questData = questDoc.data();
                                
                                let file: File;
                                const fileName = questData?.sourceFileName || "source_file";
                                
                                if (questData?.sourceFileUrl) {
                                  // Fetch file from Storage URL
                                  const response = await fetch(questData.sourceFileUrl);
                                  const blob = await response.blob();
                                  file = new File([blob], fileName, { type: blob.type });
                                } else if (questData?.sourceFileData) {
                                  // Convert base64 data to File
                                  const base64Data = questData.sourceFileData;
                                  const fileType = questData.sourceFileType || "application/octet-stream";
                                  const byteCharacters = atob(base64Data);
                                  const byteNumbers = new Array(byteCharacters.length);
                                  for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                  }
                                  const byteArray = new Uint8Array(byteNumbers);
                                  const blob = new Blob([byteArray], { type: fileType });
                                  file = new File([blob], fileName, { type: fileType });
                                } else {
                                  alert("Source file not found. Cannot regenerate quest.");
                                  setIsGenerating(false);
                                  return;
                                }

                                // Regenerate quiz from file
                                const generatedQuiz = await generateQuizFromFile(file);

                                // Update quest with new quiz and reset progress
                                await updateDoc(doc(db, "quests", quest.id), {
                                  quiz: generatedQuiz,
                                  completedQuestions: 0,
                                  rewarded: false,
                                });

                                window.location.reload();
                              } catch (error: any) {
                                console.error("Error regenerating quiz:", error);
                                alert(`Error regenerating quiz: ${error.message || "Unknown error"}`);
                                setIsGenerating(false);
                              }
                            },
                          });
                        }}
                        className="px-3 py-1 font-bold text-xs
                                  font-['Press_Start_2P',cursive] uppercase tracking-[0.12em] border-2 rounded-sm
                                  transition-transform duration-300 hover:-translate-y-1
                                  bg-linear-to-b from-[#ffd700] to-[#ffb700] border-[#8b6914] text-[#1a1a2e]"
                      >
                        REGENERATE
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal({
                            open: true,
                            title: "Delete Quest?",
                            message:
                              "Delete this quest? This cannot be undone.",
                            type: "confirm",
                            onConfirm: async () => {
                              await deleteDoc(doc(db, "quests", quest.id));
                              window.location.reload();
                            },
                          });
                        }}
                        className="px-3 py-1 font-bold text-xs
                                  font-['Press_Start_2P',cursive] uppercase tracking-[0.12em] border-2 rounded-sm
                                  transition-transform duration-300 hover:-translate-y-1
                                  bg-linear-to-b from-[#ff6348] to-[#ff4757] border-[#c0392b] text-white"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>

        {/* Bottom Navigation */}
        <nav className="flex justify-end gap-4">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="p-6 font-bold text-xs cursor-pointer
font-['Press_Start_2P',cursive] uppercase tracking-[0.12em] border-2 rounded-sm
transition-transform duration-300 hover:-translate-y-1
bg-linear-to-b from-[#ffd700] to-[#ffb700] border-[#8b6914] text-[#1a1a2e]"
          >
            <span>UPLOAD RESOURCE</span>
          </button>
          <button
            onClick={checkInventory}
            className="p-6 font-bold text-xs cursor-pointer
font-['Press_Start_2P',cursive] uppercase tracking-[0.12em] border-2 rounded-sm
transition-transform duration-300 hover:-translate-y-1
bg-linear-to-b from-[#ff6348] to-[#ff4757] border-[#c0392b] text-white"
          >
            <span>CHECK INVENTORY</span>
          </button>
          {isInventoryModalOpen && renderInventoryModal()}
          <button
            onClick={embarkOnQuest}
            className="p-6 font-bold text-xs cursor-pointer
font-['Press_Start_2P',cursive] uppercase tracking-[0.12em] border-2 rounded-sm
transition-transform duration-300 hover:-translate-y-1
bg-linear-to-b from-[#ff6348] to-[#ff4757] border-[#c0392b] text-white"
          >
            <span>EMBARK ON QUEST</span>
          </button>
        </nav>
      </div>

      {/* Upload Modal */}
      {renderModal()}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
          <div
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } text-purple-900 rounded-2xl border-2 border-amber-500 p-8 max-w-lg w-11/12 shadow-2xl`}
          >
            <h2 className="text-3xl font-bold mb-6 text-center text-[#ffd700]">
              Upload Study Material
            </h2>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6 cursor-pointer hover:border-[#ffd700] hover:bg-purple-50/30"
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <FaUpload className="text-6xl text-[#ffd700] mb-4 mx-auto" />
              <p className="text-lg font-semibold mb-2 text-[#ffd700]">
                Click to upload
              </p>
              <p className="text-white text-sm">
                PDF, PPTX, DOCX (Max 50MB)
              </p>
            </div>
            <input
              type="file"
              id="fileInput"
              className="hidden"
              accept=".pdf,.pptx,.docx"
              onChange={handleFileSelect}
            />
            {selectedFile && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg text-center text-green-700 font-semibold">
                ✓ Selected: {selectedFile.name}
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="flex-1 p-4 border-none rounded-xl font-bold cursor-pointer hover:-translate-y-1 bg-gray-200 text-gray-600 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isGenerating}
                className="flex-1 p-4 border-none rounded-xl font-bold cursor-pointer hover:-translate-y-1 bg-linear-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? "Generating..." : "Generate Quest"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quest;
