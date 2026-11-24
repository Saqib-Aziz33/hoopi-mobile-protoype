import { useState } from "react";
import type { TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InputSlot } from "@/components/ui/input";
import { C, Field } from "@/components/ui";

export function PasswordField(props: TextInputProps & { label?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      {...props}
      secureTextEntry={!visible}
      autoCapitalize="none"
      trailing={
        <InputSlot
          accessibilityElementsHidden={false}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          accessibilityState={{
            checked: visible,
            disabled: props.editable === false,
          }}
          disabled={props.editable === false}
          tabIndex={0}
          focusOnPress={false}
          onPress={() => setVisible((value) => !value)}
          className="min-h-11 min-w-12 justify-center pr-3"
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={C.moss}
          />
        </InputSlot>
      }
    />
  );
}
