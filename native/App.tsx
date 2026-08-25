import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// @ts-expect-error - .jsx, not yet typed
import { AppProvider } from "./src/state/store";
// @ts-expect-error - .jsx, not yet typed
import WelcomeScreen from "./src/screens/WelcomeScreen";
// @ts-expect-error - .jsx, not yet typed
import HomeScreen from "./src/screens/HomeScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </AppProvider>
  );
}
