import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const IndexScreen = () => {
  return (
    <View style={styles.indexContainer}>
      {/* You can customize this with your content */}
      <Text>Welcome to the Index Screen!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  indexContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IndexScreen;
