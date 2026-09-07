export type ModelModalities =
  'Text' | 'Text + vision' | 'Text + audio' | 'Text + vision + audio';

export function getModalitiesLabel({
  vision,
  audio,
}: {
  vision: boolean;
  audio: boolean;
}): ModelModalities {
  if (vision && audio) return 'Text + vision + audio';
  if (vision) return 'Text + vision';
  if (audio) return 'Text + audio';
  return 'Text';
}
