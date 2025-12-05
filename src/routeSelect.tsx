import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "./components/theme";

import * as mdIcons from "react-icons/md";
import * as FaIcons from "react-icons/fa";
import * as GiIcons from "react-icons/gi";
import * as RxIcons from "react-icons/rx";

const RouteSelect = () => {
  const [selected, setSelected] = useState(window.location.pathname);
  const { isDarkMode } = useTheme();

  const handleSelect = (to: string) => {
    setSelected(to);
  };

  return (
    <div className="space-y-2">
      <p className={`text-[13px] font-extralight hidden md:block ${
        isDarkMode ? 'text-gray-400' : 'text-[#696969]'
      }`}>
        MENU
      </p>
      <Route
        to="/"
        selected={selected}
        Icon={mdIcons.MdOutlineDashboard}
        title="Hub"
        handleSelect={handleSelect}
        isDarkMode={isDarkMode}
      />
      <Route
        to="/quest"
        selected={selected}
        Icon={GiIcons.GiCrossedSwords}
        title="Quest"
        handleSelect={handleSelect}
        isDarkMode={isDarkMode}
      />
      <Route
        to="/shop"
        selected={selected}
        Icon={FaIcons.FaShoppingCart}
        title="Shop"
        handleSelect={handleSelect}
        isDarkMode={isDarkMode}
      />
      <Route
        to="/avatar"
        selected={selected}
        Icon={RxIcons.RxAvatar}
        title="Avatar"
        handleSelect={handleSelect}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

type RouteProps = {
  to: string;
  selected: string;
  Icon: React.ElementType;
  title: string;
  handleSelect: (to: string) => void;
  isDarkMode: boolean;
};

const Route = ({ to, selected, Icon, title, handleSelect, isDarkMode }: RouteProps) => {
  const isSelected = selected === to;
  return (
    <Link
      to={to}
      className={`flex items-center md:justify-start justify-center gap-2 w-full px-2 py-2 md:py-1.5 md:text-sm text-1xl transition-transform border-2 transform duration-300 hover:-translate-y-0.5 ${
        isSelected
          ? isDarkMode 
            ? "bg-gray-700 text-[#ffd700] border-amber-400"
            : "bg-amber-100 text-amber-700 border-amber-500"
          : isDarkMode
            ? "bg-gray-900/60 text-gray-300 border-gray-700 hover:bg-gray-700 hover:border-amber-400"
            : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-amber-50 hover:border-amber-500"
      }`}
      onClick={() => handleSelect(to)}
    >
      <Icon className={`${isSelected ? (isDarkMode ? "text-[#ffd700]" : "text-amber-700") : ""}`} />
      <p className="text-md font-semibold hidden md:block">{title}</p>
    </Link>
  );
};

export default RouteSelect;