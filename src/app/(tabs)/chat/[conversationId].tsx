import { useLocalSearchParams } from 'expo-router';
import ChatScreen from '@/components/chat-screen';

export default function SavedChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  return <ChatScreen key={conversationId} savedConversationId={conversationId} />;
}
