import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="flex justify-between items-center px-8 py-4 border-b">
      <Link to="/">
        <h1 className="text-2xl font-bold">
          Locked Vault
        </h1>
      </Link>

      <div className="flex gap-4">
        <Link to="/login">
          <Button variant="outline">
            Login
          </Button>
        </Link>

        <Link to="/register">
          <Button>
            Sign Up
          </Button>
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;