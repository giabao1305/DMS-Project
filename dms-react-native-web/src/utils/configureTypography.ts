import { Platform, Text, TextInput } from "react-native";

const appFontFamily = Platform.select({
  // On native iOS, leaving fontFamily unset gives the real system San Francisco font.
  ios: undefined,
  web: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', 'Segoe UI', Roboto, Arial, sans-serif",
  android: "Roboto",
  default: undefined,
});

type ComponentWithDefaults = {
  defaultProps?: {
    allowFontScaling?: boolean;
    style?: unknown;
  };
};

function appendDefaultFont(component: ComponentWithDefaults) {
  component.defaultProps = component.defaultProps || {};
  component.defaultProps.allowFontScaling = true;
  component.defaultProps.style = [
    component.defaultProps.style,
    {
      ...(appFontFamily ? { fontFamily: appFontFamily } : null),
      includeFontPadding: false,
      letterSpacing: 0,
    },
  ];
}

appendDefaultFont(Text as unknown as ComponentWithDefaults);
appendDefaultFont(TextInput as unknown as ComponentWithDefaults);
