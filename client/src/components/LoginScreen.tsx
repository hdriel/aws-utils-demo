import React, { useEffect, useState } from 'react';
import { Paper, Box, ListItem, ListItemText, ListItemSecondaryAction, Stack } from '@mui/material';
import {
    Checkbox,
    InputText,
    InputPassword,
    InputSelect,
    CircularProgress,
    Button,
    Typography,
    Tooltip,
    Alert,
    InputAutocomplete,
    SVGIcon,
    Text,
} from 'mui-simple';
import { s3Service } from '../services/s3Service.ts';
import { AWSCredentials, BucketInfo } from '../types/aws.ts';
import '../styles/login.scss';
import {
    AWS_REGIONS,
    DEFAULT_CREDENTIALS,
    DEFAULT_REGIONS_OPTION_VALUE,
    LOCALSTACK_CREDENTIALS,
    DEFAULT_BUCKET_NAME,
} from '../consts.ts';
import { AxiosError } from 'axios';
import { getProjectEnvVariables } from '../projectEnvVariables.ts';
import { useBucketOptions } from '../hooks/useBucketOptions.ts';
import { useLocalstack } from '../hooks/useLocalstack.ts';

interface LoginScreenProps {
    onLoginSuccess: (bucketInfo: BucketInfo, localstack: boolean) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [isPublicAccess, setIsPublicAccess] = useState(false);
    const [credentials, setCredentials] = useState<AWSCredentials>(DEFAULT_CREDENTIALS);
    const [bucketName, setBucketName] = useState(DEFAULT_BUCKET_NAME);
    const [isLocalstack, setIsLocalstack] = useState(
        sessionStorage.getItem('localstack')
            ? !!+(sessionStorage.getItem('localstack') as string)
            : credentials.accessKeyId === LOCALSTACK_CREDENTIALS.accessKeyId
    );
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string[]>([]);

    const showLocalstack = useLocalstack();
    const { selectedOption, bucketOptions, loadLocalstackBucketList, loadBucketList } = useBucketOptions({
        bucketName,
        isLocalstack,
        credentials,
        localstackExists: showLocalstack,
    });

    useEffect(() => {
        if (showLocalstack) {
            setCredentials(DEFAULT_CREDENTIALS);
        } else {
            setCredentials({
                accessKeyId: sessionStorage.getItem('accessKeyId') ?? '',
                secretAccessKey: sessionStorage.getItem('secretAccessKey') ?? '',
                region: sessionStorage.getItem('region') ?? DEFAULT_REGIONS_OPTION_VALUE,
            });
        }
    }, [showLocalstack]);

