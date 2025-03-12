import { FontAwesome6 } from "@expo/vector-icons";
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BaseToast, BaseToastProps } from 'react-native-toast-message';

const toastConfig = {
    success: (props: BaseToastProps) => (
        <View style={styles.outerContainer}>
            <View style={[styles.container, { borderColor: 'green' }]}>
                <View style={[styles.iconContainer, { backgroundColor: 'green' }]}>
                    <FontAwesome6 name="circle-check" size={24} color="white" />
                </View>
                <BaseToast
                    {...props}
                    style={[styles.toast, { borderLeftWidth: 0 }]}
                    contentContainerStyle={styles.contentContainer}
                    text1Style={styles.text1}
                    text2Style={styles.text2}
                />
            </View>
        </View>
    ),
    error: (props: BaseToastProps) => (
        <View style={styles.outerContainer}>
            <View style={[styles.container, { borderColor: 'red' }]}>
                <View style={[styles.iconContainer, { backgroundColor: 'red' }]}>
                    <FontAwesome6 name="circle-xmark" size={24} color="white" />
                </View>
                <BaseToast
                    {...props}
                    style={[styles.toast, { borderLeftWidth: 0 }]}
                    contentContainerStyle={styles.contentContainer}
                    text1Style={styles.text1}
                    text2Style={styles.text2}
                />
            </View>
        </View>
    ),
    info: (props: BaseToastProps) => (
        <View style={styles.outerContainer}>
            <View style={[styles.container, { borderColor: '#6b2367' }]}>
                <View style={[styles.iconContainer, { backgroundColor: '#6b2367' }]}>
                    <FontAwesome6 name="circle-info" size={24} color="white" />
                </View>
                <BaseToast
                    {...props}
                    style={[styles.toast, { borderLeftWidth: 0 }]}
                    contentContainerStyle={styles.contentContainer}
                    text1Style={styles.text1}
                    text2Style={styles.text2}
                />
            </View>
        </View>
    ),
};

const styles = StyleSheet.create({
    outerContainer: {
        paddingHorizontal: 24,
        width: '100%',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#242424',
        borderRadius: 8,
        borderWidth: 2,
        width: '100%',
    },
    iconContainer: {
        width: 50,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
    },
    toast: {
        flex: 1,
        backgroundColor: '#242424',
    },
    contentContainer: {
        paddingHorizontal: 15,
    },
    text1: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    text2: {
        fontSize: 14,
        color: 'white',
    },
});

export default toastConfig;