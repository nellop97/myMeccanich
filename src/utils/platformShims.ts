// src/utils/platformShims.ts
import { Platform } from 'react-native';

/**
 * Shim per moduli nativi non disponibili su web
 */

// Date Picker Shim
export const getDatePicker = () => {
  if (Platform.OS === 'web') {
    return null; // Useremo input HTML5
  }
  return require('@react-native-community/datetimepicker').default;
};

// Document Picker Shim
export const getDocumentPicker = () => {
  if (Platform.OS === 'web') {
    return {
      pick: async (options: any) => {
        return new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = options.allowMultiSelection || false;
          input.accept = options.type || '*/*';

          input.onchange = (e: any) => {
            const files = Array.from(e.target.files || []);
            resolve(files.map((file: any) => ({
              uri: URL.createObjectURL(file),
              name: file.name,
              size: file.size,
              type: file.type,
            })));
          };

          input.click();
        });
      },
      types: {
        allFiles: '*/*',
        images: 'image/*',
        pdf: 'application/pdf',
      },
      isCancel: (err: any) => err?.code === 'DOCUMENT_PICKER_CANCELED',
    };
  }
  return require('react-native-document-picker');
};

// Image Picker Shim
export const getImagePicker = () => {
  if (Platform.OS === 'web') {
    return {
      launchCamera: async (options: any, callback: any) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment' as any;

        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              callback({
                assets: [{
                  uri: reader.result,
                  fileName: file.name,
                  fileSize: file.size,
                  type: file.type,
                }],
              });
            };
            reader.readAsDataURL(file);
          }
        };

        input.click();
      },
      launchImageLibrary: async (options: any, callback: any) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              callback({
                assets: [{
                  uri: reader.result,
                  fileName: file.name,
                  fileSize: file.size,
                  type: file.type,
                }],
              });
            };
            reader.readAsDataURL(file);
          }
        };

        input.click();
      },
    };
  }
  return require('react-native-image-picker');
};
