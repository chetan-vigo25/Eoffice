import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ContactsContext = createContext();

export const ContactsProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [disclosed, setDisclosed] = useState(true); // Prevent flicker initially

  // Check if user has already responded to the disclosure
  useEffect(() => {
    const checkDisclosure = async () => {
      const hasDisclosed = await AsyncStorage.getItem('contactPermissionHandled');
      if (hasDisclosed !== 'true') {
        setDisclosed(false); // Show modal if user hasn't responded
      }
    };
    checkDisclosure();
  }, []);

  // Main function to request contact access and fetch contacts
  const fetchContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    await AsyncStorage.setItem('contactPermissionHandled', 'true');
    setDisclosed(true); // Hide disclosure modal

    if (status === 'granted') {
      setPermissionGranted(true);
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      const contactsWithNumbers = data.filter(
        contact => contact.phoneNumbers && contact.phoneNumbers.length > 0
      );

      setContacts(contactsWithNumbers);
    } else {
      setPermissionGranted(false);
    }
  };

  // If user cancels the modal
  const handleCancel = async () => {
    await AsyncStorage.setItem('contactPermissionHandled', 'true');
    setDisclosed(true);
    setPermissionGranted(false);
    setContacts([]); // Optional: clear previous contacts
  };

  // Re-check permission without asking again (for when returning from settings)
  const checkPermissionAndFetch = async () => {
    const { status } = await Contacts.getPermissionsAsync(); // Does not prompt
    if (status === 'granted') {
      setPermissionGranted(true);
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      const contactsWithNumbers = data.filter(
        contact => contact.phoneNumbers && contact.phoneNumbers.length > 0
      );

      setContacts(contactsWithNumbers);
    } else {
      setPermissionGranted(false);
    }
  };

  return (
    <ContactsContext.Provider value={{ contacts, permissionGranted, disclosed, fetchContacts, handleCancel, checkPermissionAndFetch, setDisclosed, }} >
      {children}
    </ContactsContext.Provider>
  );
};

// Custom hook to use the contacts context
export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
};
