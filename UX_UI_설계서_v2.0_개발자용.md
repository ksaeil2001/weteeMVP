# UX/UI 설계서 v2.0 - 개발자용 기술 명세

**버전**: v2.0  
**작성일**: 2024-11-20  
**최종 수정일**: 2024-11-20  
**작성자**: AI Assistant  
**목적**: Claude Code가 개발 시 직접 참조할 수 있는 기술 명세서  
**상태**: ✅ 개발 준비 완료

---

## 목차

1. [기술 스택 & 아키텍처](#1-기술-스택--아키텍처)
2. [네비게이션 구조](#2-네비게이션-구조)
3. [컴포넌트 시스템](#3-컴포넌트-시스템)
4. [화면별 기술 명세](#4-화면별-기술-명세)
5. [상태 관리 & 데이터 플로우](#5-상태-관리--데이터-플로우)
6. [애니메이션 & 트랜지션](#6-애니메이션--트랜지션)
7. [에러 처리 & 로딩 상태](#7-에러-처리--로딩-상태)
8. [접근성 & 최적화](#8-접근성--최적화)

---

## 1. 기술 스택 & 아키텍처

### 1.1 프론트엔드 스택

```typescript
// React Native 0.72.6
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.6",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "react-native-reanimated": "^3.5.4",
    "react-native-gesture-handler": "^2.13.4",
    "react-native-calendars": "^1.1302.0",
    "zustand": "^4.4.6", // 상태 관리
    "react-query": "^3.39.3", // 서버 상태 관리
    "date-fns": "^2.30.0",
    "zod": "^3.22.4" // 스키마 검증
  }
}
```

### 1.2 컴포넌트 아키텍처

```
src/
├── components/          # 재사용 가능 컴포넌트
│   ├── atoms/          # Button, Input, Badge
│   ├── molecules/      # Card, ListItem, FormField
│   ├── organisms/      # Header, BottomSheet, Calendar
│   └── templates/      # ScreenLayout, ModalLayout
├── screens/            # 화면 컴포넌트
│   ├── Auth/           # S-001 ~ S-005
│   ├── Group/          # S-006 ~ S-011
│   ├── Schedule/       # S-012 ~ S-018
│   ├── Attendance/     # S-019 ~ S-021
│   ├── Lesson/         # S-022 ~ S-026
│   ├── Payment/        # S-027 ~ S-033
│   ├── Profile/        # S-034 ~ S-040
│   └── Notification/   # S-041 ~ S-043
├── navigation/         # 네비게이션 설정
├── hooks/              # 커스텀 훅
├── stores/             # Zustand 스토어
├── services/           # API 서비스
├── utils/              # 유틸리티 함수
└── constants/          # 상수 (색상, 크기, 애니메이션)
```

---

## 2. 네비게이션 구조

### 2.1 네비게이션 타입 정의

```typescript
// Root Navigator
type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

// Auth Stack
type AuthStackParamList = {
  Login: undefined;
  Signup: { email?: string };
  ResetPassword: undefined;
};

// Main Tab Navigator (GNB)
type MainTabParamList = {
  HomeTab: undefined;
  ScheduleTab: undefined;
  NotificationTab: undefined;
  ProfileTab: undefined;
};

// Home Stack
type HomeStackParamList = {
  CalendarMain: undefined; // S-012
  LessonDetail: { lessonId: string }; // S-014
  LessonEdit: { lessonId: string }; // S-015
  AttendanceCheck: { lessonId: string }; // S-019 (BottomSheet)
  LessonRecordCreate: { lessonId: string }; // S-022
};
```

### 2.2 네비게이션 계층 구조

```
RootNavigator (Stack)
└── SplashScreen (S-001)
└── OnboardingScreen (S-002)
└── AuthNavigator (Stack)
    ├── LoginScreen (S-003)
    ├── SignupScreen (S-004)
    └── ResetPasswordScreen (S-005)
└── MainNavigator (Bottom Tabs) ← GNB
    ├── HomeStack (Stack)
    │   ├── CalendarMainScreen (S-012) ← 달력 메인
    │   ├── LessonDetailScreen (S-014) ← Modal Push
    │   └── LessonRecordScreen (S-022) ← Modal Push
    ├── ScheduleStack (Stack)
    │   └── ScheduleListScreen (S-012, 리스트 뷰)
    ├── NotificationStack (Stack)
    │   ├── NotificationCenterScreen (S-041)
    │   └── NotificationDetailScreen (S-042) ← Modal
    └── ProfileStack (Stack)
        ├── ProfileScreen (S-034)
        ├── ProfileEditScreen (S-035) ← Modal
        └── SettingsScreen (S-036)
```

### 2.3 화면 전환 애니메이션 명세

```typescript
// Stack Navigator Options
const stackNavigationOptions = {
  // iOS 스타일 (오른쪽에서 슬라이드)
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: TransitionSpecs.TransitionIOSSpec,
    close: TransitionSpecs.TransitionIOSSpec,
  },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

// Modal Push (아래에서 슬라이드)
const modalPushOptions = {
  presentation: 'modal',
  gestureDirection: 'vertical',
  transitionSpec: {
    open: {
      animation: 'timing',
      config: { duration: 300, easing: Easing.out(Easing.ease) },
    },
    close: {
      animation: 'timing',
      config: { duration: 250, easing: Easing.in(Easing.ease) },
    },
  },
  cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
};

// Tab 전환 (Fade)
const tabBarOptions = {
  tabBarStyle: {
    height: 56,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarActiveTintColor: '#007AFF', // Primary 500
  tabBarInactiveTintColor: '#8E8E93', // Gray 400
};
```

---

## 3. 컴포넌트 시스템

### 3.1 Atomic Design 기반 컴포넌트

#### Atoms (최소 단위)

**Button 컴포넌트**

```typescript
// components/atoms/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'text' | 'icon';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  onPress: () => void;
  children: ReactNode;
  testID?: string;
}

const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  onPress,
  children,
  testID,
}) => {
  // 스타일 정의
  const styles = getButtonStyles(variant, size, disabled);
  
  // 햅틱 피드백
  const handlePress = () => {
    if (!disabled && !loading) {
      HapticFeedback.trigger('impactLight');
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading && <ActivityIndicator size="small" color={styles.textColor} />}
      {!loading && icon && <View style={styles.icon}>{icon}</View>}
      {!loading && <Text style={styles.text}>{children}</Text>}
    </TouchableOpacity>
  );
};

// 스타일 함수
const getButtonStyles = (variant, size, disabled) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: size === 'large' ? 16 : size === 'medium' ? 12 : 8,
    paddingHorizontal: size === 'large' ? 24 : size === 'medium' ? 16 : 12,
    borderRadius: 12,
    backgroundColor: disabled ? '#E0E0E0' : 
                     variant === 'primary' ? '#007AFF' : 
                     'transparent',
    borderWidth: variant === 'secondary' ? 1 : 0,
    borderColor: '#007AFF',
  },
  text: {
    fontSize: size === 'large' ? 16 : 14,
    fontWeight: '600',
    color: disabled ? '#BDBDBD' :
           variant === 'primary' ? '#FFFFFF' :
           '#007AFF',
  },
  textColor: variant === 'primary' ? '#FFFFFF' : '#007AFF',
  icon: {
    marginRight: 8,
  },
});
```

**Input 컴포넌트**

```typescript
// components/atoms/Input.tsx
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  autoFocus?: boolean;
  testID?: string;
}

const Input: FC<InputProps> = ({
  type = 'text',
  value,
  onChangeText,
  placeholder,
  label,
  error,
  disabled = false,
  maxLength,
  multiline = false,
  numberOfLines = 1,
  autoFocus = false,
  testID,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // 키보드 타입 결정
  const keyboardType = 
    type === 'email' ? 'email-address' :
    type === 'number' ? 'numeric' :
    type === 'tel' ? 'phone-pad' : 'default';

  // 보안 입력 여부
  const secureTextEntry = type === 'password' && !isPasswordVisible;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.focused,
        error && styles.error,
        disabled && styles.disabled,
      ]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#BDBDBD"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoFocus={autoFocus}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          testID={testID}
        />
        
        {type === 'password' && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
          >
            <Icon name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {maxLength && !error && (
        <Text style={styles.charCount}>
          {value.length} / {maxLength}
        </Text>
      )}
    </View>
  );
};
```

#### Molecules (조합 단위)

**Card 컴포넌트**

```typescript
// components/molecules/Card.tsx
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined';
  onPress?: () => void;
  testID?: string;
  children: ReactNode;
}

const Card: FC<CardProps> = ({
  variant = 'default',
  onPress,
  testID,
  children,
}) => {
  const styles = getCardStyles(variant);
  
  const CardContent = (
    <View style={styles.container}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        testID={testID}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

const getCardStyles = (variant) => ({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...(variant === 'elevated' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    }),
    ...(variant === 'outlined' && {
      borderWidth: 1,
      borderColor: '#E0E0E0',
    }),
  },
});
```

**ListItem 컴포넌트**

```typescript
// components/molecules/ListItem.tsx
interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  badge?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  swipeable?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  testID?: string;
}

const ListItem: FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  badge,
  onPress,
  onLongPress,
  swipeable = false,
  onSwipeLeft,
  onSwipeRight,
  testID,
}) => {
  if (swipeable) {
    return (
      <Swipeable
        renderLeftActions={() => renderLeftAction(onSwipeLeft)}
        renderRightActions={() => renderRightAction(onSwipeRight)}
        testID={`${testID}-swipeable`}
      >
        <ListItemContent {...props} />
      </Swipeable>
    );
  }

  return <ListItemContent {...props} />;
};

const ListItemContent = ({ title, subtitle, leftIcon, rightIcon, badge, onPress, onLongPress, testID }) => (
  <TouchableOpacity
    style={styles.container}
    onPress={onPress}
    onLongPress={onLongPress}
    activeOpacity={0.7}
    testID={testID}
  >
    {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
    
    <View style={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {badge && <Badge variant="primary">{badge}</Badge>}
      </View>
      
      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      )}
    </View>
    
    {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
  </TouchableOpacity>
);
```

#### Organisms (복합 단위)

**Header 컴포넌트**

```typescript
// components/organisms/Header.tsx
interface HeaderProps {
  type: 'default' | 'large' | 'search';
  title?: string;
  leftAction?: {
    icon: string;
    onPress: () => void;
    testID?: string;
  };
  rightActions?: Array<{
    icon: string;
    onPress: () => void;
    badge?: number;
    testID?: string;
  }>;
  searchProps?: {
    value: string;
    onChangeText: (text: string) => void;
    onSubmit: () => void;
    placeholder?: string;
  };
}

const Header: FC<HeaderProps> = ({
  type = 'default',
  title,
  leftAction,
  rightActions = [],
  searchProps,
}) => {
  return (
    <View style={[styles.container, type === 'large' && styles.large]}>
      {/* Left Action */}
      {leftAction && (
        <TouchableOpacity
          onPress={leftAction.onPress}
          style={styles.action}
          testID={leftAction.testID}
        >
          <Icon name={leftAction.icon} size={24} color="#000" />
        </TouchableOpacity>
      )}

      {/* Title or Search */}
      <View style={styles.center}>
        {type === 'search' && searchProps ? (
          <SearchBar {...searchProps} />
        ) : (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>

      {/* Right Actions */}
      <View style={styles.rightActions}>
        {rightActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={action.onPress}
            style={styles.action}
            testID={action.testID}
          >
            <Icon name={action.icon} size={24} color="#000" />
            {action.badge && action.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {action.badge > 99 ? '99+' : action.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
```

**BottomSheet 컴포넌트**

```typescript
// components/organisms/BottomSheet.tsx
interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  height?: number | 'auto';
  draggable?: boolean;
  children: ReactNode;
}

const BottomSheet: FC<BottomSheetProps> = ({
  visible,
  onClose,
  height = 'auto',
  draggable = true,
  children,
}) => {
  const translateY = useSharedValue(1000);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // 슬라이드 업 애니메이션
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      // 슬라이드 다운 애니메이션
      translateY.value = withTiming(1000, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.container, animatedStyle]}>
        {draggable && (
          <View style={styles.handle}>
            <View style={styles.handleBar} />
          </View>
        )}
        
        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});
```

---

## 4. 화면별 기술 명세

### 4.1 S-003: 로그인 화면

#### 컴포넌트 계층 구조

```
LoginScreen
├── SafeAreaView
│   └── KeyboardAvoidingView
│       └── ScrollView
│           ├── Header (Organism)
│           │   └── Logo (Image)
│           ├── FormSection (View)
│           │   ├── Input (Atom) - 이메일
│           │   ├── Input (Atom) - 비밀번호
│           │   └── TouchableOpacity - 비밀번호 찾기 (LNB)
│           ├── ButtonGroup (View)
│           │   └── Button (Atom) - 로그인 (CTA)
│           ├── Divider (View)
│           │   └── Text - "또는"
│           ├── SocialLoginGroup (View)
│           │   ├── Button (Atom) - 구글
│           │   └── Button (Atom) - 카카오
│           └── Footer (View)
│               └── TouchableOpacity - 회원가입 링크
└── Toast (Modal) - 에러 메시지
```

#### Props 정의

```typescript
interface LoginScreenProps {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
  route: RouteProp<AuthStackParamList, 'Login'>;
}

interface LoginFormState {
  email: string;
  password: string;
  errors: {
    email?: string;
    password?: string;
  };
  isLoading: boolean;
}
```

#### 상태 관리

```typescript
// screens/Auth/LoginScreen.tsx
const LoginScreen: FC<LoginScreenProps> = ({ navigation }) => {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  
  // Store (Zustand)
  const { login, isAuthenticated } = useAuthStore();
  
  // Validation Schema
  const loginSchema = z.object({
    email: z.string().email('올바른 이메일 형식을 입력해주세요'),
    password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  });

  // Handlers
  const handleLogin = async () => {
    try {
      // 1. 클라이언트 검증
      const validated = loginSchema.parse({ email, password });
      setErrors({});
      
      // 2. 로딩 시작
      setIsLoading(true);
      
      // 3. API 호출
      const result = await login(validated.email, validated.password);
      
      // 4. 성공 처리
      if (result.success) {
        // 네비게이션 이동
        navigation.replace('Main');
        
        // 성공 토스트
        showToast({
          type: 'success',
          message: '로그인 성공!',
          duration: 2000,
        });
      }
    } catch (error) {
      // 5. 에러 처리
      if (error instanceof z.ZodError) {
        // 검증 에러
        const fieldErrors = error.flatten().fieldErrors;
        setErrors({
          email: fieldErrors.email?.[0],
          password: fieldErrors.password?.[0],
        });
      } else {
        // API 에러
        showToast({
          type: 'error',
          message: error.message || '로그인에 실패했습니다',
          duration: 4000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ResetPassword');
  };

  const handleSignup = () => {
    navigation.navigate('Signup', { email });
  };

  // 자동 로그인 체크
  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Main');
    }
  }, [isAuthenticated]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={require('@/assets/logo.png')} style={styles.logo} />
            <Text style={styles.logoText}>WeTee</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Input
              type="email"
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              error={errors.email}
              autoFocus
              testID="login-email-input"
            />
            
            <Input
              type="password"
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              placeholder="8자 이상 입력"
              error={errors.password}
              testID="login-password-input"
            />

            {/* LNB - 비밀번호 찾기 */}
            <TouchableOpacity 
              onPress={handleForgotPassword}
              style={styles.forgotPassword}
            >
              <Text style={styles.linkText}>비밀번호를 잊으셨나요?</Text>
            </TouchableOpacity>
          </View>

          {/* CTA - 로그인 버튼 */}
          <View style={styles.buttonGroup}>
            <Button
              variant="primary"
              size="large"
              onPress={handleLogin}
              loading={isLoading}
              disabled={!email || !password}
              testID="login-submit-button"
            >
              로그인
            </Button>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <View style={styles.socialLoginGroup}>
            <Button
              variant="secondary"
              size="large"
              icon={<GoogleIcon />}
              onPress={() => console.log('Google Login')}
              testID="google-login-button"
            >
              구글로 계속하기
            </Button>
            
            <Button
              variant="secondary"
              size="large"
              icon={<KakaoIcon />}
              onPress={() => console.log('Kakao Login')}
              testID="kakao-login-button"
            >
              카카오로 계속하기
            </Button>
          </View>

          {/* Footer - 회원가입 링크 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              아직 계정이 없으신가요?{' '}
              <Text style={styles.linkText} onPress={handleSignup}>
                회원가입
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
```

#### 페이지 전환 플로우

```
[S-003 로그인 화면]
├── 사용자 입력
│   ├── 이메일 입력 → 실시간 검증 (Debounce 300ms)
│   ├── 비밀번호 입력 → 8자 이상 체크
│   └── 입력 완료 → 로그인 버튼 활성화
│
├── 로그인 버튼 클릭
│   ├── 1. 클라이언트 검증 (Zod)
│   │   └── 실패 → 입력 필드 하단에 에러 메시지 표시
│   ├── 2. 로딩 상태 시작
│   │   ├── 버튼 → Spinner 표시
│   │   └── 입력 필드 → 비활성화
│   ├── 3. API 호출 (/api/auth/login)
│   │   ├── 성공 (200) → JWT 토큰 저장 (Secure Storage)
│   │   │   ├── 사용자 정보 Zustand Store에 저장
│   │   │   ├── 네비게이션: navigation.replace('Main')
│   │   │   └── Toast: "로그인 성공!" (Success, 2초)
│   │   │
│   │   ├── 실패 (401) → Toast: "이메일 또는 비밀번호가 일치하지 않습니다" (Error, 4초)
│   │   ├── 실패 (429) → Toast: "로그인 시도 횟수 초과. 5분 후 다시 시도해주세요" (Error, 4초)
│   │   └── 네트워크 에러 → Toast: "네트워크 연결을 확인해주세요" + "다시 시도" 버튼
│   │
│   └── 4. 로딩 상태 종료
│       └── 버튼 → 원래 텍스트 복원
│
├── 비밀번호 찾기 클릭
│   └── 네비게이션: navigation.navigate('ResetPassword')
│       └── 전환 애니메이션: Modal Push (300ms, Vertical Slide)
│
├── 회원가입 링크 클릭
│   └── 네비게이션: navigation.navigate('Signup', { email })
│       └── 전환 애니메이션: Stack Push (300ms, Horizontal Slide)
│
└── 구글/카카오 로그인 클릭
    ├── 외부 브라우저 오픈 (OAuth 2.0 Flow)
    ├── 인증 완료 → Deep Link로 앱 복귀
    ├── Access Token 획득 → 서버 검증
    └── 성공 → Main 화면 이동
```

---

### 4.2 S-012: 달력 메인 화면 (홈)

#### 컴포넌트 계층 구조

```
CalendarMainScreen
├── SafeAreaView
│   ├── Header (Organism) ← GNB의 일부
│   │   ├── Logo (TouchableOpacity)
│   │   ├── MonthPicker (TouchableOpacity) ← Dropdown 트리거
│   │   │   └── Text - "11월 2025년"
│   │   ├── AddButton (TouchableOpacity) - [+]
│   │   └── FilterButton (TouchableOpacity) - 📋
│   │
│   ├── ViewToggle (SegmentedControl)
│   │   ├── Button - "달력 뷰"
│   │   └── Button - "리스트 뷰"
│   │
│   ├── ScrollView (Tab Content Area)
│   │   ├── [달력 뷰 모드]
│   │   │   ├── Calendar (Organism)
│   │   │   │   ├── WeekDays (View)
│   │   │   │   ├── CalendarGrid (FlatList)
│   │   │   │   │   └── DayCell (Molecule)
│   │   │   │   │       ├── DayNumber (Text)
│   │   │   │   │       └── EventDots (View) ← 최대 3개
│   │   │   │   └── SelectedDateHeader (View)
│   │   │   │
│   │   │   └── TodayLessons (View) ← Accordion 영역
│   │   │       ├── SectionHeader (View)
│   │   │       │   └── Text - "오늘의 수업 (2개)"
│   │   │       └── LessonCardList (FlatList)
│   │   │           └── LessonCard (Molecule) ← Card
│   │   │               ├── TimeLabel (Text)
│   │   │               ├── SubjectBadge (Badge)
│   │   │               ├── StudentName (Text)
│   │   │               ├── AttendanceStatus (Badge)
│   │   │               └── ActionButton (Button) ← CTA
│   │   │
│   │   └── [리스트 뷰 모드]
│   │       └── LessonList (SectionList)
│   │           ├── SectionHeader (View) - 날짜별
│   │           └── LessonCard (Molecule)
│   │
│   └── BottomTabBar ← GNB
│       ├── Tab - 홈 (활성)
│       ├── Tab - 일정
│       ├── Tab - 알림
│       └── Tab - 내정보
│
└── BottomSheet (Modal) ← 조건부 렌더링
    ├── [AddActionSheet]
    │   ├── Option - "정규 수업 추가"
    │   └── Option - "보강 예약"
    │
    ├── [FilterSheet]
    │   ├── RadioButton - "전체"
    │   ├── RadioButton - "그룹 1"
    │   └── RadioButton - "그룹 2"
    │
    └── [MonthPickerSheet]
        └── Picker - 월 선택 (1~12월)
```

#### Props & State

```typescript
interface CalendarMainScreenProps {
  navigation: BottomTabNavigationProp<MainTabParamList, 'HomeTab'>;
}

interface CalendarState {
  viewMode: 'calendar' | 'list';
  selectedDate: string; // ISO 8601
  currentMonth: string; // YYYY-MM
  selectedGroup: string | null; // null = 전체
  isLoading: boolean;
  refreshing: boolean;
}

interface Lesson {
  id: string;
  groupId: string;
  startTime: string; // ISO 8601
  endTime: string;
  subject: string;
  studentName: string;
  attendanceStatus: 'pending' | 'present' | 'absent';
  hasRecord: boolean;
}
```

#### 화면 로직

```typescript
const CalendarMainScreen: FC<CalendarMainScreenProps> = ({ navigation }) => {
  // UI State
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  // BottomSheet State
  const [isAddSheetVisible, setIsAddSheetVisible] = useState(false);
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);

  // Data Fetching (React Query)
  const {
    data: lessons,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['lessons', currentMonth, selectedGroup],
    queryFn: () => fetchLessons(currentMonth, selectedGroup),
    staleTime: 5 * 60 * 1000, // 5분
  });

  // Handlers
  const handleDatePress = (date: string) => {
    setSelectedDate(date);
    // 달력 뷰에서는 선택한 날짜로 스크롤
    if (viewMode === 'calendar') {
      scrollToDate(date);
    }
  };

  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
    setIsMonthPickerVisible(false);
  };

  const handleAddPress = () => {
    setIsAddSheetVisible(true);
  };

  const handleFilterPress = () => {
    setIsFilterSheetVisible(true);
  };

  const handleLessonCardPress = (lessonId: string) => {
    navigation.navigate('LessonDetail', { lessonId });
  };

  const handleAttendanceCheckPress = (lessonId: string) => {
    // BottomSheet로 출결 체크 화면 열기
    navigation.navigate('AttendanceCheck', { lessonId });
  };

  const handleLessonRecordPress = (lessonId: string) => {
    navigation.navigate('LessonRecordCreate', { lessonId });
  };

  // Pull to Refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // 오늘 날짜의 수업 필터링
  const todayLessons = useMemo(() => {
    return lessons?.filter(lesson => 
      format(parseISO(lesson.startTime), 'yyyy-MM-dd') === selectedDate
    ) || [];
  }, [lessons, selectedDate]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header (GNB 일부) */}
      <Header
        type="default"
        title={
          <TouchableOpacity onPress={() => setIsMonthPickerVisible(true)}>
            <Text style={styles.monthText}>
              {format(parseISO(currentMonth), 'M월 yyyy년')}
              <Icon name="chevron-down" size={16} />
            </Text>
          </TouchableOpacity>
        }
        leftAction={{
          icon: 'home',
          onPress: () => {
            // 이미 홈이면 스크롤 탑
            if (viewMode === 'calendar') {
              scrollToTop();
            }
          },
        }}
        rightActions={[
          {
            icon: 'plus',
            onPress: handleAddPress,
            testID: 'add-button',
          },
          {
            icon: 'filter',
            onPress: handleFilterPress,
            testID: 'filter-button',
          },
        ]}
      />

      {/* View Toggle (SegmentedControl) */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'calendar' && styles.toggleButtonActive]}
          onPress={() => setViewMode('calendar')}
        >
          <Text style={styles.toggleText}>달력 뷰</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={styles.toggleText}>리스트 뷰</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {viewMode === 'calendar' ? (
          <>
            {/* Calendar */}
            <Calendar
              current={currentMonth}
              onDayPress={(day) => handleDatePress(day.dateString)}
              markedDates={getMarkedDates(lessons, selectedDate)}
              theme={calendarTheme}
            />

            {/* Today's Lessons (Accordion) */}
            <View style={styles.todaySection}>
              <Text style={styles.sectionTitle}>
                오늘의 수업 ({todayLessons.length}개)
              </Text>
              
              {todayLessons.length === 0 ? (
                <EmptyState
                  icon="calendar-blank"
                  message="오늘 일정이 없습니다"
                  action={{
                    label: "정규 수업 추가",
                    onPress: handleAddPress,
                  }}
                />
              ) : (
                <FlatList
                  data={todayLessons}
                  renderItem={({ item }) => (
                    <LessonCard
                      lesson={item}
                      onPress={() => handleLessonCardPress(item.id)}
                      onAttendancePress={() => handleAttendanceCheckPress(item.id)}
                      onRecordPress={() => handleLessonRecordPress(item.id)}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              )}
            </View>
          </>
        ) : (
          // List View
          <LessonList
            lessons={lessons}
            onLessonPress={handleLessonCardPress}
            onAttendancePress={handleAttendanceCheckPress}
            onRecordPress={handleLessonRecordPress}
          />
        )}
      </ScrollView>

      {/* BottomSheet - Add Actions */}
      <BottomSheet
        visible={isAddSheetVisible}
        onClose={() => setIsAddSheetVisible(false)}
        height={200}
      >
        <ListItem
          title="정규 수업 추가"
          leftIcon={<Icon name="plus-circle" size={24} />}
          onPress={() => {
            setIsAddSheetVisible(false);
            navigation.navigate('RegularLessonCreate');
          }}
        />
        <ListItem
          title="보강 예약"
          leftIcon={<Icon name="calendar-plus" size={24} />}
          onPress={() => {
            setIsAddSheetVisible(false);
            navigation.navigate('MakeupLessonBook');
          }}
        />
      </BottomSheet>

      {/* BottomSheet - Filter */}
      <BottomSheet
        visible={isFilterSheetVisible}
        onClose={() => setIsFilterSheetVisible(false)}
        height={300}
      >
        <RadioGroup
          value={selectedGroup || 'all'}
          onValueChange={(value) => {
            setSelectedGroup(value === 'all' ? null : value);
            setIsFilterSheetVisible(false);
          }}
        >
          <RadioButton value="all" label="전체" />
          <RadioButton value="group1" label="그룹 1" />
          <RadioButton value="group2" label="그룹 2" />
        </RadioGroup>
      </BottomSheet>

      {/* BottomSheet - Month Picker */}
      <BottomSheet
        visible={isMonthPickerVisible}
        onClose={() => setIsMonthPickerVisible(false)}
        height={400}
      >
        <MonthPicker
          selectedMonth={currentMonth}
          onMonthSelect={handleMonthChange}
        />
      </BottomSheet>
    </SafeAreaView>
  );
};
```

#### 페이지 전환 & 인터랙션 플로우

```
[S-012 달력 메인 화면 진입]
├── 1. 화면 마운트
│   ├── useQuery 트리거 → API 호출 시작
│   ├── Skeleton UI 표시 (달력 + 카드 2개)
│   │   └── Shimmer 애니메이션 (1000ms 반복)
│   ├── API 응답 (200ms ~ 1s)
│   │   ├── 성공 → 데이터 렌더링
│   │   │   ├── 달력에 이벤트 점 표시
│   │   │   └── 오늘의 수업 카드 렌더링
│   │   └── 실패 → ErrorBoundary
│   │       └── "네트워크 오류" + "다시 시도" 버튼
│   └── 화면 전환 애니메이션 완료
│
├── 2. 사용자 인터랙션
│   │
│   ├── [달력 날짜 탭]
│   │   ├── DayCell 터치 감지
│   │   ├── Haptic Feedback (impactLight)
│   │   ├── 선택 상태 변경
│   │   │   ├── 이전 선택 날짜 → 연한 파란색 해제
│   │   │   └── 새 선택 날짜 → 연한 파란색 배경 (300ms Fade)
│   │   └── ScrollView → 해당 날짜 카드로 스크롤 (500ms, Ease Out)
│   │
│   ├── [월 선택 탭]
│   │   ├── Header의 "11월 2025년" 터치
│   │   ├── BottomSheet 열기 (300ms, Slide Up + Spring)
│   │   │   ├── Backdrop Fade In (200ms)
│   │   │   └── Sheet Transform: translateY(1000) → 0
│   │   ├── Picker에서 월 선택
│   │   ├── BottomSheet 닫기 (250ms, Slide Down)
│   │   ├── API 재호출 (새 월의 데이터)
│   │   ├── Skeleton UI 표시
│   │   └── 데이터 렌더링
│   │
│   ├── [뷰 모드 전환 (달력 ↔ 리스트)]
│   │   ├── Toggle 버튼 터치
│   │   ├── 버튼 상태 변경 (300ms, Ease)
│   │   │   ├── 비활성 → 활성: 배경 파란색, 텍스트 흰색
│   │   │   └── 활성 → 비활성: 배경 투명, 텍스트 회색
│   │   └── Content Area 전환 (300ms, Fade + Slide)
│   │       ├── 달력 뷰 Fade Out (150ms) → 리스트 뷰 Fade In (150ms)
│   │       └── translateX(-50) → 0 (Slide Effect)
│   │
│   ├── [+ 버튼 탭]
│   │   ├── BottomSheet 열기 (300ms)
│   │   ├── 옵션 선택
│   │   │   ├── "정규 수업 추가" → navigation.navigate('RegularLessonCreate')
│   │   │   │   └── Modal Push (300ms, Vertical Slide)
│   │   │   └── "보강 예약" → navigation.navigate('MakeupLessonBook')
│   │   │       └── Modal Push (300ms, Vertical Slide)
│   │   └── BottomSheet 닫기
│   │
│   ├── [필터 버튼 탭]
│   │   ├── BottomSheet 열기 (300ms)
│   │   ├── Radio Button 선택
│   │   │   ├── 선택 상태 변경 (Checkbox 체크 애니메이션)
│   │   │   └── selectedGroup State 업데이트
│   │   ├── BottomSheet 닫기
│   │   ├── API 재호출 (필터 적용)
│   │   └── 데이터 렌더링
│   │
│   ├── [수업 카드 탭]
│   │   ├── Card 터치 감지
│   │   ├── 배경색 변경: White → Gray 100 (100ms)
│   │   ├── 터치 해제: Gray 100 → White (100ms)
│   │   └── navigation.navigate('LessonDetail', { lessonId })
│   │       └── Stack Push (300ms, Horizontal Slide)
│   │
│   ├── ["출결 체크하기" 버튼 탭]
│   │   ├── Button Press 애니메이션 (Scale Down 0.95, 100ms)
│   │   ├── Haptic Feedback (impactMedium)
│   │   └── BottomSheet 열기 (S-019 출결 체크)
│   │       ├── AttendanceCheckSheet 컴포넌트 렌더링
│   │       └── 300ms Slide Up 애니메이션
│   │
│   ├── ["수업 기록 작성" 버튼 탭]
│   │   └── navigation.navigate('LessonRecordCreate', { lessonId })
│   │       └── Modal Push (300ms, Vertical Slide)
│   │
│   └── [Pull to Refresh]
│       ├── ScrollView 상단에서 아래로 당기기
│       ├── RefreshControl 활성화
│       │   └── Spinner 표시 (회전 애니메이션)
│       ├── API 재호출
│       ├── 데이터 갱신
│       └── RefreshControl 비활성화 (500ms)
│
└── 3. Tab Bar 인터랙션
    ├── [일정 탭 탭]
    │   └── 같은 화면이므로 무반응
    │
    ├── [알림 탭 탭]
    │   ├── Tab 전환 애니메이션 (Fade, 200ms)
    │   └── navigation.navigate('NotificationTab')
    │
    ├── [내정보 탭 탭]
    │   └── navigation.navigate('ProfileTab')
    │
    └── [알림 탭 Badge]
        └── 읽지 않은 알림 수 표시 (빨간 배경, 흰 텍스트)
```

---

### 4.3 S-022: 수업 기록 작성 화면

#### 컴포넌트 계층 구조

```
LessonRecordCreateScreen (Modal)
├── SafeAreaView
│   ├── Header (Organism)
│   │   ├── LeftAction - "← 취소"
│   │   ├── Title - "수업 기록 작성"
│   │   └── RightAction - "임시저장" (텍스트 버튼)
│   │
│   ├── KeyboardAvoidingView
│   │   └── ScrollView
│   │       ├── LessonInfo (Card) ← 읽기 전용
│   │       │   ├── Text - "최학생 - 수학"
│   │       │   └── Text - "2025.11.13 (수) 15:00-17:00"
│   │       │
│   │       ├── Section - "오늘 배운 내용" *
│   │       │   ├── Label (Text) + Badge("필수")
│   │       │   ├── Input (Atom)
│   │       │   │   └── TextArea (multiline, 2000자)
│   │       │   └── CharCount - "125 / 2000"
│   │       │
│   │       ├── Section - "오늘 진행한 진도" (선택)
│   │       │   ├── Label (Text)
│   │       │   ├── BookSelector (Dropdown) ← Select
│   │       │   │   └── "개념원리 수학 (상) ▼"
│   │       │   ├── PageRange (View)
│   │       │   │   ├── Input - 시작 페이지
│   │       │   │   ├── Text - "~"
│   │       │   │   └── Input - 끝 페이지
│   │       │   ├── AutoCalculated - "14페이지 진행"
│   │       │   └── AddBookButton (TouchableOpacity)
│   │       │       └── "+ 다른 교재 진도 추가"
│   │       │
│   │       ├── Section - "학생 상태" (선택)
│   │       │   ├── Label (Text)
│   │       │   └── Input (TextArea, 500자)
│   │       │
│   │       ├── Section - "숙제" (선택)
│   │       │   ├── Label (Text)
│   │       │   ├── Input (TextArea, 500자)
│   │       │   └── InfoText - "ⓘ 학생에게 알림이 전송됩니다"
│   │       │
│   │       └── Spacer (80pt) ← Fixed Button 여백
│   │
│   └── FixedBottomButtons (View) ← 하단 고정
│       ├── Button (Secondary) - "임시 저장"
│       └── Button (Primary) - "저장 및 공유" ← CTA
│
└── ConfirmDialog (Modal) ← 조건부 렌더링
    └── "작성 중인 내용이 있어요. 임시 저장할까요?"
        ├── Button - "저장 안 함"
        └── Button - "임시 저장"
```

#### Props & State

```typescript
interface LessonRecordCreateScreenProps {
  navigation: StackNavigationProp<HomeStackParamList, 'LessonRecordCreate'>;
  route: RouteProp<HomeStackParamList, 'LessonRecordCreate'>;
}

interface LessonRecordFormState {
  lessonId: string;
  content: string; // 필수, 최소 10자
  progress: Array<{
    bookId: string;
    bookName: string;
    startPage: number;
    endPage: number;
  }>;
  studentStatus: string;
  homework: string;
  isDirty: boolean; // 수정 여부
  isSaving: boolean;
}
```

#### 화면 로직

```typescript
const LessonRecordCreateScreen: FC<LessonRecordCreateScreenProps> = ({ navigation, route }) => {
  const { lessonId } = route.params;
  
  // Lesson 정보 가져오기
  const { data: lesson } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => fetchLesson(lessonId),
  });

  // Form State
  const [content, setContent] = useState('');
  const [progress, setProgress] = useState<Array<ProgressItem>>([]);
  const [studentStatus, setStudentStatus] = useState('');
  const [homework, setHomework] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // UI State
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // 자동 저장 (3분마다)
  useEffect(() => {
    if (!isDirty) return;
    
    const timer = setTimeout(async () => {
      await handleAutoSave();
    }, 3 * 60 * 1000); // 3분

    return () => clearTimeout(timer);
  }, [content, progress, studentStatus, homework]);

  // Handlers
  const handleContentChange = (text: string) => {
    setContent(text);
    setIsDirty(true);
  };

  const handleAddProgress = () => {
    setProgress([...progress, {
      bookId: '',
      bookName: '',
      startPage: 0,
      endPage: 0,
    }]);
  };

  const handleAutoSave = async () => {
    try {
      await saveRecordDraft(lessonId, {
        content,
        progress,
        studentStatus,
        homework,
      });
      
      showToast({
        type: 'info',
        message: '자동 저장되었습니다',
        duration: 2000,
      });
    } catch (error) {
      console.error('Auto save failed:', error);
    }
  };

  const handleTempSave = async () => {
    setIsSaving(true);
    try {
      await saveRecordDraft(lessonId, {
        content,
        progress,
        studentStatus,
        homework,
      });
      
      showToast({
        type: 'success',
        message: '임시 저장되었습니다',
        duration: 2000,
      });
      
      setIsDirty(false);
    } catch (error) {
      showToast({
        type: 'error',
        message: '저장에 실패했습니다',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndShare = async () => {
    // 검증
    if (content.trim().length < 10) {
      showToast({
        type: 'error',
        message: '수업 내용을 조금 더 자세히 작성해주세요 (최소 10자)',
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      // API 호출
      const result = await createLessonRecord(lessonId, {
        content,
        progress,
        studentStatus,
        homework,
      });

      // 성공
      showToast({
        type: 'success',
        message: '수업 기록이 저장되었습니다',
        duration: 2000,
      });

      // 알림 발송 (백그라운드)
      await sendLessonRecordNotification(lessonId);

      // 화면 전환
      navigation.replace('LessonRecordDetail', { recordId: result.id });
    } catch (error) {
      showToast({
        type: 'error',
        message: error.message || '저장에 실패했습니다',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      navigation.goBack();
    }
  };

  // Back Handler (Android)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCancel();
      return true; // 이벤트 소비
    });

    return () => backHandler.remove();
  }, [isDirty]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        type="default"
        title="수업 기록 작성"
        leftAction={{
          icon: 'arrow-left',
          onPress: handleCancel,
          testID: 'cancel-button',
        }}
        rightActions={[
          {
            icon: 'save',
            onPress: handleTempSave,
            testID: 'temp-save-button',
          },
        ]}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Lesson Info (Read-only) */}
          <Card variant="outlined" style={styles.lessonInfo}>
            <Text style={styles.lessonTitle}>
              {lesson?.studentName} - {lesson?.subject}
            </Text>
            <Text style={styles.lessonTime}>
              {formatDateTime(lesson?.startTime)} - {formatTime(lesson?.endTime)}
            </Text>
          </Card>

          {/* 오늘 배운 내용 (필수) */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>오늘 배운 내용</Text>
              <Badge variant="error">필수</Badge>
            </View>
            
            <Input
              multiline
              numberOfLines={5}
              value={content}
              onChangeText={handleContentChange}
              placeholder="오늘 수업에서 배운 내용을 자세히 작성해주세요..."
              maxLength={2000}
              testID="content-input"
            />
            
            {content.trim().length > 0 && content.trim().length < 10 && (
              <Text style={styles.warningText}>
                조금 더 자세히 작성해주세요 (최소 10자)
              </Text>
            )}
          </View>

          {/* 오늘 진행한 진도 (선택) */}
          <View style={styles.section}>
            <Text style={styles.label}>오늘 진행한 진도</Text>
            
            {progress.map((item, index) => (
              <ProgressInput
                key={index}
                value={item}
                onChange={(updated) => {
                  const newProgress = [...progress];
                  newProgress[index] = updated;
                  setProgress(newProgress);
                  setIsDirty(true);
                }}
                onRemove={() => {
                  setProgress(progress.filter((_, i) => i !== index));
                  setIsDirty(true);
                }}
              />
            ))}
            
            {progress.length < 5 && (
              <TouchableOpacity onPress={handleAddProgress} style={styles.addButton}>
                <Text style={styles.addButtonText}>+ 다른 교재 진도 추가</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 학생 상태 (선택) */}
          <View style={styles.section}>
            <Text style={styles.label}>학생 상태</Text>
            
            <Input
              multiline
              numberOfLines={3}
              value={studentStatus}
              onChangeText={(text) => {
                setStudentStatus(text);
                setIsDirty(true);
              }}
              placeholder="오늘 학생의 집중력, 이해도, 컨디션 등을 기록해보세요..."
              maxLength={500}
            />
          </View>

          {/* 숙제 (선택) */}
          <View style={styles.section}>
            <Text style={styles.label}>숙제</Text>
            
            <Input
              multiline
              numberOfLines={3}
              value={homework}
              onChangeText={(text) => {
                setHomework(text);
                setIsDirty(true);
              }}
              placeholder="다음 수업까지 해올 숙제를 작성해주세요..."
              maxLength={500}
            />
            
            <Text style={styles.infoText}>
              ⓘ 학생에게 알림이 전송됩니다
            </Text>
          </View>

          {/* Spacer for Fixed Button */}
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.fixedButtons}>
        <Button
          variant="secondary"
          onPress={handleTempSave}
          loading={isSaving}
          testID="temp-save-bottom-button"
        >
          임시 저장
        </Button>
        
        <Button
          variant="primary"
          onPress={handleSaveAndShare}
          loading={isSaving}
          disabled={content.trim().length < 10}
          testID="save-and-share-button"
        >
          저장 및 공유
        </Button>
      </View>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        visible={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title="작성 중인 내용이 있어요"
        message="임시 저장할까요?"
        actions={[
          {
            label: '저장 안 함',
            onPress: () => {
              setShowCancelDialog(false);
              navigation.goBack();
            },
            testID: 'discard-button',
          },
          {
            label: '임시 저장',
            variant: 'primary',
            onPress: async () => {
              await handleTempSave();
              setShowCancelDialog(false);
              navigation.goBack();
            },
            testID: 'save-and-exit-button',
          },
        ]}
      />
    </SafeAreaView>
  );
};
```

---

## 5. 상태 관리 & 데이터 플로우

### 5.1 상태 관리 아키텍처

```typescript
// Zustand Store 구조

// 1. Auth Store
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// 2. UI Store
interface UIStore {
  isOnline: boolean;
  theme: 'light' | 'dark';
  locale: 'ko' | 'en' | 'ja';
  
  showToast: (toast: ToastProps) => void;
  showDialog: (dialog: DialogProps) => void;
  dismissToast: () => void;
  dismissDialog: () => void;
}

// 3. Notification Store
interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}
```

### 5.2 서버 상태 관리 (React Query)

```typescript
// Query Keys
export const queryKeys = {
  lessons: {
    all: ['lessons'] as const,
    list: (filters: LessonFilters) => ['lessons', 'list', filters] as const,
    detail: (id: string) => ['lessons', 'detail', id] as const,
  },
  groups: {
    all: ['groups'] as const,
    list: () => ['groups', 'list'] as const,
    detail: (id: string) => ['groups', 'detail', id] as const,
  },
  payments: {
    all: ['payments'] as const,
    list: (month: string) => ['payments', 'list', month] as const,
    invoice: (id: string) => ['payments', 'invoice', id] as const,
  },
};

// Custom Hooks
export const useLessons = (filters: LessonFilters) => {
  return useQuery({
    queryKey: queryKeys.lessons.list(filters),
    queryFn: () => fetchLessons(filters),
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
  });
};

export const useLessonDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.lessons.detail(id),
    queryFn: () => fetchLesson(id),
    enabled: !!id,
  });
};

export const useCreateLesson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createLesson,
    onSuccess: (data) => {
      // Cache 무효화
      queryClient.invalidateQueries(queryKeys.lessons.all);
      
      // Optimistic Update
      queryClient.setQueryData(
        queryKeys.lessons.detail(data.id),
        data
      );
    },
  });
};
```

### 5.3 데이터 플로우 다이어그램

```
[사용자 액션]
     ↓
[Component Handler]
     ↓
[Zustand Store / React Query]
     ↓
[API Service Layer]
     ↓
[HTTP Client (Axios)]
     ↓
[Backend API]
     ↓
[Response]
     ↓
[Query Cache Update]
     ↓
[Component Re-render]
     ↓
[UI Update]
```

---

## 6. 애니메이션 & 트랜지션

### 6.1 애니메이션 상수

```typescript
// constants/animations.ts
export const AnimationDuration = {
  INSTANT: 100,
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
} as const;

export const Easing = {
  LINEAR: (t: number) => t,
  EASE_IN: (t: number) => t * t,
  EASE_OUT: (t: number) => t * (2 - t),
  EASE_IN_OUT: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  SPRING: { damping: 20, stiffness: 300 },
} as const;
```

### 6.2 공통 애니메이션 패턴

```typescript
// 1. Fade In/Out
const FadeInOut = ({ children, visible }) => {
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: AnimationDuration.NORMAL,
      easing: Easing.OUT(Easing.EASE),
    });
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

// 2. Slide In/Out
const SlideIn = ({ children, direction = 'up' }) => {
  const translateY = useSharedValue(direction === 'up' ? 1000 : -1000);

  useEffect(() => {
    translateY.value = withSpring(0, Easing.SPRING);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

// 3. Scale Button Press
const ScaleButton = ({ children, onPress }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, Easing.SPRING);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Easing.SPRING);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {children}
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

// 4. Shimmer Loading
const Shimmer = ({ width, height }) => {
  const translateX = useSharedValue(-width);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(width, {
        duration: 1000,
        easing: Easing.LINEAR,
      }),
      -1, // 무한 반복
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ width, height, overflow: 'hidden', backgroundColor: '#E0E0E0' }}>
      <Animated.View
        style={[
          {
            width: width * 2,
            height,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};
```

---

## 7. 에러 처리 & 로딩 상태

### 7.1 에러 바운더리

```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 에러 로깅 (Sentry 등)
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorTitle}>앗, 문제가 발생했어요</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || '알 수 없는 오류가 발생했습니다'}
          </Text>
          <Button
            variant="primary"
            onPress={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset?.();
            }}
          >
            다시 시도
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}
```

### 7.2 로딩 상태 패턴

```typescript
// 1. Skeleton UI
const LessonCardSkeleton = () => (
  <View style={styles.card}>
    <Shimmer width={200} height={20} />
    <Shimmer width={150} height={16} style={{ marginTop: 8 }} />
    <Shimmer width={100} height={32} style={{ marginTop: 12 }} />
  </View>
);

// 2. Full Screen Loader
const FullScreenLoader = ({ message }) => (
  <View style={styles.loaderContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    {message && <Text style={styles.loaderText}>{message}</Text>}
  </View>
);

// 3. Button Loading
const LoadingButton = ({ loading, children, ...props }) => (
  <Button {...props} disabled={loading || props.disabled}>
    {loading ? (
      <ActivityIndicator size="small" color="#FFFFFF" />
    ) : (
      children
    )}
  </Button>
);
```

### 7.3 에러 처리 전략

```typescript
// API Error Handler
export const handleApiError = (error: any) => {
  if (error.response) {
    // 서버 응답 에러 (4xx, 5xx)
    const status = error.response.status;
    const message = error.response.data?.message;

    switch (status) {
      case 400:
        return { type: 'validation', message: message || '입력값이 올바르지 않습니다' };
      case 401:
        return { type: 'auth', message: '로그인이 필요합니다' };
      case 403:
        return { type: 'permission', message: '권한이 없습니다' };
      case 404:
        return { type: 'not_found', message: '요청한 데이터를 찾을 수 없습니다' };
      case 429:
        return { type: 'rate_limit', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요' };
      case 500:
        return { type: 'server', message: '서버 오류가 발생했습니다' };
      default:
        return { type: 'unknown', message: message || '알 수 없는 오류가 발생했습니다' };
    }
  } else if (error.request) {
    // 네트워크 에러 (요청 전송 실패)
    return { type: 'network', message: '네트워크 연결을 확인해주세요' };
  } else {
    // 클라이언트 에러 (요청 생성 실패)
    return { type: 'client', message: error.message };
  }
};

// Usage
try {
  await createLesson(data);
} catch (error) {
  const { type, message } = handleApiError(error);
  
  if (type === 'auth') {
    // 로그아웃 처리
    await logout();
    navigation.replace('Login');
  } else if (type === 'network') {
    // 재시도 다이얼로그
    showDialog({
      title: '네트워크 오류',
      message,
      actions: [
        { label: '취소', onPress: () => {} },
        { label: '다시 시도', onPress: () => createLesson(data) },
      ],
    });
  } else {
    // 일반 토스트
    showToast({ type: 'error', message, duration: 4000 });
  }
}
```

---

## 8. 접근성 & 최적화

### 8.1 접근성 (Accessibility)

```typescript
// 1. 스크린 리더 지원
<TouchableOpacity
  accessible={true}
  accessibilityLabel="로그인 버튼"
  accessibilityHint="탭하면 로그인합니다"
  accessibilityRole="button"
  onPress={handleLogin}
>
  <Text>로그인</Text>
</TouchableOpacity>

// 2. 이미지 대체 텍스트
<Image
  source={logo}
  accessible={true}
  accessibilityLabel="WeTee 로고"
/>

// 3. 폼 필드 레이블
<View accessible={true} accessibilityLabel="이메일 입력 필드">
  <Input
    value={email}
    onChangeText={setEmail}
    accessibilityLabel="이메일"
    accessibilityValue={{ text: email }}
  />
</View>

// 4. 동적 알림
<View
  accessibilityLiveRegion="polite"
  accessibilityLabel={`${unreadCount}개의 읽지 않은 알림이 있습니다`}
>
  <Badge>{unreadCount}</Badge>
</View>
```

### 8.2 성능 최적화

```typescript
// 1. React.memo로 불필요한 리렌더링 방지
const LessonCard = React.memo(({ lesson, onPress }) => {
  return (
    <Card onPress={() => onPress(lesson.id)}>
      {/* ... */}
    </Card>
  );
}, (prevProps, nextProps) => {
  return prevProps.lesson.id === nextProps.lesson.id &&
         prevProps.lesson.attendanceStatus === nextProps.lesson.attendanceStatus;
});

// 2. useCallback으로 함수 메모이제이션
const handleLessonPress = useCallback((lessonId: string) => {
  navigation.navigate('LessonDetail', { lessonId });
}, [navigation]);

// 3. useMemo로 계산 결과 캐싱
const filteredLessons = useMemo(() => {
  return lessons?.filter(lesson => 
    selectedGroup ? lesson.groupId === selectedGroup : true
  ) || [];
}, [lessons, selectedGroup]);

// 4. FlatList 최적화
<FlatList
  data={lessons}
  renderItem={renderLessonCard}
  keyExtractor={(item) => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={5}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: LESSON_CARD_HEIGHT,
    offset: LESSON_CARD_HEIGHT * index,
    index,
  })}
/>

// 5. 이미지 최적화
<Image
  source={{ uri: imageUrl }}
  resizeMode="cover"
  defaultSource={require('@/assets/placeholder.png')}
  loadingIndicatorSource={require('@/assets/loading.png')}
/>
```

---

## 9. 테스트 전략

### 9.1 컴포넌트 테스트 (Jest + React Native Testing Library)

```typescript
// Button.test.tsx
describe('Button Component', () => {
  it('renders correctly with primary variant', () => {
    const { getByText } = render(
      <Button variant="primary" onPress={() => {}}>
        로그인
      </Button>
    );
    
    expect(getByText('로그인')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPressMock = jest.fn();
    const { getByTestID } = render(
      <Button testID="test-button" onPress={onPressMock}>
        클릭
      </Button>
    );
    
    fireEvent.press(getByTestID('test-button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loading', () => {
    const { getByTestID } = render(
      <Button loading testID="test-button" onPress={() => {}}>
        로그인
      </Button>
    );
    
    expect(getByTestID('test-button')).toBeDisabled();
  });
});
```

### 9.2 E2E 테스트 (Detox)

```typescript
// login.e2e.ts
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should login successfully', async () => {
    // 이메일 입력
    await element(by.id('login-email-input')).typeText('test@example.com');
    
    // 비밀번호 입력
    await element(by.id('login-password-input')).typeText('password123');
    
    // 로그인 버튼 탭
    await element(by.id('login-submit-button')).tap();
    
    // 로딩 대기
    await waitFor(element(by.id('calendar-main-screen')))
      .toBeVisible()
      .withTimeout(5000);
    
    // 메인 화면 확인
    await expect(element(by.id('calendar-main-screen'))).toBeVisible();
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('login-email-input')).typeText('wrong@example.com');
    await element(by.id('login-password-input')).typeText('wrong');
    await element(by.id('login-submit-button')).tap();
    
    await expect(element(by.text('이메일 또는 비밀번호가 일치하지 않습니다')))
      .toBeVisible();
  });
});
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| v2.0 | 2024-11-20 | Claude Code 개발자용 기술 명세서로 전면 개편 | AI Assistant |

---

## 참고 문서

- React Native 공식 문서: https://reactnative.dev
- React Navigation 문서: https://reactnavigation.org
- React Native Reanimated 문서: https://docs.swmansion.com/react-native-reanimated
- iOS Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines
- Material Design: https://m3.material.io

---

**다음 단계**:
1. 이 명세서를 바탕으로 컴포넌트 구현 시작
2. Storybook 설정 및 UI 컴포넌트 문서화
3. 통합 테스트 작성
4. 성능 프로파일링 및 최적화

**개발 준비 완료**: ✅ 기술 명세 100% 완료, Claude Code 개발 착수 가능!
