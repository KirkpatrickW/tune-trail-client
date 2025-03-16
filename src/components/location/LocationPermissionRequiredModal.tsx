import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View
} from 'react-native';

interface LocationPermissionRequiredModalProps {
    permissionGranted: boolean | null;
}

export const LocationPermissionRequiredModal: React.FC<LocationPermissionRequiredModalProps> = ({ permissionGranted }) => {
    const screenHeight = Dimensions.get('window').height;
    const slideAnim = useRef(new Animated.Value(screenHeight)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

    useEffect(() => {
        if (!permissionGranted) {
            openModal();
        } else if (permissionGranted && isModalVisible) {
            closeModal();
        }
    }, [permissionGranted])

    const openModal = () => {
        setIsModalVisible(true)

        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: screenHeight,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => setIsModalVisible(false));
    };

    if (!isModalVisible) return null;

    return (
        <View style={styles.modalContainer}>
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

            <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
                <FontAwesome name="exclamation-circle" size={40} style={styles.modalIcon} />
                <Text style={styles.title}>Location Access Required</Text>
                <Text style={styles.subtitle}>This app requires location access to function properly, please allow location access. You can enable it in your device settings.</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: '#242424',
        borderRadius: 10,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#a1a1a1',
        textAlign: 'center',
    },
    modalIcon: {
        color: 'white',
        marginBottom: 10,
    },
});