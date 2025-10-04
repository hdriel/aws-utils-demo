import React, { useState } from 'react';
import {
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Box,
  Typography,
  MenuItem,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { AWSCredentials } from '../types/aws';
import { s3Service } from '../services/s3Service';
import '../styles/login.scss';

interface LoginScreenProps {
  onLoginSuccess: (bucketName: string) => void;
}

const awsRegions = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState<AWSCredentials>({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
  });
  const [bucketName, setBucketName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof AWSCredentials) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials({ ...credentials, [field]: event.target.value });
    setError(null);
    setSuccess(false);
  };

  const handleBucketChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBucketName(event.target.value);
    setError(null);
    setSuccess(false);
  };

  const handleConnect = async () => {
    if (!credentials.accessKeyId || !credentials.secretAccessKey || !bucketName) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      s3Service.initialize(credentials, bucketName);
      const isConnected = await s3Service.testConnection();

      if (isConnected) {
        setSuccess(true);
        setTimeout(() => {
          onLoginSuccess(bucketName);
        }, 500);
      } else {
        setError('Failed to connect. Please check your credentials and bucket name.');
      }
    } catch (err) {
      setError('Connection failed. Please verify your AWS credentials and bucket name.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleConnect();
    }
  };

  return (
    <div className="login-container">
      <Paper className="login-card" elevation={3}>
        <div className="login-header">
          <CloudUpload sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
          <Typography variant="h4" component="h1">
            AWS S3 File Explorer
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Enter your AWS credentials to access your S3 bucket
          </Typography>
        </div>

        <Box className="login-form">
          <TextField
            label="Access Key ID"
            variant="outlined"
            fullWidth
            value={credentials.accessKeyId}
            onChange={handleChange('accessKeyId')}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="form-field"
            required
          />

          <TextField
            label="Secret Access Key"
            variant="outlined"
            type="password"
            fullWidth
            value={credentials.secretAccessKey}
            onChange={handleChange('secretAccessKey')}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="form-field"
            required
          />

          <TextField
            label="Region"
            variant="outlined"
            select
            fullWidth
            value={credentials.region}
            onChange={handleChange('region')}
            disabled={loading}
            className="form-field"
            required
          >
            {awsRegions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Bucket Name"
            variant="outlined"
            fullWidth
            value={bucketName}
            onChange={handleBucketChange}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="form-field"
            required
            helperText="Enter the name of your S3 bucket"
          />

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

          {error && (
            <Alert severity="error" className="status-message">
              {error}
            </Alert>
          )}

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
