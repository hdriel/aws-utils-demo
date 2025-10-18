import React, { useRef } from 'react';
import { Box, Stack, useMediaQuery } from '@mui/material';
import { Button, Typography, SVGIcon, Chip, Tooltip } from 'mui-simple';
import { s3Service } from '../services/s3Service';
import '../styles/mainScreen.scss';
import { DeleteBucketDialog } from '../dialogs/DeleteBucketDialog.tsx';

interface HeaderProps {
    bucketName: string;
    isPublicBucket: boolean;
    localstack: boolean;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ bucketName, isPublicBucket, onLogout, localstack }) => {
    const mobileLayout = useMediaQuery((theme) => theme.breakpoints.down('md'));
    const deleteDialogRef = useRef<{ open: () => void }>(null);

    const handleLogout = async () => {
        await s3Service.disconnect();
        return onLogout();
    };

    return (
        <Box className="header">
            <Box className="header-title">
                <SVGIcon muiIconName="Storage" color="white" size={mobileLayout ? 25 : 30} />
                <Box>
                    <Typography variant="h6" component="h1" color={'#ececec'}>
                        AWS S3 File Explorer
                    </Typography>
                    <Stack direction="row" spacing={mobileLayout ? 0 : 2}>
                        <Typography variant="caption" color={'#ececec'} size={mobileLayout ? 15 : 17}>
                            Bucket:
                        </Typography>
                        <Chip
                            label={bucketName}
                            sx={{
                                marginInlineStart: '1em',
                                height: '28px',
                                paddingInlineEnd: '5px',
                                borderRadius: '5px',
                            }}
                            color={isPublicBucket ? 'info' : 'success'}
                            startIcon={<SVGIcon size="15px" muiIconName={isPublicBucket ? 'Public' : 'PublicOff'} />}
                            endIcon={
                                localstack ? (
                                    <Tooltip title="Are you sure you want to delete this bucket ??">
                                        <SVGIcon size="18px" muiIconName="DeleteForever" />
                                    </Tooltip>
                                ) : undefined
                            }
                            onDelete={localstack ? () => deleteDialogRef.current?.open() : undefined}
                        />
                        {localstack && (
                            <Chip
                                label="localstack"
                                color="secondary"
                                sx={{ marginInlineStart: '1em', height: '28px', borderRadius: '5px' }}
                            />
                        )}
                    </Stack>
                </Box>
            </Box>

            {mobileLayout ? (
                <Button
                    variant="contained"
                    color={'#FFFFFF'}
                    icon="LogoutOutlined"
                    onClick={handleLogout}
                    className="logout-button"
                />
            ) : (
                <Button
                    variant="outlined"
                    color="#FFFFFF"
                    startIcon="LogoutOutlined"
                    onClick={handleLogout}
                    className="logout-button"
                    label="Logout"
                />
            )}

            <DeleteBucketDialog
                ref={deleteDialogRef}
                bucketName={bucketName}
                onDeleteCB={() => handleLogout()}
                localstack={localstack}
            />
        </Box>
    );
};

// MainScreen.whyDidYouRender = true;

export default Header;
