import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import InlineFormError from "@/components/InlineFormError";
import getErrorMessage from "@/utils/getErrorMessage";

import api from "@/services/api";

function RegisterPage() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const clearError = () => {
        if (error) {
            setError("");
        }
    };

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setIsSubmitting(true);
            setError("");

            await api.post("/api/auth/register", {
                name,
                email,
                password,
            });

            navigate("/login?registered=true");
        } catch (registerError) {
            setError(
                getErrorMessage(registerError, "Failed to create account")
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
                        Create Account
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        disabled={isSubmitting}
                        onChange={(event) => {
                            setName(event.target.value);
                            clearError();
                        }}
                    />

                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        disabled={isSubmitting}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            clearError();
                        }}
                    />

                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        disabled={isSubmitting}
                        onChange={(event) => {
                            setPassword(event.target.value);
                            clearError();
                        }}
                    />

                    <Input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        disabled={isSubmitting}
                        onChange={(event) => {
                            setConfirmPassword(event.target.value);
                            clearError();
                        }}
                    />

                    <InlineFormError message={error} />

                    <Button
                        className="w-full"
                        onClick={handleRegister}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Creating account..." : "Create Account"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default RegisterPage;
