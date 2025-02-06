import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const LocalityScreen = () => {
	const { id, name } = useLocalSearchParams();
	const router = useRouter();

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Locality Details for {name}</Text>
				<Text>ID: {id}</Text>

				<TouchableOpacity onPress={() => router.push({ pathname: '/tracks/search-tracks-modal', params: { name: name } })} style={styles.button}>
					<Text style={styles.buttonText}>Open Search Modal</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	content: {
		width: '80%',
		padding: 20,
		backgroundColor: '#f0f0f0',
		borderRadius: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 5,
		elevation: 5,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	button: {
		marginTop: 20,
		padding: 10,
		backgroundColor: '#007BFF',
		borderRadius: 5,
	},
	buttonText: {
		color: '#fff',
		fontWeight: 'bold',
	},
});

export default LocalityScreen;
