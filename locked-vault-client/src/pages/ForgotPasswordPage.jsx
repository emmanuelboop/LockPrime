import { useState } from "react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import InlineFormError from "@/components/InlineFormError";
import InlineFormSuccess from "@/components/InlineFormSuccess";
import getErrorMessage from "@/utils/getErrorMessage";

import { requestPasswordReset } from "@/services/authService";

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setError("");
            setSuccessMessage("");

            const response = await requestPasswordReset(email);

            setSuccessMessage(response.message);
        } catch (submitError) {
            setError(
                getErrorMessage(submitError, "Unable to process request")
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
                        Forgot Password
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                        Enter your email and we&apos;ll send reset instructions
                        if an account exists.
                    </p>

                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        disabled={isSubmitting || Boolean(successMessage)}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            setError("");
                        }}
                    />

                    <InlineFormError message={error} />
                    <InlineFormSuccess message={successMessage} />

                    {!successMessage && (
                        <Button
                            className="w-full"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Sending..." : "Send reset link"}
                        </Button>
                    )}

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

export default ForgotPasswordPage;
