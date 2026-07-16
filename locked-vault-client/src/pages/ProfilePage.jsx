import { useEffect, useState } from "react";

import DashboardLayout from "@/layouts/DashboardLayout";
import InlineFormError from "@/components/InlineFormError";
import InlineFormSuccess from "@/components/InlineFormSuccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    changePassword,
    getCurrentUser,
    updateProfile,
} from "@/services/authService";
import getErrorMessage from "@/utils/getErrorMessage";
import { getToken, setAuth } from "@/utils/authStorage";

function ProfilePage() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [profileError, setProfileError] = useState("");
    const [profileSuccess, setProfileSuccess] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const resetProfileForm = (profile = user) => {
        if (!profile) {
            return;
        }

        setName(profile.name);
        setEmail(profile.email);
    };

    const resetPasswordForm = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
    };

    const loadProfile = async () => {
        setIsLoading(true);
        setLoadError("");

        try {
            const data = await getCurrentUser();
            setUser(data);
            resetProfileForm(data);
        } catch (error) {
            setUser(null);
            setLoadError(getErrorMessage(error, "Failed to load profile."));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleStartEditingProfile = () => {
        resetProfileForm();
        setProfileError("");
        setProfileSuccess("");
        setIsEditingProfile(true);
    };

    const handleCancelProfileEdit = () => {
        resetProfileForm();
        setProfileError("");
        setIsEditingProfile(false);
    };

    const handleProfileSubmit = async () => {
        try {
            setIsSavingProfile(true);
            setProfileError("");
            setProfileSuccess("");

            const updatedUser = await updateProfile({ name, email });

            setUser(updatedUser);
            resetProfileForm(updatedUser);

            const token = getToken();

            if (token) {
                setAuth(token, {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                });
            }

            setIsEditingProfile(false);
            setProfileSuccess("Profile updated successfully.");
        } catch (error) {
            setProfileError(getErrorMessage(error, "Failed to update profile."));
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleStartChangingPassword = () => {
        resetPasswordForm();
        setPasswordSuccess("");
        setIsChangingPassword(true);
    };

    const handleCancelPasswordChange = () => {
        resetPasswordForm();
        setIsChangingPassword(false);
    };

    const handlePasswordSubmit = async () => {
        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match");
            setPasswordSuccess("");
            return;
        }

        try {
            setIsSavingPassword(true);
            setPasswordError("");
            setPasswordSuccess("");

            await changePassword({
                currentPassword,
                newPassword,
            });

            resetPasswordForm();
            setIsChangingPassword(false);
            setPasswordSuccess("Password updated successfully.");
        } catch (error) {
            setPasswordError(getErrorMessage(error, "Failed to update password."));
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">
                    Profile
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Manage your LockPrime account details.
                </p>
            </div>

            {loadError && !isLoading && (
                <div className="mb-6 space-y-3">
                    <InlineFormError message={loadError} />

                    <Button variant="outline" onClick={loadProfile}>
                        Retry
                    </Button>
                </div>
            )}

            {isLoading && (
                <p className="text-muted-foreground">
                    Loading profile...
                </p>
            )}

            {!isLoading && !loadError && user && (
                <div className="space-y-6 max-w-xl">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle>Account Information</CardTitle>

                            {!isEditingProfile && (
                                <Button
                                    variant="outline"
                                    onClick={handleStartEditingProfile}
                                >
                                    Edit Profile
                                </Button>
                            )}
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {!isEditingProfile ? (
                                <>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Name
                                        </p>
                                        <p className="text-lg font-medium">
                                            {user.name}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Email
                                        </p>
                                        <p className="text-lg font-medium">
                                            {user.email}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Member since
                                        </p>
                                        <p className="text-lg font-medium">
                                            {new Date(user.createdAt).toLocaleDateString(undefined, {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>

                                    <InlineFormSuccess message={profileSuccess} />
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-sm text-muted-foreground">
                                            Name
                                        </label>
                                        <Input
                                            className="mt-1"
                                            value={name}
                                            disabled={isSavingProfile}
                                            onChange={(event) => {
                                                setName(event.target.value);
                                                setProfileError("");
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-muted-foreground">
                                            Email
                                        </label>
                                        <Input
                                            type="email"
                                            className="mt-1"
                                            value={email}
                                            disabled={isSavingProfile}
                                            onChange={(event) => {
                                                setEmail(event.target.value);
                                                setProfileError("");
                                            }}
                                        />
                                    </div>

                                    <InlineFormError message={profileError} />

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleProfileSubmit}
                                            disabled={isSavingProfile}
                                        >
                                            {isSavingProfile ? "Saving..." : "Save Changes"}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            onClick={handleCancelProfileEdit}
                                            disabled={isSavingProfile}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle>Password</CardTitle>

                            {!isChangingPassword && (
                                <Button
                                    variant="outline"
                                    onClick={handleStartChangingPassword}
                                >
                                    Change Password
                                </Button>
                            )}
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {!isChangingPassword ? (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Update your password to keep your account secure.
                                    </p>

                                    <InlineFormSuccess message={passwordSuccess} />
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-sm text-muted-foreground">
                                            Current Password
                                        </label>
                                        <Input
                                            type="password"
                                            className="mt-1"
                                            value={currentPassword}
                                            disabled={isSavingPassword}
                                            onChange={(event) => {
                                                setCurrentPassword(event.target.value);
                                                setPasswordError("");
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-muted-foreground">
                                            New Password
                                        </label>
                                        <Input
                                            type="password"
                                            className="mt-1"
                                            value={newPassword}
                                            disabled={isSavingPassword}
                                            onChange={(event) => {
                                                setNewPassword(event.target.value);
                                                setPasswordError("");
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-muted-foreground">
                                            Confirm New Password
                                        </label>
                                        <Input
                                            type="password"
                                            className="mt-1"
                                            value={confirmPassword}
                                            disabled={isSavingPassword}
                                            onChange={(event) => {
                                                setConfirmPassword(event.target.value);
                                                setPasswordError("");
                                            }}
                                        />
                                    </div>

                                    <InlineFormError message={passwordError} />

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handlePasswordSubmit}
                                            disabled={isSavingPassword}
                                        >
                                            {isSavingPassword ? "Updating..." : "Update Password"}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            onClick={handleCancelPasswordChange}
                                            disabled={isSavingPassword}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </DashboardLayout>
    );
}

export default ProfilePage;
