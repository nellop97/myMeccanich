import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import React from 'react';
import { Button } from 'react-native-paper';
import { useStore } from '../store';

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { logout } = useStore();

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <Button onPress={logout} style={{ margin: 16 }}>
        Logout
      </Button>
    </DrawerContentScrollView>
  );
};

export default CustomDrawerContent;
