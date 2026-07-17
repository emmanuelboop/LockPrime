import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import InlineFormError from "@/components/InlineFormError";
import getErrorMessage from "@/utils/getErrorMessage";

import { resetPassword } from "@/services/authService";

function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") ?? "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const clearError = () => {
        if (error) {
            setError("");
        }
    };

    const handleSubmit = async () => {
        if (!token) {
            setError("Reset link is invalid or missing");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setIsSubmitting(true);
            setError("");

            await resetPassword({ token, password });

            navigate("/login?reset=true");
        } catch (submitError) {
            setError(
                getErrorMessage(submitError, "Unable to reset password")
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
                        Reset Password
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {!token && (
                        <InlineFormError message="Reset link is invalid or missing" />
                    )}

                    <Input
                        type="password"
                        placeholder="New password"
                        value={password}
                        disabled={isSubmitting || !token}
                        onChange={(event) => {
                            setPassword(event.target.value);
                            clearError();
                        }}
                    />

                    <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        disabled={isSubmitting || !token}
                        onChange={(event) => {
                            setConfirmPassword(event.target.value);
                            clearError();
                        }}
                    />

                    <InlineFormError message={error} />

                    <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !token}
                    >
                        {isSubmitting ? "Resetting..." : "Reset password"}
                    </Button>

                    <p className="text-center text-sm">
                        <Link
                            to="/login"
                            className="text-primary underline-offset-4 hover:underline"
                        >
                            Back to login
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default ResetPasswordPage;
