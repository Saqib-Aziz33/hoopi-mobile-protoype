import { useState } from "react";
import { Alert } from "react-native";
import { Redirect, Link, type Href } from "expo-router";
import { AuthShell } from "@/components/auth-shell";
import { PasswordField } from "@/components/password-field";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, C, Field } from "@/components/ui";
import { useAuth } from "@/context/auth";

export default function LoginScreen() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Redirect href={"/(tabs)/chat" as Href} />;
  const submit = async () => {
    if (busy) return;
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing details",
        "Enter your email and password to continue.",
      );
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      Alert.alert(
        "Could not sign in",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell
      title={"Welcome\nback."}
      subtitle="Your thoughts, your conversations, your work. Right where you left them."
    >
      <Field
        label="Email address"
        editable={!busy}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@company.com"
        value={email}
        onChangeText={setEmail}
      />
      <PasswordField
        label="Password"
        editable={!busy}
        autoComplete="password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={submit}
      />
      <Button
        title="Sign in"
        icon="arrow-forward"
        onPress={submit}
        busy={busy}
        style={{ marginTop: 8 }}
      />
      <Box className="mt-3 flex-row flex-wrap items-center justify-center">
        <Text className="text-[13px] text-typography-600">New to Hoopi? </Text>
        <Link
          href={"/register" as Href}
          style={{ color: C.primary, fontWeight: "600", paddingVertical: 12 }}
        >
          Create an account
        </Link>
      </Box>
    </AuthShell>
  );
}
