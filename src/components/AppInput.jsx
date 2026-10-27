import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

// A labelled text field with an optional error message under it.
//   leftIcon      an Ionicons name shown inside the field, on the left
//   rightElement  anything shown inside the field, on the right (for example
//                 the show/hide button of a password field)
// Any other TextInput prop (returnKeyType, onSubmitEditing, autoComplete,
// maxLength ...) is passed through.
export default function AppInput({
  label,
  value,
  handleChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  leftIcon,
  rightElement,
  ...inputProps
}) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.field}>
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={colors.mutedText}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightElement && styles.inputWithRightElement,
            error && styles.errorInput,
          ]}
          {...inputProps}
        />

        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  field: {
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
    ...typography.input,
    backgroundColor: colors.white,
    textAlignVertical: 'center',
  },
  inputWithLeftIcon: {
    paddingLeft: 42,
  },
  inputWithRightElement: {
    paddingRight: 56,
  },
  errorInput: {
    borderColor: colors.error,
  },
  leftIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 1,
  },
  rightElement: {
    position: 'absolute',
    right: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.errorText,
    marginTop: spacing.xs,
    fontSize: 12,
    lineHeight: 17,
  },
});
