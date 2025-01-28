import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

const LocalityScreen = () => {
    const { id, name } = useLocalSearchParams();

    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Locality Details for {name}</Text>
          <Text>ID: {id}</Text>
        </View>
      </View>
    );

}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
    },
    content: {
      width: "80%",
      padding: 20,
      backgroundColor: "#f0f0f0",
      borderRadius: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 5,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
    },
  });

export default LocalityScreen;