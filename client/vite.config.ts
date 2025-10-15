import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    console.table(env);

    return {
        plugins: [react()],
        server: {
            port: 5173,
            host: true,
            watch: {
                usePolling: true,
            },
            esbuild: {
                target: 'esnext',
                platform: 'linux',
            },
        },
        define: {
            VITE_SERVER_URL: JSON.stringify(env.VITE_SERVER_URL),
            VITE_LOCALSTACK_ACCESS_KEY_ID: JSON.stringify(env.VITE_LOCALSTACK_ACCESS_KEY_ID),
            VITE_LOCALSTACK_SECRET_ACCESS_KEY: JSON.stringify(env.VITE_LOCALSTACK_SECRET_ACCESS_KEY),
            VITE_LOCALSTACK_AWS_REGION: JSON.stringify(env.VITE_LOCALSTACK_AWS_REGION),
        },
    };
});
