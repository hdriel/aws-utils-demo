type ProjectEnvVariablesType = Pick<
    ImportMetaEnv,
    | 'VITE_SERVER_URL'
    | 'VITE_LOCALSTACK_ACCESS_KEY_ID'
    | 'VITE_LOCALSTACK_SECRET_ACCESS_KEY'
    | 'VITE_LOCALSTACK_AWS_REGION'
    | 'VITE_LOCALSTACK_AWS_BUCKET'
>;

export const getProjectEnvVariables = (): ProjectEnvVariablesType => {
    const env: ProjectEnvVariablesType = {
        VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL,
        VITE_LOCALSTACK_ACCESS_KEY_ID: import.meta.env.VITE_LOCALSTACK_ACCESS_KEY_ID,
        VITE_LOCALSTACK_SECRET_ACCESS_KEY: import.meta.env.VITE_LOCALSTACK_SECRET_ACCESS_KEY,
        VITE_LOCALSTACK_AWS_REGION: import.meta.env.VITE_LOCALSTACK_AWS_REGION,
        VITE_LOCALSTACK_AWS_BUCKET: import.meta.env.VITE_LOCALSTACK_AWS_BUCKET,
    };

    return env;
};

console.table(getProjectEnvVariables());
