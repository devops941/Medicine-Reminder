import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
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

type Errors = { name?: string; email?: string; password?: string; phone?: string; form?: string };

export default function SignupScreen() {
    const router = useRouter();
    const nameRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const phoneRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Errors>({});

    const nameFocusAnim = useRef(new Animated.Value(0)).current;
    const emailFocusAnim = useRef(new Animated.Value(0)).current;
    const phoneFocusAnim = useRef(new Animated.Value(0)).current;
    const passFocusAnim = useRef(new Animated.Value(0)).current;

    const nameBorder = nameFocusAnim.interpolate({ inputRange: [0, 1], outputRange: [COLORS.border, COLORS.primary] });
    const nameBg = nameFocusAnim.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#F7FCF9'] });
    const emailBorder = emailFocusAnim.interpolate({ inputRange: [0, 1], outputRange: [COLORS.border, COLORS.primary] });
    const emailBg = emailFocusAnim.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#F7FCF9'] });
    const phoneBorder = phoneFocusAnim.interpolate({ inputRange: [0, 1], outputRange: [COLORS.border, COLORS.primary] });
    const phoneBg = phoneFocusAnim.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#F7FCF9'] });
    const passBorder = passFocusAnim.interpolate({ inputRange: [0, 1], outputRange: [COLORS.border, COLORS.primary] });
    const passBg = passFocusAnim.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#F7FCF9'] });

    const validate = (): boolean => {
        const next: Errors = {};
        if (!name.trim()) {
            next.name = 'Enter your name.';
        }
        if (!email.trim()) {
            next.email = 'Enter your email.';
        } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            next.email = 'Enter a valid email.';
        }
        if (!phone.trim()) {
            next.phone = 'Enter your phone number.';
        }
        if (!password) {
            next.password = 'Enter your password.';
        } else if (password.length < 6) {
            next.password = 'Password must be at least 6 characters.';
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSignup = async () => {
        if (loading || !validate()) return;
        setLoading(true);
        setErrors({});
        try {
            // Hardcoding the IP to bypass Expo's .env cache during local testing
            const res = await fetch(`${API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email: email.trim().toLowerCase(), password, phone: phone.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Signup failed');
            
            setGlobalUser(data.user);
            router.replace('/(tabs)' as any);
        } catch (e) {
            setErrors({
                form: e instanceof Error ? e.message : 'Could not sign up. Try again.',
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
                            <Ionicons name="person-add" size={40} color="#FFFFFF" />
                        </View>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join Medicine Reminder today.</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.label}>Full Name</Text>
                        <Animated.View style={[
                            styles.inputRow,
                            { borderColor: nameBorder, backgroundColor: nameBg },
                            errors.name && styles.inputError,
                        ]}>
                            <TextInput
                                ref={nameRef}
                                style={styles.inputInner}
                                value={name}
                                onChangeText={(t) => {
                                    setName(t);
                                    if (errors.name) setErrors({ ...errors, name: undefined });
                                }}
                                onFocus={() => Animated.timing(nameFocusAnim, { toValue: 1, duration: 150, useNativeDriver: false }).start()}
                                onBlur={() => Animated.timing(nameFocusAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start()}
                                placeholder="Your name"
                                placeholderTextColor={COLORS.muted}
                                autoCapitalize="words"
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => emailRef.current?.focus()}
                                accessibilityLabel="Full Name"
                            />
                        </Animated.View>
                        {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

                        <Text style={[styles.label, styles.gap]}>Email</Text>
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
                                onSubmitEditing={() => phoneRef.current?.focus()}
                                accessibilityLabel="Email"
                            />
                        </Animated.View>
                        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

                        <Text style={[styles.label, styles.gap]}>Phone Number</Text>
                        <Animated.View style={[
                            styles.inputRow,
                            { borderColor: phoneBorder, backgroundColor: phoneBg },
                            errors.phone && styles.inputError,
                        ]}>
                            <TextInput
                                ref={phoneRef}
                                style={styles.inputInner}
                                value={phone}
                                onChangeText={(t) => {
                                    setPhone(t);
                                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                                }}
                                onFocus={() => Animated.timing(phoneFocusAnim, { toValue: 1, duration: 150, useNativeDriver: false }).start()}
                                onBlur={() => Animated.timing(phoneFocusAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start()}
                                placeholder="+1 (555) 000-0000"
                                placeholderTextColor={COLORS.muted}
                                keyboardType="phone-pad"
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => passwordRef.current?.focus()}
                                accessibilityLabel="Phone Number"
                            />
                        </Animated.View>
                        {errors.phone ? <Text style={styles.error}>{errors.phone}</Text> : null}

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
                                onSubmitEditing={handleSignup}
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
                            onPress={handleSignup}
                            disabled={loading}
                            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Sign up">
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Sign up</Text>
                            )}
                        </Pressable>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account?</Text>
                        <Pressable
                            onPress={() => router.replace('/login')}
                            hitSlop={8}>
                            <Text style={styles.link}> Log in</Text>
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
    inputRow: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
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
