import { Maps } from '@/components/maps/Maps';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const IndexScreen = () => {
  return (
    <View style={styles.indexContainer}>
      <Maps/>
    </View>
  );
};

const styles = StyleSheet.create({
  indexContainer: {
    flex: 1,
    backgroundColor: "black"
  },
});

export default IndexScreen;
