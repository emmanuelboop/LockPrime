import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
    Lock,
    PiggyBank,
    ShieldCheck,
    Timer,
    Unlock,
    Wallet,
} from "lucide-react";

import Navbar from "@/components/Navbar";

const steps = [
    {
        icon: Wallet,
        title: "Create a vault",
        description:
            "Name your savings goal and choose how long the money stays locked.",
    },
    {
        icon: PiggyBank,
        title: "Add money anytime",
        description:
            "Deposit when you can. Your balance grows while the vault stays committed.",
    },
    {
        icon: Lock,
        title: "Stay locked in",
        description:
            "Withdrawals are blocked until the unlock date — no impulse spending.",
    },
    {
        icon: Unlock,
        title: "Withdraw when ready",
        description:
            "Once your vault unlocks, withdraw your savings on your schedule.",
    },
];

const benefits = [
    {
        icon: ShieldCheck,
        title: "Commitment that sticks",
        description:
            "Self-control is hard. A time lock turns your savings plan into a rule you cannot break on a whim.",
    },
    {
        icon: Timer,
        title: "You choose the timeline",
        description:
            "Pick a lock period that fits your goal — a week, a month, or longer.",
    },
    {
        icon: PiggyBank,
        title: "Full transaction history",
        description:
            "Every deposit and withdrawal is recorded so you always know where your money went.",
    },
];

function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1">
                <section className="flex flex-col items-center justify-center text-center px-4 py-24 md:py-32">
                    <p className="text-sm font-medium text-primary uppercase tracking-wide">
                        LockPrime
                    </p>

                    <h1 className="mt-4 text-4xl md:text-6xl font-bold max-w-4xl leading-tight">
                        Save Money By Locking It Away From Yourself
                    </h1>

                    <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
                        Create savings vaults, choose a lock period, and stop impulse
                        spending. Add money anytime. Withdraw only when your vault unlocks.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                        <Link to="/register">
                            <Button size="lg">
                                Get Started
                            </Button>
                        </Link>

                        <Button size="lg" variant="outline" asChild>
                            <a href="#how-it-works">
                                Learn More
                            </a>
                        </Button>
                    </div>
                </section>

                <section
                    id="how-it-works"
                    className="border-t bg-muted/30 px-4 py-20 md:py-24"
                >
                    <div className="mx-auto max-w-5xl">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">
                                How it works
                            </h2>

                            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                                Four simple steps to turn good intentions into saved money.
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {steps.map((step, index) => (
                                <Card key={step.title} className="bg-card">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <step.icon className="size-5" />
                                            </div>

                                            <span className="text-xs font-medium text-muted-foreground">
                                                Step {index + 1}
                                            </span>
                                        </div>

                                        <CardTitle className="text-lg pt-2">
                                            {step.title}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="pt-0">
                                        <p className="text-muted-foreground">
                                            {step.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-4 py-20 md:py-24">
                    <div className="mx-auto max-w-5xl">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">
                                Why LockPrime?
                            </h2>

                            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                                Built for people who want to save — and need help staying on track.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            {benefits.map((benefit) => (
                                <Card key={benefit.title}>
                                    <CardHeader>
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                                            <benefit.icon className="size-5" />
                                        </div>

                                        <CardTitle className="text-lg">
                                            {benefit.title}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="pt-0">
                                        <p className="text-muted-foreground">
                                            {benefit.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-t bg-muted/30 px-4 py-20">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold">
                            Ready to start saving?
                        </h2>

                        <p className="mt-3 text-muted-foreground">
                            Create your free account and open your first vault in minutes.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4 mt-8">
                            <Link to="/register">
                                <Button size="lg">
                                    Create Account
                                </Button>
                            </Link>

                            <Link to="/login">
                                <Button size="lg" variant="outline">
                                    Log In
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
                LockPrime — commit to your savings goals.
            </footer>
        </div>
    );
}

export default LandingPage;
