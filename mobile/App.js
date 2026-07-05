import React, { useEffect, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { MockDataProvider } from './src/data/MockDataContext';
import LoginScreen from './src/screens/common/LoginScreen';
import SplashScreen from './src/screens/common/SplashScreen';
import { colors } from './src/theme';

export default function App() {
  const [arrancando, setArrancando] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setArrancando(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  if (arrancando) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        {!session ? (
          <LoginScreen onLogin={setSession} />
        ) : (
          <MockDataProvider>
            <AppNavigator session={session} onLogout={() => setSession(null)} />
          </MockDataProvider>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
