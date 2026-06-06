import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { ListItem, Avatar } from 'react-native-elements';
import { MaterialIcons } from '@expo/vector-icons';

const IssuerScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [verifiableCredentials, setVerifiableCredentials] = useState([]);
  const [scanned, setScanned] = useState(0);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      const LocalAuthenticationOptions = {
        promptMessage: "Confirm your identity",
      };
      LocalAuthentication.authenticateAsync(LocalAuthenticationOptions).then(async result => {
        if (!result.success) {
          Alert.alert('Biometric authentication failed');
          navigation.navigate('Home');
        }
      });
    })();
  }, []);

  const getCredentialsObject = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('Credentials');
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const temp = await getCredentialsObject();
        if (temp) {
          setVerifiableCredentials(temp.credentials || []);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [scanned]);

  const openQRScanner = () => {
    navigation.navigate("QRScan", { setScanned: setScanned, scanned: scanned, type: 'issuer' });
  };

  const onlistItemPress = (credential) => {
    navigation.navigate("DocDisplay", { type: "Credential", id: credential.hash });
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.infoText}>Requesting camera permission...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>No camera access granted</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.scanButton} onPress={openQRScanner}>
          <MaterialIcons name="qr-code-scanner" size={22} color="#050d1a" style={{ marginRight: 8 }} />
          <Text style={styles.scanButtonText}>Scan QR Code</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.titleStyle}>Previously Issued Credentials</Text>
      
      {verifiableCredentials.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No credentials issued yet.</Text>
        </View>
      ) : (
        verifiableCredentials.map((l, i) => (
          <ListItem
            key={i}
            onPress={() => onlistItemPress(l)}
            containerStyle={styles.listItemContainer}
          >
            <Avatar source={require('./../../assets/documentIcon.png')} />
            <ListItem.Content>
              <ListItem.Title style={styles.itemTitle}>{l.type ? l.type[1] || l.type : "Credential"}</ListItem.Title>
              <ListItem.Subtitle style={styles.itemSubtitle}>Issued By: {l.issuerName}</ListItem.Subtitle>
              <ListItem.Subtitle style={styles.itemSubtitleDate}>{l.issuanceDate}</ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron color="#00d4ff" />
          </ListItem>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050d1a',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#050d1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 15,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    padding: 16,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    paddingVertical: 14,
    elevation: 2,
  },
  scanButtonText: {
    color: '#050d1a',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleStyle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00d4ff',
    marginHorizontal: 16,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listItemContainer: {
    backgroundColor: '#0a1628',
    borderColor: 'rgba(0, 212, 255, 0.12)',
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
  },
  itemTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  itemSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  itemSubtitleDate: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  }
});

export default IssuerScreen;