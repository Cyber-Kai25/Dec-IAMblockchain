import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View, FlatList } from 'react-native';

const CredentialView = ({ object }) => {
  const [listData, setListData] = useState([]);

  useEffect(() => {
    if (object && object.credentialSubject) {
      const temp = Object.keys(object.credentialSubject);
      const tempData = [];
      temp.forEach(element => {
        const curr = object.credentialSubject[element];
        tempData.push({
          [element]: curr
        });
      });
      setListData(tempData);
    }
  }, [object]);

  // Format camelCase keys to Human Readable labels
  const formatLabel = (key) => {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  return (
    <View style={styles.container}>
      {listData.map((item) => {
        const keyName = Object.keys(item)[0];
        const val = object.credentialSubject[keyName];
        return (
          <View key={keyName} style={styles.attributeRow}>
            <Text style={styles.label}>{formatLabel(keyName)}</Text>
            <Text style={styles.valueText}>{String(val)}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  attributeRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  label: {
    color: '#00d4ff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  valueText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  }
});

export default CredentialView;