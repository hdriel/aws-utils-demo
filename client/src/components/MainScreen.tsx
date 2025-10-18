import React, { useState } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import TreePanel from './TreePanel';
import FilePanel from './FilePanel';
import '../styles/mainScreen.scss';
import Header from './Header.tsx';

interface MainScreenProps {
    bucketName: string;
    isPublicBucket: boolean;
    localstack: boolean;
    onLogout: () => void;
}

const MainScreen: React.FC<MainScreenProps> = ({ bucketName, isPublicBucket, onLogout, localstack }) => {
    const mobileLayout = useMediaQuery((theme) => theme.breakpoints.down('md'));

    const [currentPath, setCurrentPath] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    return (
        <div className="main-screen">
            <Header
                isPublicBucket={isPublicBucket}
                bucketName={bucketName}
                localstack={localstack}
                onLogout={onLogout}
            />

            <Box className="content">
                <PanelGroup
                    autoSaveId="example"
                    direction={mobileLayout ? 'vertical' : 'horizontal'}
                    style={{ width: '100%', height: '100%' }}
                >
                    <Panel
                        defaultSize={mobileLayout ? 10 : 35}
                        minSize={mobileLayout ? 15 : 18}
                        style={{ width: '100%', height: '100%', borderRadius: '20px' }}
                    >
                        <TreePanel
                            bucketName={bucketName}
                            onFolderSelect={setCurrentPath}
                            onRefresh={handleRefresh}
                            refreshTrigger={refreshTrigger}
                        />
                    </Panel>
                    <PanelResizeHandle
                        style={{
                            background: 'transparent',
                            ...(mobileLayout ? { width: '100%', height: '5px' } : { width: '3px', height: '100%' }),
                        }}
                    />
                    <Panel
                        minSize={mobileLayout ? 35 : 50}
                        style={{ width: '100%', height: '100%', borderRadius: '20px' }}
                    >
                        <FilePanel
                            currentPath={currentPath}
                            onRefresh={handleRefresh}
                            isPublicBucket={isPublicBucket}
                        />
                    </Panel>
                </PanelGroup>
            </Box>
        </div>
    );
};

// MainScreen.whyDidYouRender = true;

export default MainScreen;
