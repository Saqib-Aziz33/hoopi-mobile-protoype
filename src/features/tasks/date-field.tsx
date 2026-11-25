import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar } from "react-native-calendars";
import { C } from "@/components/ui";
import { dayKey, dateLabel, dueOnDay } from "./model";
import { Action, Sheet, s } from "./ui";

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(new Date());
  const date = value ? new Date(value) : new Date();
  return (
    <View style={{ gap: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${dateLabel(value)}`}
        onPress={() => {
          setPending(Number.isNaN(date.getTime()) ? new Date() : date);
          setOpen(true);
        }}
        style={s.pick}
      >
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={s.label}>{label}</Text>
          <Text style={{ color: C.primary }}>{dateLabel(value)}</Text>
        </View>
      </Pressable>
      {value ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(null)}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ color: C.moss }}>Clear date</Text>
        </Pressable>
      ) : null}
      {open && Platform.OS === "android" ? (
        <DateTimePicker
          value={Number.isNaN(date.getTime()) ? new Date() : date}
          mode="date"
          onChange={(event, selected) => {
            setOpen(false);
            if (event.type === "set" && selected)
              onChange(dueOnDay(dayKey(selected)));
          }}
        />
      ) : null}
      {open && Platform.OS !== "android" ? (
        <Sheet title={label} onClose={() => setOpen(false)}>
          {Platform.OS === "ios" ? (
            <DateTimePicker
              value={pending}
              mode="date"
              display="inline"
              themeVariant="light"
              accentColor={C.primary}
              onChange={(_event, selected) => {
                if (selected) setPending(selected);
              }}
            />
          ) : (
            <Calendar
              onDayPress={(day) =>
                setPending(new Date(`${day.dateString}T12:00:00`))
              }
              markedDates={{
                [dayKey(pending)]: { selected: true, selectedColor: C.primary },
              }}
            />
          )}
          <Action
            title="Done"
            onPress={() => {
              onChange(dueOnDay(dayKey(pending)));
              setOpen(false);
            }}
          />
        </Sheet>
      ) : null}
    </View>
  );
}
