const appConfig = {
    port: import.meta.env.VITE_PORT || 3000,
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:3000',
};

export default appConfig;