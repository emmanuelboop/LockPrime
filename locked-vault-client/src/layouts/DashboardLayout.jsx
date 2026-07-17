import { useLocation, useNavigate } from "react-router-dom";
import { clearAuth } from "@/utils/authStorage";

function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard", highlightOn: ["/dashboard"] },
    { label: "My Vaults", path: "/dashboard", highlightOn: [] },
    { label: "Profile", path: "/profile", highlightOn: ["/profile"] },
  ];

  const getNavClassName = (highlightOn) => {
    const isActive = highlightOn.includes(location.pathname);

    return isActive
      ? "w-full text-left p-3 rounded-lg bg-muted font-medium"
      : "w-full text-left p-3 rounded-lg hover:bg-muted";
  };

  return (
    <div className="min-h-screen">
      <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-background">
        <div className="p-6">
          <h1 className="text-xl font-bold">
            LockPrime
          </h1>
        </div>

        <nav className="px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={getNavClassName(item.highlightOn)}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}

          <button
            className="w-full text-left p-3 rounded-lg hover:bg-muted"
            onClick={handleLogout}
          >
            Logout
          </button>
        </nav>
      </aside>

      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
