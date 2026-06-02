// Web はウィジェット非対応＝no-op。型もネイティブlibを巻き込まないようローカル定義。
export interface NapsnapWidgetData {
  imageUrl?: string;
  handle?: string;
  stamp?: string;
}
export async function updateNapsnapWidget(_data: NapsnapWidgetData): Promise<void> {}
