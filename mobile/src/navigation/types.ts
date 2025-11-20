import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';

// Root Navigator
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Signup: { email?: string };
  ResetPassword: undefined;
};

// Main Tab Navigator (GNB)
export type MainTabParamList = {
  HomeTab: undefined;
  ScheduleTab: undefined;
  NotificationTab: undefined;
  ProfileTab: undefined;
};

// Home Stack
export type HomeStackParamList = {
  CalendarMain: undefined;
  LessonDetail: { lessonId: string };
  LessonEdit: { lessonId: string };
  AttendanceCheck: { lessonId: string };
  LessonRecordCreate: { lessonId: string };
};

// Schedule Stack
export type ScheduleStackParamList = {
  ScheduleList: undefined;
  ScheduleCreate: undefined;
  ScheduleEdit: { scheduleId: string };
};

// Notification Stack
export type NotificationStackParamList = {
  NotificationCenter: undefined;
  NotificationDetail: { notificationId: string };
};

// Profile Stack
export type ProfileStackParamList = {
  Profile: undefined;
  ProfileEdit: undefined;
  Settings: undefined;
  GroupManage: undefined;
  PaymentHistory: undefined;
};

// Navigation Props Types
export type RootNavigationProp = StackNavigationProp<RootStackParamList>;
export type AuthNavigationProp = StackNavigationProp<AuthStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;
export type HomeNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;

// Route Props Types
export type LoginScreenRouteProp = RouteProp<AuthStackParamList, 'Login'>;
export type SignupScreenRouteProp = RouteProp<AuthStackParamList, 'Signup'>;
export type LessonDetailRouteProp = RouteProp<HomeStackParamList, 'LessonDetail'>;
