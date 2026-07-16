import api from "./api";

export const getCurrentUser = async () => {
    const response = await api.get("/api/auth/me");

    return response.data;
};

export const updateProfile = async (profileData) => {
    const response = await api.patch("/api/auth/me", profileData);

    return response.data;
};

export const changePassword = async (passwordData) => {
    const response = await api.patch("/api/auth/me/password", passwordData);

    return response.data;
};
