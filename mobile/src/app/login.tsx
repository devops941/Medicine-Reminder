import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/config';
import { setGlobalUser } from '@/store';

// Constants

const COLORS = {
    primary: '#0F6E56',
    primaryDark: '#0A5343',
    bg: '#F5F8F6',
    card: '#FFFFFF',
    text: '#14211C',
    muted: '#5B6B64',
    border: '#C4D3CC',
    error: '#B3261E',
};

type Errors = { email?: string; password?: string; form?: string };

export default function LoginScreen() {
    const router = useRouter();
    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Errors>({});

    // Use Animated values to change styles without triggering React re-renders!
    const emailFocusAnim = useRef(new Animated.Value(0)).current;
    const passFocusAnim = useRef(new Animated.Value(0)).current;

    const emailBorder = emailFocusAnim.interpolate({ inputRange: [0, 1], outputRange: [COLORS.border, COLORS.primary] });
    const emailBg = emailFocusAnim.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#F7FCF9'] });

    const passBorder = passFocusAnim.interpolate({ inputRange: [0, 1], outputRange: [COLORS.border, COLORS.primary] });
    const passBg = passFocusAnim.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#F7FCF9'] });

    const validate = (): boolean => {
        const next: Errors = {};
        if (!email.trim()) {
            next.email = 'Enter your email.';
        } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            next.email = 'Enter a valid email, like name@example.com.';
        }
        if (!password) {
            next.password = 'Enter your password.';
        } else if (password.length < 6) {
            next.password = 'Your password has at least 6 characters.';
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleLogin = async () => {
        if (loading || !validate()) return;
        setLoading(true);
        setErrors({});
        try {
            // Hardcoding the IP to bypass Expo's .env cache during local testing
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Login failed');

            setGlobalUser(data.user);
            router.replace('/(tabs)' as any);
        } catch (e) {
            setErrors({
                form: e instanceof Error ? e.message : 'Could not log in. Check your connection and try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <View style={styles.logo}>
                            <Ionicons name="alarm" size={40} color="#FFFFFF" />
                        </View>
                        <Text style={styles.title}>Medicine Reminder</Text>
                        <Text style={styles.subtitle}>Log in to see today's doses.</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.label}>Email</Text>
                        <Animated.View style={[
                            styles.inputRow,
                            { borderColor: emailBorder, backgroundColor: emailBg },
                            errors.email && styles.inputError,
                        ]}>
                            <TextInput
                                ref={emailRef}
                                style={styles.inputInner}
                                value={email}
                                onChangeText={(t) => {
                                    setEmail(t);
                                    if (errors.email) setErrors({ ...errors, email: undefined });
                                }}
                                onFocus={() => Animated.timing(emailFocusAnim, { toValue: 1, duration: 150, useNativeDriver: false }).start()}
                                onBlur={() => Animated.timing(emailFocusAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start()}
                                placeholder="name@example.com"
                                placeholderTextColor={COLORS.muted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => passwordRef.current?.focus()}
                                accessibilityLabel="Email"
                            />
                        </Animated.View>
                        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

                        <Text style={[styles.label, styles.gap]}>Password</Text>
                        <Animated.View
                            style={[
                                styles.inputRow,
                                { borderColor: passBorder, backgroundColor: passBg },
                                errors.password && styles.inputError,
                            ]}>
                            <TextInput
                                ref={passwordRef}
                                style={styles.inputInner}
                                value={password}
                                onChangeText={(t) => {
                                    setPassword(t);
                                    if (errors.password) setErrors({ ...errors, password: undefined });
                                }}
                                onFocus={() => Animated.timing(passFocusAnim, { toValue: 1, duration: 150, useNativeDriver: false }).start()}
                                onBlur={() => Animated.timing(passFocusAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start()}
                                placeholder="Your password"
                                placeholderTextColor={COLORS.muted}
                                secureTextEntry={!showPassword}
                                textContentType="oneTimeCode"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                                accessibilityLabel="Password"
                            />
                            <Pressable
                                onPress={() => setShowPassword((s) => !s)}
                                hitSlop={8}
                                style={styles.eye}
                                accessibilityRole="button"
                                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={24}
                                    color={COLORS.muted}
                                />
                            </Pressable>
                        </Animated.View>
                        {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

                        {errors.form ? <Text style={[styles.error, styles.gap]}>{errors.form}</Text> : null}

                        <Pressable
                            onPress={handleLogin}
                            disabled={loading}
                            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Log in">
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Log in</Text>
                            )}
                        </Pressable>

                        <Pressable
                            onPress={() => Alert.alert('Forgot password', 'Password reset comes later.')}
                            style={styles.linkWrap}>
                            <Text style={styles.link}>Forgot password?</Text>
                        </Pressable>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>New here?</Text>
                        <Pressable
                            onPress={() => router.replace('/signup')}
                            hitSlop={8}>
                            <Text style={styles.link}> Create an account</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    safe: { flex: 1, backgroundColor: COLORS.bg },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 28 },
    logo: {
        width: 76,
        height: 76,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: { fontSize: 28, fontWeight: '700', color: COLORS.text },
    subtitle: { fontSize: 17, color: COLORS.muted, marginTop: 6 },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    label: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
    gap: { marginTop: 16 },
    input: {
        height: 52,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        fontSize: 17,
        color: COLORS.text,
        backgroundColor: '#FFFFFF',
    },
    inputRow: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    inputFocused: {
        borderColor: COLORS.primary,
        backgroundColor: '#F7FCF9',
    },
    // Fixed heights instead of '100%' so the inner input is always tappable on Android
    inputInner: { flex: 1, height: 52, paddingHorizontal: 14, fontSize: 17, color: COLORS.text },
    eye: { paddingHorizontal: 14, height: 52, justifyContent: 'center' },

    inputError: { borderColor: COLORS.error },
    error: { color: COLORS.error, fontSize: 14, marginTop: 6 },
    button: {
        height: 54,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    buttonPressed: { backgroundColor: COLORS.primaryDark },
    buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
    linkWrap: { alignItems: 'center', marginTop: 16, paddingVertical: 4 },
    link: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    footerText: { fontSize: 16, color: COLORS.muted },
});