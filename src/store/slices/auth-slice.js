export const createAuthSlice = (set) => ({
    userInfo: undefined,  // Default state for userInfo
    setUserInfo: (userInfo) => set({ userInfo }),  // Correct function to set userInfo
});
