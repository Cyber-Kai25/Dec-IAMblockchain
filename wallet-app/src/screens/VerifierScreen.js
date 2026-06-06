import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import walletAPI from "../api/walletAPI";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarCodeScanner } from 'expo-barcode-scanner';
import Dialog from "react-native-dialog";
import { ListItem, Avatar } from 'react-native-elements';
import { MaterialIcons } from '@expo/vector-icons';
import sha256 from 'crypto-js/sha256';

const VerifierScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [currentCredential, setCurrentCredential] = useState({});
  const [currentCredentialIndex, setCurrentCredentialIndex] = useState({});
  const [credentialShareHistory, setCredentialShareHistory] = useState([]);
  const [scanned, setScanned] = useState(0);
  const [visible, setVisible] = useState(false);
  const [userDid, setUserDid] = useState("");

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
      const jsonValue = await AsyncStorage.getItem('ShareHistory');
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
          setCredentialShareHistory(temp.shareHistory || []);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [scanned]);

  useEffect(() => {
    (async () => {
      try {
        const temp = await getCredentialsObject();
        if (temp) {
          setCredentialShareHistory(temp.shareHistory || []);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const getUserDID = async () => {
    if (userDid !== "") {
      return userDid;
    }
    return AsyncStorage.getItem('DID').then((res) => {
      if (res) {
        setUserDid(res);
        return res;
      }
      return null;
    });
  };

  const openQRScanner = () => {
    navigation.navigate("QRScan", { setScanned: setScanned, scanned: scanned, type: 'verifier' });
  };

  const onlistItemPress = (credential, index) => {
    setCurrentCredentialIndex(index);
    setCurrentCredential(credential);
    if (!credential.Access) {
      Alert.alert("Notice", "Access has already been Revoked!");
    } else {
      setVisible(true);
    }
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleAccessRevoke = async () => {
    const did = await getUserDID();
    const hash = sha256(did).toString();
    const keys = await AsyncStorage.getItem('Keys');
    const keysObj = JSON.parse(keys);
    
    try {
      const resp = await walletAPI.post("/sign", {
        hash: hash,
        privateKey: keysObj.PrivateKey,
      });

      const response = await walletAPI.post("/revokeAccess", {
        credDID: currentCredential.CredentialDID,
        ownerDID: did,
        hash: hash,
        sign: resp.data.sign,
        receiverDID: currentCredential.Reciever,
      });

      if (response.status === 200) {
        const temp = {
          Reciever: currentCredential.Reciever,
          Type: currentCredential.Type,
          CredentialDID: currentCredential.CredentialDID,
          Access: false,
          RecieverName: currentCredential.RecieverName,
        };
        setCurrentCredential(temp);
        const tempSharedHistory = [...credentialShareHistory];
        tempSharedHistory[currentCredentialIndex] = temp;
        setCredentialShareHistory(tempSharedHistory);
        const historyObject = { shareHistory: tempSharedHistory };
        const jsonValue = JSON.stringify(historyObject);
        await AsyncStorage.setItem('ShareHistory', jsonValue);
        Alert.alert("Success", "Access Successfully Revoked!");
      } else {
        Alert.alert("Error", "Access Revoke Failed");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Revoking failed due to connection error");
    }
    setVisible(false);
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
          <MaterialIcons name="qr-code-scanner" size={22} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.scanButtonText}>Scan Verifier QR Code</Text>
        </TouchableOpacity>
      </View>

      <Dialog.Container visible={visible} onBackdropPress={handleCancel}>
        <Dialog.Title>Revoke Access</Dialog.Title>
        <Dialog.Description>
          Credential {currentCredential.Type ? (Array.isArray(currentCredential.Type) ? currentCredential.Type[1] || currentCredential.Type[0] : currentCredential.Type) : "Credential"} is shared with {currentCredential.RecieverName}.
          {"\n\n"}
          Do you want to revoke access to this credential?
        </Dialog.Description>
        <Dialog.Button label="Cancel" onPress={handleCancel} />
        <Dialog.Button label="Revoke" onPress={handleAccessRevoke} style={{ color: '#ef4444' }} />
      </Dialog.Container>

      <Text style={styles.textHeadingStyle}>Credential Share History</Text>
      
      {credentialShareHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No credentials shared yet.</Text>
        </View>
      ) : (
        credentialShareHistory.map((item, i) => (
          <ListItem
            key={i}
            onPress={() => onlistItemPress(item, i)}
            containerStyle={styles.listItemContainer}
          >
            <Avatar source={require('./../../assets/documentIcon.png')} />
            <ListItem.Content>
              <ListItem.Title style={styles.itemTitle}>
                Type: {item.Type ? (Array.isArray(item.Type) ? item.Type[1] || item.Type[0] : item.Type) : "Credential"}
              </ListItem.Title>
              <ListItem.Subtitle style={styles.itemSubtitle}>Receiver: {item.RecieverName}</ListItem.Subtitle>
              <ListItem.Subtitle style={styles.itemSubtitleStatus}>
                Status: {item.Access ? "✓ Access Granted" : "✗ Revoked"}
              </ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron color="#7c3aed" />
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
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    elevation: 2,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textHeadingStyle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7c3aed',
    marginHorizontal: 16,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listItemContainer: {
    backgroundColor: '#0a1628',
    borderColor: 'rgba(124, 58, 237, 0.15)',
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
  itemSubtitleStatus: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
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

export default VerifierScreen;