import React, { useState } from 'react';
import { Box, Tabs, Tab, Container } from '@mui/material';
import AnalyzePanel from './AnalyzePanel';
import PageRelationshipAnalyzer from './PageRelationshipAnalyzer';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Main: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="analysis tools"
          centered
        >
          <Tab label="📊 Batch Analysis" />
          <Tab label="🔗 Page Relationships" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <AnalyzePanel />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <PageRelationshipAnalyzer />
      </TabPanel>
    </Container>
  );
};

export default Main;
