import type { ComponentProps, ComponentType, ReactElement, ReactNode } from 'react';
import { Picker as NativePicker } from '@react-native-picker/picker';

type mockPickerProps = ComponentProps<typeof NativePicker<string>>;
type mockPickerItemProps = ComponentProps<typeof NativePicker.Item>;
type mockPickerTestProps = mockPickerProps & { readonly children?: ReactNode };
type mockPickerItemTestProps = mockPickerItemProps;
type mockPickerComponent = ComponentType<mockPickerTestProps> & {
  Item: ComponentType<mockPickerItemTestProps>;
};

jest.mock('@react-native-picker/picker', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  type mockTestViewProps = ComponentProps<typeof View> & mockPickerTestProps & mockPickerItemTestProps;
  const mockTestView = View as ComponentType<mockTestViewProps>;

  const mockPicker = (({ children, ...props }: mockPickerTestProps): ReactElement => (
    React.createElement(mockTestView, props, children)
  )) as mockPickerComponent;
  mockPicker.Item = (props: mockPickerItemTestProps): ReactElement => React.createElement(mockTestView, props);

  return { Picker: mockPicker };
});
