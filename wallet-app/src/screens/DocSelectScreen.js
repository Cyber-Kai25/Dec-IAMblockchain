import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import walletAPI from "../api/walletAPI";
import sha256 from 'crypto-js/sha256';
import { ListItem, Avatar } from 'react-native-elements';

const DocSelectScreen = ({ navigation }) => {
  const [verifiableCredentials, setVerifiableCredentials] = useState([]);
  const [scanned, setScanned] = useState(0);

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

  const onlistItemPress = async (credential) => {
    const QRData = navigation.state.params.QRData;
    const did = navigation.state.params.did;
    const apiEndPoint = QRData.url;
    const hash = sha256(navigation.state.params.did).toString();
    const keys = await AsyncStorage.getItem('Keys');
    const keysObj = JSON.parse(keys);
    
    try {
      const resp = await walletAPI.post("/sign", {
        hash: hash,
        privateKey: keysObj.PrivateKey,
      });

      const reqBody = JSON.stringify({
        userDid: did,
        userId: QRData.userId,
        receiverDid: QRData.receiverDid,
        documentDid: credential.hash,
        hash: hash,
        sign: resp.data.sign
      });

      const response = await fetch(apiEndPoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: reqBody,
      });

      const json = await response.json();
      if (!json.error) {
        const history = await getHistoryObject();
        const value = {
          Reciever: QRData.receiverDid,
          Type: credential.type,
          CredentialDID: credential.hash,
          Access: true,
          RecieverName: QRData.receiverName || credential.issuerName || "Authorized Institution",
        };

        if (history) {
          const notExists = await checkCredential(value, history);
          if (notExists) {
            history.shareHistory.push(value);
            const jsonValue = JSON.stringify(history);
            await AsyncStorage.setItem('ShareHistory', jsonValue);
          }
        } else {
          const historyNew = { shareHistory: [] };
          historyNew.shareHistory.push(value);
          const jsonValue = JSON.stringify(historyNew);
          await AsyncStorage.setItem('ShareHistory', jsonValue);
        }
        alert(`Credential successfully shared`);
      } else {
        alert(`Credential couldn't be shared`);
      }
    } catch (e) {
      console.error(e);
      alert(`Sharing failed due to connection error`);
    }

    navigation.state.params.setScanned(navigation.state.params.scanned + 1);
    navigation.navigate("Verifier");
  };

  const getTypeName = (type) => {
    if (Array.isArray(type)) {
      return type[1] || type[0] || "Credential";
    }
    return type || "Credential";
  };

  const checkCredential = async (value, curr_credentials) => {
    if (curr_credentials) {
      for (var i = 0; i < curr_credentials.shareHistory.length; ++i) {
        const item = curr_credentials.shareHistory[i];
        const sameReciever = item.Reciever === value.Reciever;
        const sameType = getTypeName(item.Type) === getTypeName(value.Type);

        if (sameReciever && sameType && item.Access) {
          alert(`Credential ${getTypeName(value.Type)} is already shared with ${value.RecieverName}`);
          return false;
        }
        if (sameReciever && sameType && !item.Access) {
          item.Access = true;
          const jsonValue = JSON.stringify(curr_credentials);
          await AsyncStorage.setItem('ShareHistory', jsonValue);
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const getHistoryObject = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('ShareHistory');
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingVertical: 16 }}>
      <Text style={styles.titleStyle}>Select credential to share</Text>
      
      {verifiableCredentials.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No credentials in wallet.</Text>
        </View>
      ) : (
        verifiableCredentials.map((l, i) => (
          <ListItem
            key={i}
            onPress={() => { onlistItemPress(l); }}
            containerStyle={styles.listItemContainer}
          >
            <Avatar source={require('./../../assets/documentIcon.png')} />
            <ListItem.Content>
              <ListItem.Title style={styles.itemTitle}>{l.credentialName || l.type || "Credential"}</ListItem.Title>
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

export default DocSelectScreen;