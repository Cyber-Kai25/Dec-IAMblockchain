import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CredentialView from '../components/CredentialView';
import getCredential from "./../utils/GetCredential";
import walletAPI from "./../api/walletAPI";

const DocDisplayScreen = ({ navigation }) => {
  const [data, setData] = useState({});
  const [name, setName] = useState("");

  useEffect(() => {
    (async () => {
      AsyncStorage.getItem('DID').then(async (res) => {
        const credential = await getCredential(navigation.state.params.id, res);
        setData(credential);

        try {
          const response = await walletAPI.get(`/getDIDDoc/${credential.issuerDID}`);
          setName(response.data.name);
        } catch (err) {
          console.error("Error fetching issuer name:", err);
          setName("State University");
        }
      });
    })();
  }, []);

  const isEmptyObject = (obj) => {
    return JSON.stringify(obj) === '{}';
  };

  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={{ padding: 16 }}>
      {!isEmptyObject(data) ? (
        <View style={styles.card}>
          <Text style={styles.headerTitle}>Verifiable Credential</Text>
          <View style={styles.divider} />

          {navigation.state.params.type === "Credential" ? (
            <View>
              {/* Type/Title */}
              <View style={styles.headerInfo}>
                <Text style={styles.titleLabel}>Credential Class</Text>
                <Text style={styles.titleText}>{data.type ? data.type[1] : "Credential"}</Text>
              </View>

              {/* Issuer Name */}
              <View style={styles.headerInfo}>
                <Text style={styles.titleLabel}>Issuer</Text>
                <Text style={styles.valueText}>{name || "Authorized Institution"}</Text>
              </View>

              {/* Issuer DID */}
              <View style={styles.headerInfo}>
                <Text style={styles.titleLabel}>Issuer DID</Text>
                <Text style={styles.monospaceTextSmall}>{data.issuerDID}</Text>
              </View>

              {/* Subject Claims list */}
              <Text style={styles.claimsHeader}>Subject Cryptographic Claims</Text>
              <CredentialView object={data} />
            </View>
          ) : null}
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
  headerInfo: {
    marginBottom: 16,
  },
  titleLabel: {
    color: '#00d4ff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  valueText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  monospaceTextSmall: {
    color: '#94a3b8',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  claimsHeader: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 6,
  }
});

export default DocDisplayScreen;