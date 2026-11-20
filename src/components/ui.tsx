import React from "react";
import {
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Card as GluestackCard } from "@/components/ui/card";
import {
  Button as GluestackButton,
  ButtonText,
  ButtonSpinner,
} from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Pressable } from "@/components/ui/pressable";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { C, Layout } from "@/constants/design";

export { C } from "@/constants/design";
export const editorialFont = "Lora";
type IconName = keyof typeof Ionicons.glyphMap;

export function Screen({
  children,
  style,
}: React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  animate?: boolean;
}>) {
  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: C.canvas }}
    >
      <Box
        className="w-full flex-1 self-center"
        style={[
          { maxWidth: Layout.maxWidth, paddingHorizontal: Layout.gutter },
          style,
        ]}
      >
        {children}
      </Box>
    </SafeAreaView>
  );
}

export function Heading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <Box className="flex-row items-center justify-between gap-3 pb-6 pt-8">
      <Box className="flex-1">
        <Text
          accessibilityRole="header"
          className="font-editorial text-[36px] leading-[45px] tracking-[-1.2px] text-typography-950"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-1 text-[13px] leading-5 text-typography-600">
            {subtitle}
          </Text>
        ) : null}
      </Box>
      {action}
    </Box>
  );
}

export function Card({
  children,
  style,
  className = "",
}: React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  className?: string;
}>) {
  return (
    <GluestackCard
      variant="outline"
      className={`rounded-2xl border-outline-200 bg-background-0 p-5 ${className}`}
      style={style}
    >
      {children}
    </GluestackCard>
  );
}

export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  busy = false,
  style,
  icon,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: IconName;
}) {
  return (
    <GluestackButton
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || busy, busy }}
      isDisabled={disabled || busy}
      onPress={onPress}
      variant={secondary ? "outline" : "solid"}
      className={`min-h-[52px] h-auto gap-2 rounded-full px-5 py-3 ${secondary ? "border-outline-200 bg-background-0 data-[active=true]:bg-background-50" : "bg-primary-500 data-[active=true]:bg-primary-600"}`}
      style={style}
    >
      {busy ? (
        <ButtonSpinner color={secondary ? C.primary : C.white} />
      ) : icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={secondary ? C.primary : C.white}
        />
      ) : null}
      <ButtonText
        className={`text-[15px] font-semibold ${secondary ? "text-primary-500" : "text-white"}`}
      >
        {title}
      </ButtonText>
    </GluestackButton>
  );
}

export function IconButton({
  name,
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
  tone = "primary",
  busy = false,
}: {
  name: IconName;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  tone?: "primary" | "neutral" | "soft";
  busy?: boolean;
}) {
  const background =
    tone === "primary"
      ? "bg-primary-500 data-[active=true]:bg-primary-600"
      : tone === "soft"
        ? "bg-primary-100 data-[active=true]:bg-primary-200"
        : "border border-outline-200 bg-transparent data-[active=true]:bg-background-50";
  return (
    <GluestackButton
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || busy, busy }}
      isDisabled={disabled || busy}
      onPress={onPress}
      className={`h-11 w-11 rounded-full p-0 ${background}`}
      style={style}
    >
      {busy ? (
        <ButtonSpinner color={tone === "primary" ? C.white : C.primary} />
      ) : (
        <Ionicons
          name={name}
          size={21}
          color={
            tone === "primary" ? C.white : tone === "soft" ? C.primary : C.ink
          }
        />
      )}
    </GluestackButton>
  );
}

export function Field({
  label,
  plain = false,
  trailing,
  ...props
}: TextInputProps & {
  label?: string;
  plain?: boolean;
  trailing?: React.ReactNode;
}) {
  const control = (
    <Input
      isDisabled={props.editable === false}
      variant="outline"
      className={
        plain
          ? "h-auto min-h-11 rounded-none border-0 bg-transparent"
          : "h-auto min-h-[54px] rounded-xl border-outline-200 bg-background-0 data-[focus=true]:border-primary-500"
      }
    >
      <InputField
        {...props}
        aria-label={props.accessibilityLabel ?? label ?? props.placeholder}
        accessibilityLabel={
          props.accessibilityLabel ?? label ?? props.placeholder
        }
        placeholderTextColor={C.muted}
        selectionColor={C.primary}
        className="py-3 text-[15px] text-typography-950"
      />
      {trailing}
    </Input>
  );
  if (!label) return control;
  return (
    <FormControl>
      <FormControlLabel className="mb-2">
        <FormControlLabelText className="text-[13px] font-semibold text-typography-950">
          {label}
        </FormControlLabelText>
      </FormControlLabel>
      {control}
    </FormControl>
  );
}

