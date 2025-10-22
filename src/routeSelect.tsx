import { useState } from "react";
import { Link } from "react-router-dom";

import * as mdIcons from "react-icons/md";

const RouteSelect = () => {
  const [selected, setSelected] = useState(window.location.pathname);

  const handleSelect = (to: string) => {
    setSelected(to);
  };

  return (
    <div className="space-y-1">
      <p className="text-[13px] font-extralight text-[#696969] hidden md:block">
        MENU
      </p>
      <Route
        to="/"
        selected={selected}
        Icon={mdIcons.MdOutlineDashboard}
        title="Dashboard"
        handleSelect={handleSelect}
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
};

const Route = ({ to, selected, Icon, title, handleSelect }: RouteProps) => {
  const isSelected = selected === to;
  return (
    <Link
      to={to}
      className={`flex items-center md:justify-start justify-center gap-2 w-full rounded px-2 py-2 md:py-1.5 md:text-sm text-1xl transition-all duration-300 ${
        isSelected
          ? "bg-[#ddfad7] text-green-600 shadow"
          : "hover:bg-[#ddfad7] text-[#696969] shadow-none"
      }`}
      onClick={() => handleSelect(to)}
    >
      <Icon className={`${isSelected ? "text-green-600" : ""}`} />
      <p className="text-md font-semibold hidden md:block">{title}</p>
    </Link>
  );
};

export default RouteSelect;