import React, { useEffect, useState } from 'react';
import { Paper, Box, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction } from '@mui/material';
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
    Avatar,
    SVGIcon,
    Text,
} from 'mui-simple';
import { s3Service } from '../services/s3Service.ts';
import { AWSCredentials, BucketInfo } from '../types/aws.ts';
import '../styles/login.scss';
import { AWS_REGIONS } from '../consts.ts';
import { AxiosError } from 'axios';
import { getProjectEnvVariables } from '../projectEnvVariables.ts';

interface LoginScreenProps {
    onLoginSuccess: (bucketInfo: BucketInfo, localstack: boolean) => void;
}

const defaultOptionValue = AWS_REGIONS.find((v) => v.default)?.value as string;

const initializeCredentials = {
    accessKeyId: getProjectEnvVariables().VITE_LOCALSTACK_ACCESS_KEY_ID ?? '',
    secretAccessKey: getProjectEnvVariables().VITE_LOCALSTACK_SECRET_ACCESS_KEY ?? '',
    region: getProjectEnvVariables().VITE_LOCALSTACK_AWS_REGION ?? defaultOptionValue,
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [showLocalstack, setShowLocalstack] = useState<boolean>(true);
    const [credentials, setCredentials] = useState<AWSCredentials>({
        accessKeyId: sessionStorage.getItem('accessKeyId') ?? initializeCredentials.accessKeyId,
        secretAccessKey: sessionStorage.getItem('secretAccessKey') ?? initializeCredentials.secretAccessKey,
        region: sessionStorage.getItem('region') ?? initializeCredentials.region,
    });
    const [localstackBuckets, setLocalstackBuckets] = useState<
        Array<{
            id: string;
            label: string;
            region: string;
            date: Date;
            public: boolean;
        }>
    >([]);
    const [bucketName, setBucketName] = useState(
        sessionStorage.getItem('bucketName') ?? getProjectEnvVariables().VITE_LOCALSTACK_AWS_BUCKET ?? 'demo'
    );
    const [isPublicAccess, setIsPublicAccess] = useState(false);
    const [isLocalstack, setIsLocalstack] = useState(
        sessionStorage.getItem('localstack')
            ? !!+(sessionStorage.getItem('localstack') as string)
            : credentials.accessKeyId === initializeCredentials.accessKeyId
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);

    const handleChange = (field: keyof AWSCredentials) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [field]: event.target.value });
        setError([]);
        setSuccess(false);
    };

    const handleBucketChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setBucketName(event.target.value);
        setError([]);
        setSuccess(false);
    };

    const handleAutocompleteBucketChange = (
        _event: React.ChangeEvent<HTMLInputElement>,
        option: string | { id?: string; inputValue?: string }
    ) => {
        setBucketName(typeof option === 'string' ? option : ((option.inputValue ?? option.id) as string));
        setError([]);
        setSuccess(false);
    };

    const handleConnect = async () => {
        if (!credentials.accessKeyId || !credentials.secretAccessKey || !bucketName) {
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

                if (credentials.accessKeyId !== initializeCredentials.accessKeyId) {
                    sessionStorage.setItem('accessKeyId', credentials.accessKeyId);
                }
                if (credentials.secretAccessKey !== initializeCredentials.secretAccessKey) {
                    sessionStorage.setItem('secretAccessKey', credentials.secretAccessKey);
                }
                if (credentials.region !== initializeCredentials.region) {
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

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            return handleConnect();
        }
    };

    const loadLocalstackBucketList = async () => {
        return s3Service
            .localstackBucketsList()
            .then((buckets) => {
                setLocalstackBuckets(
                    buckets.map(({ Name, BucketRegion, CreationDate, PublicAccessBlockConfiguration }) => ({
                        id: Name,
                        label: Name,
                        region: BucketRegion,
                        date: new Date(CreationDate),
                        public: !PublicAccessBlockConfiguration.BlockPublicPolicy,
                    }))
                );
            })
            .catch(console.error);
    };

    const isLocalstackAvailable = async (): Promise<boolean> => {
        return s3Service
            .localstackAlive()
            .then((isAlive) => {
                setShowLocalstack(isAlive);
                if (!isAlive) {
                    setCredentials({
                        accessKeyId: sessionStorage.getItem('accessKeyId') ?? '',
                        secretAccessKey: sessionStorage.getItem('secretAccessKey') ?? '',
                        region: sessionStorage.getItem('region') ?? defaultOptionValue,
                    });
                }
                return isAlive;
            })
            .catch((error) => {
                console.error(error);
                return false;
            });
    };

    useEffect(() => {
        isLocalstackAvailable()
            .then((isAlive) => {
                if (isAlive) return loadLocalstackBucketList();
            })
            .catch(console.error);
    }, []);

    const selectedOption = isLocalstack ? localstackBuckets.find((b) => b.id === bucketName) : undefined;

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

                    {isLocalstack ? (
                        <InputAutocomplete
                            label="Bucket Name"
                            variant="outlined"
                            creationAllowed
                            fullWidth
                            value={bucketName}
                            onChange={(event, option) => handleAutocompleteBucketChange(event, option as string)}
                            onKeyUp={handleKeyPress}
                            disabled={loading}
                            className="form-field"
                            required
                            options={[...localstackBuckets, { id: bucketName, label: bucketName }]}
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
                                        {option.date && (
                                            <ListItemAvatar>
                                                <Avatar
                                                    icon={option.public ? 'Public' : 'PublicOff'}
                                                    color={option.public ? 'primary' : undefined}
                                                />
                                            </ListItemAvatar>
                                        )}
                                        <ListItemText
                                            primary={<Text bold={selected}>{option.label}</Text>}
                                            secondary={
                                                option.date ? `Created at: ${option.date?.toLocaleString()}` : undefined
                                            }
                                        />
                                        {option.date && (
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
                            endCmpExternal={
                                <Tooltip
                                    title={
                                        <Text>
                                            {isPublicAccess ? 'Public bucket access' : 'Private bucket access'}
                                            <br />
                                            {selectedOption
                                                ? ' (Exists localstack bucket - checkbox is in read only mode)'
                                                : ''}
                                        </Text>
                                    }
                                >
                                    <Checkbox
                                        readOnly={!!selectedOption}
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
                            }
                        />
                    ) : (
                        <InputText
                            label="Bucket Name"
                            variant="outlined"
                            fullWidth
                            value={bucketName}
                            onChange={handleBucketChange}
                            onKeyUp={handleKeyPress}
                            disabled={loading}
                            className="form-field"
                            required
                            helperText="Enter the name of your S3 bucket"
                            endCmp={
                                <Tooltip title={isPublicAccess ? 'Public bucket access' : 'Private bucket access'}>
                                    <Checkbox
                                        icon="PublicOff"
                                        checkedIcon="Public"
                                        color={'primary'}
                                        checked={isPublicAccess}
                                        onChange={(e) => setIsPublicAccess(e.target.checked)}
                                    />
                                </Tooltip>
                            }
                        />
                    )}

                    {showLocalstack && (
                        <Checkbox
                            color="primary"
                            label={'Localstack'}
                            checked={isLocalstack}
                            onChange={(e) => {
                                setIsLocalstack(e.target.checked);
                                if (e.target.checked) {
                                    setCredentials({ ...initializeCredentials });
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