export function SectionTitle({
  children,
  action,
}: React.PropsWithChildren<{ action?: React.ReactNode }>) {
  return (
    <Box className="mb-2 mt-7 flex-row items-center justify-between">
      <Text
        accessibilityRole="header"
        className="text-[10px] font-medium uppercase tracking-[1.8px] text-typography-950"
      >
        {children}
      </Text>
      {action}
    </Box>
  );
}

export function EmptyState({
  title,
  message,
  icon = "chatbubble-ellipses-outline",
  action,
}: {
  title: string;
  message: string;
  icon?: IconName | "▤" | "✦";
  action?: React.ReactNode;
}) {
  const name =
    icon === "▤"
      ? "documents-outline"
      : icon === "✦"
        ? "checkmark-done-outline"
        : icon;
  return (
    <Box className="flex-1 items-center justify-center px-6 py-10">
      <Box className="mb-5 h-16 w-16 items-center justify-center rounded-full bg-primary-100">
        <Ionicons name={name} size={29} color={C.primary} />
      </Box>
      <Text
        accessibilityRole="header"
        className="font-editorial text-center text-[24px] leading-8 tracking-[-0.5px] text-typography-950"
      >
        {title}
      </Text>
      <Text className="mt-2 max-w-[280px] text-center text-[14px] leading-[22px] text-typography-600">
        {message}
      </Text>
      {action ? <Box className="mt-5">{action}</Box> : null}
    </Box>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: React.PropsWithChildren<{
  tone?: "neutral" | "success" | "warning" | "error" | "primary";
}>) {
  const tones = {
    neutral: { bg: C.canvas, color: C.moss },
    primary: { bg: C.lavender, color: C.primary },
    success: { bg: C.greenTint, color: C.green },
    warning: { bg: "#FFF5E3", color: C.amber },
    error: { bg: "#FCEEF0", color: C.red },
  };
  return (
    <Badge
      action={tone === "primary" ? "info" : tone === "neutral" ? "muted" : tone}
      className="gap-1.5 rounded-full px-2.5 py-1"
      style={{ backgroundColor: tones[tone].bg }}
    >
      <Box
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: tones[tone].color }}
      />
      <BadgeText
        className="text-[11px] font-medium normal-case"
        style={{ color: tones[tone].color }}
      >
        {children}
      </BadgeText>
    </Badge>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <Box
      accessibilityRole="tablist"
      className="flex-row gap-6 border-b border-outline-200"
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: option.value === value }}
          onPress={() => onChange(option.value)}
          className={`min-h-11 items-center justify-center border-b-2 py-2 ${value === option.value ? "border-primary-500" : "border-transparent"}`}
        >
          <Text
            className={`text-[13px] ${value === option.value ? "font-semibold text-typography-950" : "text-typography-600"}`}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </Box>
  );
}

export function CollectionSummary({
  icon,
  title,
  description,
  count,
  detail,
}: {
  icon: IconName;
  title: string;
  description: string;
  count: string;
  detail: string;
}) {
  return (
    <Box className="mb-1 flex-row items-center gap-4 border-b border-t border-outline-200 py-5">
      <Box className="flex-1">
        <Text className="font-editorial text-[21px] leading-7 text-typography-950">
          {title}
        </Text>
        <Text className="mt-1.5 text-xs leading-[19px] text-typography-600">
          {description}
        </Text>
        <Text className="mt-2 text-[10px] uppercase tracking-[1px] text-typography-600">
          {detail}
        </Text>
      </Box>
      <Box className="items-center gap-1 pl-2">
        <Ionicons name={icon} size={22} color={C.primary} />
        <Text className="font-editorial text-[34px] leading-[44px] text-primary-500">
          {count}
        </Text>
      </Box>
    </Box>
  );
}
