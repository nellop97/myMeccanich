// src/utils/analytics.ts
import analytics from '@react-native-firebase/analytics';

export const logRegistration = async (userType: string) => {
    await analytics().logEvent('sign_up', {
        method: 'email',
        user_type: userType
    });
};

export const logHomeScreenView = async () => {
    await analytics().logScreenView({
        screen_name: 'HomeScreen',
        screen_class: 'HomeScreen'
    });
};