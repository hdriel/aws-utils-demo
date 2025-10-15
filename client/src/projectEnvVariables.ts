type ProjectEnvVariablesType = Pick<
    ImportMetaEnv,
    | 'VITE_SERVER_URL'
    | 'VITE_LOCALSTACK_ACCESS_KEY_ID'
    | 'VITE_LOCALSTACK_SECRET_ACCESS_KEY'
    | 'VITE_LOCALSTACK_AWS_REGION'
>;

const projectEnvVariables: ProjectEnvVariablesType = {
    VITE_SERVER_URL: '${VITE_SERVER_URL}',
    VITE_LOCALSTACK_ACCESS_KEY_ID: '${VITE_LOCALSTACK_ACCESS_KEY_ID}',
    VITE_LOCALSTACK_SECRET_ACCESS_KEY: '${VITE_LOCALSTACK_SECRET_ACCESS_KEY}',
    VITE_LOCALSTACK_AWS_REGION: '${VITE_LOCALSTACK_AWS_REGION}',
};

export const getProjectEnvVariables = (): ProjectEnvVariablesType => {
    const env: ProjectEnvVariablesType = {
        VITE_SERVER_URL: !projectEnvVariables.VITE_SERVER_URL.includes('VITE_')
            ? projectEnvVariables.VITE_SERVER_URL
            : import.meta.env.VITE_SERVER_URL,

        VITE_LOCALSTACK_ACCESS_KEY_ID: !projectEnvVariables.VITE_LOCALSTACK_ACCESS_KEY_ID.includes('VITE_')
            ? projectEnvVariables.VITE_LOCALSTACK_ACCESS_KEY_ID
            : import.meta.env.VITE_LOCALSTACK_ACCESS_KEY_ID,

        VITE_LOCALSTACK_SECRET_ACCESS_KEY: !projectEnvVariables.VITE_LOCALSTACK_SECRET_ACCESS_KEY.includes('VITE_')
            ? projectEnvVariables.VITE_LOCALSTACK_SECRET_ACCESS_KEY
            : import.meta.env.VITE_LOCALSTACK_SECRET_ACCESS_KEY,

        VITE_LOCALSTACK_AWS_REGION: !projectEnvVariables.VITE_LOCALSTACK_AWS_REGION.includes('VITE_')
            ? projectEnvVariables.VITE_LOCALSTACK_AWS_REGION
            : import.meta.env.VITE_LOCALSTACK_AWS_REGION,
    };

    return env;
};
