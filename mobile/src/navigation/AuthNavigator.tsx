import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { AuthStackParamList } from './types';

// Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.SlideFromRightIOS,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{
          ...TransitionPresets.ModalSlideFromBottomIOS,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
