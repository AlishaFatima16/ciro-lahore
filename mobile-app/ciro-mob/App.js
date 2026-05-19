import AppNavigator from './src/navigation/AppNavigator';
import { CrisisProvider } from './src/context/CrisisContext';

export default function App() {
  return (
    <CrisisProvider>
      <AppNavigator />
    </CrisisProvider>
  );
}