    const handleConnect = async () => {
        if (!credentials.accessKeyId || !credentials.secretAccessKey || !credentials.region || !bucketName) {
            setError(['Please fill in all fields']);
            return;
        }

        setLoading(true);
        setError([]);
        setSuccess(false);

        try {
            await s3Service.initialize(credentials, bucketName, isPublicAccess, isLocalstack);
            const bucketInfo = await s3Service.getConnectedBucketInfo();

            if (bucketInfo) {
                setSuccess(true);
                sessionStorage.setItem('localstack', isLocalstack ? '1' : '0');

                if (credentials.accessKeyId !== LOCALSTACK_CREDENTIALS.accessKeyId) {
                    sessionStorage.setItem('accessKeyId', credentials.accessKeyId);
                }
                if (credentials.secretAccessKey !== LOCALSTACK_CREDENTIALS.secretAccessKey) {
                    sessionStorage.setItem('secretAccessKey', credentials.secretAccessKey);
                }
                if (credentials.region !== LOCALSTACK_CREDENTIALS.region) {
                    sessionStorage.setItem('region', credentials.region);
                }
                if (bucketInfo.name !== getProjectEnvVariables().VITE_LOCALSTACK_AWS_BUCKET) {
                    sessionStorage.setItem('bucketName', bucketInfo.name);
                }

                setTimeout(() => {
                    onLoginSuccess(bucketInfo, isLocalstack);
                }, 500);
            } else {
                setError(['Failed to connect.', 'Please check your credentials and bucket name.']);
            }
        } catch (err) {
            if (err instanceof AxiosError) {
                setError([
                    'Connection failed.',
                    'Please verify your AWS credentials and bucket name.',
                    `Error: ${err.response?.data?.message || err.message}`,
                ]);
                console.error(err.response?.data?.message);
            } else {
                setError([
                    'Connection failed.',
                    'An unexpected error occurred.',
                    `Error: ${err instanceof Error ? err.message : String(err)}`,
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAutocompleteBucketChange = (
        _event: React.ChangeEvent<HTMLInputElement>,
        option: string | { id?: string; inputValue?: string }
    ) => {
        setBucketName(typeof option === 'string' ? option : ((option.inputValue ?? option.id) as string));
        setError([]);
        setSuccess(false);
    };

    const handleChange = (field: keyof AWSCredentials) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [field]: event.target.value });
        setError([]);
        setSuccess(false);
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            return handleConnect();
        }
    };

    return (
        <div className="login-container">
            <Paper className="login-card" elevation={3}>
                <div className="login-header">
                    <SVGIcon muiIconName="CloudUpload" size={60} sx={{ margin: 'auto', color: '#667eea', mb: 2 }} />
                    <Text variant="h4" component="h1" width="100%" justifyContent="center">
                        AWS S3 File Explorer
                    </Text>
                    <Typography variant="body2" color="textSecondary">
                        Enter your AWS credentials to access your S3 bucket
                    </Typography>
                </div>

                <Box className="login-form">
                    <InputText
                        label="Access Key ID"
                        variant="outlined"
                        fullWidth
                        value={credentials.accessKeyId}
                        onChange={handleChange('accessKeyId')}
                        onKeyUp={handleKeyPress}
                        disabled={loading || isLocalstack}
                        className="form-field"
                        required
                    />

                    <InputPassword
                        label="Secret Access Key"
                        variant="outlined"
                        type="password"
                        fullWidth
                        value={credentials.secretAccessKey}
                        onChange={handleChange('secretAccessKey')}
                        onKeyUp={handleKeyPress}
                        disabled={loading || isLocalstack}
                        className="form-field"
                        required
                        generateRandomAction={false}
                        copyAction={false}
                    />

                    <InputSelect
                        label="Region"
                        variant="outlined"
                        select
                        fullWidth
                        value={credentials.region}
                        onChange={handleChange('region')}
                        className="form-field"
                        required
                        disabled={loading || isLocalstack}
                        options={AWS_REGIONS.map((option) => ({ ...option, subtitle: option.value }))}
                    />

                    <InputAutocomplete
                        label="Bucket Name"
                        variant="standard"
                        creationAllowed
                        fullWidth
                        value={bucketName}
                        onChange={(event, option) => handleAutocompleteBucketChange(event, option as string)}
                        onKeyUp={handleKeyPress}
                        disabled={loading}
                        className="form-field"
                        required
                        options={[...bucketOptions, { id: bucketName, label: bucketName }]}
                        helperText="Enter the name of your S3 bucket"
                        renderOption={(props, option, { selected }) => {
                            if (option.inputValue) {
                                return (
                                    <ListItem {...props} color={selected ? 'primary' : undefined}>
                                        <ListItemText primary={option.title} />
                                    </ListItem>
                                );
                            }

                            return (
                                <ListItem {...props} color={selected ? 'primary' : undefined}>
                                    <ListItemText
                                        primary={
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <SVGIcon
                                                    muiIconName={option.public ? 'Public' : 'PublicOff'}
                                                    color={option.public ? 'primary' : undefined}
                                                    size={18}
                                                />
                                                <Text bold={selected} size={14}>
                                                    {option.label}
                                                </Text>
                                            </Stack>
                                        }
                                        secondary={
                                            option.date ? `Created at: ${option.date?.toLocaleString()}` : undefined
                                        }
                                    />
                                    {option.date && isLocalstack && (
                                        <ListItemSecondaryAction>
                                            <Button
                                                icon="DeleteForever"
                                                tooltipProps={{
                                                    title: `Delete forever bucket: ${option.label}`,
                                                    placement: 'left',
                                                }}
                                                onClick={() => {
                                                    s3Service
                                                        .deleteLocalstackBucket(option.id)
                                                        .then(() => loadLocalstackBucketList())
                                                        .catch(console.error);
                                                }}
                                            />
                                        </ListItemSecondaryAction>
                                    )}
                                </ListItem>
                            );
                        }}
                        endCmpExternal={[
                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="text"
                                    size={12}
                                    padding={0}
                                    icon={<SVGIcon muiIconName="CloudSync" />}
                                    onClick={() => loadBucketList()}
                                    tooltipProps={{ title: 'Re-fetch bucket list options' }}
                                />
                                <Tooltip
                                    title={
                                        <Text>
                                            {isPublicAccess ? 'Public bucket access' : 'Private bucket access'}
                                            <br />
                                            {selectedOption?.date
                                                ? ' (Exists localstack bucket - checkbox is in read only mode)'
                                                : ''}
                                        </Text>
                                    }
                                >
                                    <Checkbox
                                        readOnly={!!selectedOption?.date}
                                        icon="PublicOff"
                                        checkedIcon="Public"
                                        color="primary"
                                        checked={selectedOption ? selectedOption.public : isPublicAccess}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            setIsPublicAccess(e.target.checked);
                                        }}
                                    />
                                </Tooltip>
                            </Stack>,
                        ]}
                    />

                    {showLocalstack && (
                        <Checkbox
                            color="primary"
                            label={'Localstack'}
                            checked={isLocalstack}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setIsLocalstack(checked);
                                if (checked) {
                                    setCredentials({ ...LOCALSTACK_CREDENTIALS });
                                }
                            }}
                        />
                    )}

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleConnect}
                        disabled={loading}
                        className="connect-button"
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Connecting...' : 'Connect to S3'}
                    </Button>

                    {error?.length ? (
                        <Alert severity="error" className="status-message">
                            {error.map((err, index) => (
                                <p key={index}>{err}</p>
                            ))}
                        </Alert>
                    ) : null}

                    {success && (
                        <Alert severity="success" className="status-message">
                            Connected successfully! Loading file explorer...
                        </Alert>
                    )}
                </Box>
            </Paper>
        </div>
    );
};

// LoginScreen.whyDidYouRender = true;

export default LoginScreen;
