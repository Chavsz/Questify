import RouteSelect from "./routeSelect";
import * as fiIcons from "react-icons/fi";
import { doSignOut } from "./auth";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await doSignOut();
      navigate("/login", { replace: true });
    } catch (e) {
      // no-op: Toaster in pages will show any errors triggered there if needed
    }
  };
  return (
    <div className="p-4 text-white sticky top-0 bg-[#f7fffa] h-screen">
      <div className="top-4 h-[calc(100vh-32px-50px)]">
      <h1 className="text-xl md:text-2xl font-bold text-center text-green-600 mb-9 hidden md:block">PROJECT SAMSON</h1>
        <RouteSelect />
      </div>

      <div>
        <button
          className="flex items-center md:justify-start justify-center gap-2 w-full rounded px-2 py-1.5 md:text-sm text-1xl hover:bg-[#ddfad7] text-[#696969] shadow-none "
          onClick={logout}
        >
          <fiIcons.FiLogOut /> <p className="text-md font-semibold hidden md:block">Log out</p>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;