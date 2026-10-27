import AsyncStorage from '@react-native-async-storage/async-storage';

// A simple in-memory store to hold the user data after login/signup
export let globalUser: any = null;

export const setGlobalUser = (user: any) => {
    globalUser = user;
    if (user) {
        AsyncStorage.setItem('globalUser', JSON.stringify(user)).catch(e => console.error(e));
    } else {
        AsyncStorage.removeItem('globalUser').catch(e => console.error(e));
    }
};

export const loadUserFromStorage = async () => {
    try {
        const stored = await AsyncStorage.getItem('globalUser');
        if (stored) {
            globalUser = JSON.parse(stored);
            return globalUser;
        }
    } catch (e) {
        console.error(e);
    }
    return null;
};
