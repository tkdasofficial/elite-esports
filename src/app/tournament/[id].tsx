import { Redirect, useLocalSearchParams } from 'expo-router';

export default function TournamentRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/match/[id]', params: { id } }} />;
}
