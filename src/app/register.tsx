import { useState } from "react";
import { Alert } from "react-native";
import { Link, Redirect, type Href } from "expo-router";
import { AuthShell } from "@/components/auth-shell";
import { PasswordField } from "@/components/password-field";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, C, Field } from "@/components/ui";
import { useAuth } from "@/context/auth";
import { authApi } from "@/lib/api";

export default function RegisterScreen() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Redirect href={"/(tabs)/chat" as Href} />;
  const submit = async () => {
    if (busy) return;
    if (!name.trim() || !email.trim() || password.length < 8) {
      Alert.alert(
        "Check your details",
        "Add your name, a valid email, and a password with at least 8 characters.",
      );
      return;
    }
    setBusy(true);
    try {
      await authApi.register(email.trim(), password, name.trim());
      await authApi.login(email.trim(), password);
      await refresh();
    } catch (e) {
      Alert.alert(
        "Could not create account",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell
      title={"A good place\nto begin."}
      subtitle="Make a little space for your ideas, your questions, and what comes next."
    >
      <Field
        label="Full name"
        editable={!busy}
        autoComplete="name"
        placeholder="Your name"
        value={name}
        onChangeText={setName}
      />
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
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={submit}
      />
      <Button
        title="Create account"
        icon="arrow-forward"
        onPress={submit}
        busy={busy}
        style={{ marginTop: 8 }}
      />
      <Box className="mt-2 flex-row flex-wrap items-center justify-center">
        <Text className="text-[13px] text-typography-600">
          Already have an account?{" "}
        </Text>
        <Link
          href={"/login" as Href}
          style={{ color: C.primary, fontWeight: "600", paddingVertical: 12 }}
        >
          Sign in
        </Link>
      </Box>
    </AuthShell>
  );
}
