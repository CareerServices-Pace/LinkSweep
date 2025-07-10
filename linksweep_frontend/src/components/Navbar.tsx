import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, User, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navbar = ({ activeTab, setActiveTab }: NavbarProps) => {
  const navigate = useNavigate();
  const tabs = ["Dashboard", "Config", "History", "Manage Users"];
  const { user, logout } = useAuth();

  const handleTabClick = (tab: string) => {
    if (tab === "Dashboard") {
      navigate("/dashboard");
    } else if (tab === "Config") {
      navigate("/config");
    } else if (tab === "History") {
      navigate("/history");
    } else if (tab === "Manage Users") {
      navigate("/manage-users");
    } else {
      setActiveTab(tab);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true }); // Prevent going back
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Navigation */}
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-110 ${
                  activeTab === tab
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                )}
              </button>
            ))}
          </nav>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-2 transition-colors">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName || "User"}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-white border border-gray-200 shadow-lg z-50">
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate("/change-password")}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
