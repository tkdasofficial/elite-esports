import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase, SUPABASE_URL } from '@/services/supabase';
import { Game } from '@/utils/types';

export function useAdminGames() {
  const [uploading, setUploading] = useState(false);

  const pickBanner = async (): Promise<{ uri: string; fileName: string } | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop() ?? 'jpg';
    const fileName = `${Date.now()}.${ext}`;
    return { uri: asset.uri, fileName };
  };

  const uploadBanner = async (uri: string, fileName: string): Promise<string | null> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const { error } = await supabase.storage
      .from('game-banners')
      .upload(fileName, blob, { contentType: blob.type || 'image/jpeg', upsert: false });
    if (error) throw error;
    return `${SUPABASE_URL}/storage/v1/object/public/game-banners/${fileName}`;
  };

  const addGame = async (name: string, bannerUri?: string, bannerFileName?: string): Promise<{ error: Error | null }> => {
    setUploading(true);
    try {
      let bannerUrl: string | null = null;
      if (bannerUri && bannerFileName) {
        bannerUrl = await uploadBanner(bannerUri, bannerFileName);
      }
      const { error } = await supabase.from('games').insert({ name: name.trim(), banner_url: bannerUrl });
      return { error: error ? new Error(error.message) : null };
    } catch (e: any) {
      return { error: new Error(e.message ?? 'Unknown error') };
    } finally {
      setUploading(false);
    }
  };

  const deleteGame = async (game: Game): Promise<{ error: Error | null }> => {
    if (game.banner_url) {
      const parts = game.banner_url.split('/game-banners/');
      if (parts[1]) {
        await supabase.storage.from('game-banners').remove([parts[1]]);
      }
    }
    const { error } = await supabase.from('games').delete().eq('id', game.id);
    return { error: error ? new Error(error.message) : null };
  };

  return { addGame, deleteGame, pickBanner, uploading };
}
