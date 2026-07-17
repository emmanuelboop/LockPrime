import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import InlineFormError from "@/components/InlineFormError";
import InlineFormSuccess from "@/components/InlineFormSuccess";
import { setAuth } from "@/utils/authStorage";
import getErrorMessage from "@/utils/getErrorMessage";

import api from "@/services/api";

function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const sessionExpired =
        searchParams.get("reason") === "session-expired";
    const registrationComplete =
        searchParams.get("registered") === "true";
    const passwordResetComplete =
        searchParams.get("reset") === "true";

    const handleLogin = async () => {
        try {
            setIsSubmitting(true);
            setError("");

            const response = await api.post("/api/auth/login", {
                email,
                password,
            });

            setAuth(response.data.token, response.data.user);

            navigate("/dashboard");
        } catch (loginError) {
            setError(
                getErrorMessage(loginError, "Invalid credentials")
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-2xl">
                        Login
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {sessionExpired && (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            Your session expired. Please log in again.
                        </p>
                    )}

                    {registrationComplete && (
                        <InlineFormSuccess message="Account created successfully. Please log in." />
                    )}

                    {passwordResetComplete && (
                        <InlineFormSuccess message="Password reset successfully. Please log in." />
                    )}

                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        disabled={isSubmitting}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            setError("");
                        }}
                    />

                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        disabled={isSubmitting}
                        onChange={(event) => {
                            setPassword(event.target.value);
                            setError("");
                        }}
                    />

                    <InlineFormError message={error} />

                    <Button
                        className="w-full"
                        onClick={handleLogin}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Logging in..." : "Login"}
                    </Button>

                    <p className="text-center text-sm">
                        <Link
                            to="/forgot-password"
                            className="text-primary underline-offset-4 hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default LoginPage;
