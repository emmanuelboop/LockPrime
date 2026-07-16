import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar"

function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="flex flex-col items-center justify-center text-center px-4 py-24">
        <h1 className="text-6xl font-bold max-w-4xl">
          Save Money By Locking It Away From Yourself
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          Create savings vaults, choose a lock period, and stop impulse
          spending. Add money anytime. Withdraw only when your vault unlocks.
        </p>

        <div className="flex gap-4 mt-8">
          <Link to="/register">
            <Button size="lg">
              Get Started
            </Button>
          </Link>

          <Button
            size="lg"
            variant="outline"
          >
            Learn More
          </Button>
        </div>
      </main>
    </div>
  );
}

export default LandingPage;