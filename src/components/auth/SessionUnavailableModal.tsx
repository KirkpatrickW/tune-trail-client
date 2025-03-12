import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LogoutModalProps {
    visible: boolean;
    onClose: () => void;
}

// TODO: This needs redone so that it is not a true modal, similar to the rest.
const SessionUnavailableModal: React.FC<LogoutModalProps> = ({ visible, onClose }) => {
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}>
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPressOut={onClose}>
                <View style={styles.modalContent}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <FontAwesome name="times" size={24} color="#a1a1a1" />
                    </TouchableOpacity>

                    <FontAwesome name="exclamation-circle" size={40} style={styles.modalIcon} />

                    <Text style={styles.modalTitle}>Session Unavailable!</Text>

                    <Text style={styles.modalMessage}>Your session has expired or was cancelled. Please log in again.</Text>

                    <TouchableOpacity style={styles.modalButton}>
                        <Text style={styles.modalButtonText}>LOGIN</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: '#242424',
        borderRadius: 10,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 5,
    },
    modalIcon: {
        color: 'white',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 22,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 16,
        color: '#a1a1a1',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButton: {
        width: '100%',
        padding: 15,
        backgroundColor: '#6b2367',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
});

export default SessionUnavailableModal;