import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext.js';
import { colors } from '../theme.js';

import LoginScreen from '../screens/LoginScreen.js';
import RegisterScreen from '../screens/RegisterScreen.js';
import CameraScreen from '../screens/CameraScreen.js';
import FriendsScreen from '../screens/FriendsScreen.js';
import MessagesScreen from '../screens/MessagesScreen.js';
import ThreadScreen from '../screens/ThreadScreen.js';
import ProfileScreen from '../screens/ProfileScreen.js';

const AuthStack = createNativeStackNavigator();
const MessagesStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const AppTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.cream, card: colors.cream, border: colors.border },
};

const TAB_ICONS = {
  Camera: 'camera',
  Friends: 'people',
  Messages: 'chatbubble-ellipses',
  Profile: 'person-circle',
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MessagesNavigator() {
  return (
    <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
      <MessagesStack.Screen name="MessagesList" component={MessagesScreen} />
      <MessagesStack.Screen name="Thread" component={ThreadScreen} />
    </MessagesStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      initialRouteName="Camera"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.coral,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: { backgroundColor: colors.cream, borderTopColor: colors.border },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={`${TAB_ICONS[route.name]}${focused ? '' : '-outline'}`} size={size} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="Camera" component={CameraScreen} />
      <Tabs.Screen name="Friends" component={FriendsScreen} />
      <Tabs.Screen name="Messages" component={MessagesNavigator} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <NavigationContainer theme={AppTheme}>
      {user ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
