import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DIDDisplayScreen = ({ navigation }) => {
  const [data, setData] = useState({});
  const [name, setName] = useState("");

  useEffect(() => {
    const type = navigation.state.params.type;
    if (type === "DID_Document") {
      AsyncStorage.getItem('DID_Document').then(async (res) => {
        if (res) {
          const temp = JSON.parse(res);
          setName(await AsyncStorage.getItem('Name'));
          setData(temp);
        } else {
          alert("DID Document not Found");
        }
      });
    }
  }, []);

  const isEmptyObject = (obj) => {
    return JSON.stringify(obj) === '{}';
  };

  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={{ padding: 16 }}>
      {!isEmptyObject(data) ? (
        <View style={styles.card}>
          <Text style={styles.headerTitle}>Decentralized Identifier Document</Text>
          <View style={styles.divider} />

          {/* User Info */}
          <View style={styles.section}>
            <Text style={styles.label}>Subject Name</Text>
            <Text style={styles.valueText}>{name || "Anonymous User"}</Text>
          </View>

          {/* DID */}
          <View style={styles.section}>
            <Text style={styles.label}>DID string</Text>
            <Text style={styles.monospaceText}>{data.did}</Text>
          </View>

          {/* Contexts */}
          <View style={styles.section}>
            <Text style={styles.label}>Context Schemes</Text>
            {data.context && data.context.map((ctx, idx) => (
              <Text key={idx} style={styles.monospaceTextSmall}>• {ctx}</Text>
            ))}
          </View>

          {/* Verification Keys */}
          <View style={styles.section}>
            <Text style={styles.label}>Verification Method Type</Text>
            <Text style={styles.valueText}>{data.key?.methodType || "RSAVerificationKey2018"}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Owner Reference</Text>
            <Text style={styles.monospaceTextSmall}>{data.key?.owner}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Public Key Hex</Text>
            <Text style={[styles.monospaceTextSmall, styles.publicKeyBox]}>
              {data.key?.publicKey}
            </Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#050d1a',
  },
  card: {
    backgroundColor: '#0a1628',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.12)',
    padding: 24,
    elevation: 3,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  valueText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
  },
  monospaceText: {
    color: '#e2e8f0',
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
  monospaceTextSmall: {
    color: '#94a3b8',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  publicKeyBox: {
    backgroundColor: 'rgba(0, 212, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.08)',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  }
});

export default DIDDisplayScreen;