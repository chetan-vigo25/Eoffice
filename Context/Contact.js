import React, { createContext, useContext, useState } from 'react';
import * as Contacts from 'expo-contacts';

const ContactsContext = createContext();

export const ContactsProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState(null);

  const requestContactsPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    setPermissionStatus(status);
    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      const contactsWithNumbers = data.filter(
        contact => contact.phoneNumbers && contact.phoneNumbers.length > 0
      );
      setContacts(contactsWithNumbers);
    }
  };

  return (
    <ContactsContext.Provider value={{ contacts, requestContactsPermission, permissionStatus }}>
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
};
