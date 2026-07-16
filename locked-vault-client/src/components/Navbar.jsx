import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="flex justify-between items-center px-8 py-4 border-b">
      <Link to="/">
        <h1 className="text-2xl font-bold">
          LockPrime
        </h1>
      </Link>

      <div className="flex items-center gap-4">
        <a
          href="/#how-it-works"
          className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
        >
          How it works
        </a>
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